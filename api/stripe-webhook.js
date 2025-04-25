// /api/stripe-webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';
import admin from 'firebase-admin';

// 初始化 Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 初始化 Firebase Admin（只执行一次）
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
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook 验证失败', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 💳 支付成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { serviceId, userId } = session.metadata;

    try {
      const db = admin.firestore();
      const appointmentId = `${userId}_${serviceId}`;
      await db.collection('appointments').doc(appointmentId).set(
        { paid: true },
        { merge: true }
      );

      console.log(`✅ 已更新 ${appointmentId} 为已付款`);
    } catch (err) {
      console.error('❌ 写入 Firestore 失败', err);
    }
  }

  res.status(200).json({ received: true });
}
