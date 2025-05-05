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
    bodyParser: false, // Stripe 要求 raw body
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

  // ✅ 处理支付成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const appointmentId = session?.metadata?.appointmentId;
    const paymentIntentId =
      session.payment_intent ||
      session.paymentIntent ||
      session?.payment_intent?.id ||
      null;

    console.log("💳 收到支付成功通知");
    console.log("📌 appointmentId:", appointmentId);
    console.log("📌 paymentIntentId:", paymentIntentId);

    if (!appointmentId || !paymentIntentId) {
      console.error("❌ 缺少 appointmentId 或 paymentIntentId，完整 session 如下：");
      console.error(JSON.stringify(session, null, 2));
      return res.status(400).send("Missing appointmentId or paymentIntentId");
    }

    try {
      const db = admin.firestore();

      const updateData = {
        paid: true,
        paymentIntentId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      console.log("📝 准备写入 Firestore:", updateData);

      await db.collection('appointments').doc(appointmentId).update(updateData);

      console.log(`✅ Firestore 已更新预约 ${appointmentId}，写入成功`);
    } catch (err) {
      console.error('❌ Firestore 更新失败:', err.message);
      return res.status(500).send('Firestore update failed');
    }
  }

  // ✅ 告知 Stripe 已成功接收事件，避免重试
  res.status(200).json({ received: true });
}
