import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)),
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

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

    // ✅ Step 1: 打印完整结构和关键字段
    console.log("🧾 Session 全部内容:", JSON.stringify(session, null, 2));
    console.log("🧾 session.metadata:", JSON.stringify(session.metadata));
    console.log("🧾 session.payment_intent:", JSON.stringify(session.payment_intent));

    // ✅ Step 2: 抽取关键数据
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

    // ✅ Step 3: 写入 Firestore
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

  // ✅ Step 4: 返回 200，避免 Stripe 重试
  res.status(200).json({ received: true });
}
