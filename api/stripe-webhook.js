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
    bodyParser: false, // ❗必须禁用 bodyParser，否则 Stripe 验证失败
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // ✅ 打印完整 session 对象（调试专用）
    console.log("🧾 完整 session 内容:", JSON.stringify(session, null, 2));

    const appointmentId = session.metadata?.appointmentId;
    const paymentIntentId =
      typeof session.payment_intent === 'object'
        ? session.payment_intent.id
        : session.payment_intent || session.paymentIntent;

    console.log("💳 收到支付成功通知");
    console.log("📌 appointmentId:", appointmentId);
    console.log("📌 paymentIntentId:", paymentIntentId);

    if (!appointmentId || !paymentIntentId) {
      console.error("❌ 缺少 appointmentId 或 paymentIntentId");
      return res.status(400).send("Missing appointmentId or paymentIntentId");
    }

    try {
      const db = admin.firestore();
      await db.collection('appointments').doc(appointmentId).update({
        paid: true,
        paymentIntentId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Firestore 更新成功: ${appointmentId} 已标记为已付款`);
    } catch (err) {
      console.error('❌ Firestore 更新失败:', err.message);
      return res.status(500).send('Firestore update failed');
    }
  }

  res.status(200).json({ received: true });
}
