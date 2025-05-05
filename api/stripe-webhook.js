import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ 初始化 Firebase Admin SDK（只执行一次）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)),
  });
}

export const config = {
  api: {
    bodyParser: false, // ❗ 必须禁用 bodyParser 否则 Stripe 验证失败
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
    console.error('❌ Stripe Webhook 验证失败:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ 处理成功支付事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const appointmentId = session.metadata?.appointmentId;
    const paymentIntentId = session.payment_intent; // Stripe 标准字段

    // ✅ 清晰日志：检查所有相关字段
    console.log(`💳 收到支付成功通知：
- session.id: ${session.id}
- appointmentId: ${appointmentId}
- paymentIntentId: ${paymentIntentId}
- session.payment_intent (raw):`, session.payment_intent);

    if (!appointmentId || !paymentIntentId) {
      console.error("❌ 缺少 appointmentId 或 paymentIntentId，终止更新");
      return res.status(400).send("Missing appointmentId or paymentIntentId");
    }

    try {
      const db = admin.firestore();

      await db.collection('appointments').doc(appointmentId).update({
        paid: true,
        paymentIntentId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Firestore 更新成功：已将 ${appointmentId} 标记为已付款`);
    } catch (err) {
      console.error('❌ Firestore 更新失败:', err.message);
      return res.status(500).send('Firestore update failed');
    }
  }

  // ✅ 告诉 Stripe：我们成功处理了
  res.status(200).json({ received: true });
}
