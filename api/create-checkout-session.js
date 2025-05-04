import Stripe from 'stripe';
import admin from 'firebase-admin';

// ✅ 初始化 Stripe 实例
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ 初始化 Firebase Admin（只执行一次）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // ✅ CORS 设置
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { serviceId, title, amount, userId, slotId } = req.body;
  if (!serviceId || !userId || !slotId) {
    return res.status(400).send("Missing parameters");
  }

  // 构建 appointmentId
  const appointmentId = `${userId}_${slotId}`;

  try {
    // ✅ 获取服务对应的 stripeAccountId
    const serviceRef = db.collection("services").doc(serviceId);
    const serviceSnap = await serviceRef.get();
    if (!serviceSnap.exists) return res.status(404).send("Service not found");

    const serviceData = serviceSnap.data();
    const stripeAccountId = serviceData.stripeAccountId;
    if (!stripeAccountId) return res.status(400).send("Service missing Stripe account");

    // ✅ 创建 checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: title || "Unnamed Service" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        appointmentId,
        serviceId,
        userId,
      },
      payment_intent_data: {
        transfer_data: {
          destination: stripeAccountId, // ✅ 商家收款账户
        },
        application_fee_amount: Math.round(amount * 0.1 * 100), // ✅ 平台抽成 10%
      },
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pay/cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ 创建支付会话失败:", err);
    res.status(500).send("Internal Server Error: " + err.message);
  }
}
