// /api/stripe-webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from 'firebase-admin';

// ✅ 初始化 Stripe 实例
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ 初始化 Firebase Admin（只执行一次）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)),
  });
}

export const config = {
  api: {
    bodyParser: false, // ❗ 必须关闭 bodyParser 否则 Stripe 验证失败
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook 验证失败:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ 捕捉支付成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const appointmentId = session.metadata?.appointmentId;

    console.log("💳 收到支付完成事件 for:", appointmentId);

    if (!appointmentId) {
      console.error("❌ metadata 中缺少 appointmentId");
      return res.status(400).send("Missing appointmentId");
    }

    try {
      const db = admin.firestore();
      await db.collection('appointments').doc(appointmentId).update({
        paid: true,
      });

      console.log(`✅ Firestore 已成功将 ${appointmentId} 标记为已付款`);
    } catch (err) {
      console.error('❌ 更新 Firestore 失败:', err);
      return res.status(500).send('Firestore update failed');
    }
  }

  res.status(200).json({ received: true });
}
