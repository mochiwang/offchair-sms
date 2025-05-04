import Stripe from 'stripe';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)),
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send("Method not allowed");

  const { serviceId, title, amount, userId, slotId } = req.body;
  const appointmentId = `${userId}_${slotId}`;
  console.log("💬 接收到参数：", { serviceId, title, amount, userId, slotId, appointmentId });

  try {
    // ✅ 查找商家的 Stripe Connect 账户 ID
    const serviceDoc = await admin.firestore().collection("services").doc(serviceId).get();
    const service = serviceDoc.data();
    const connectedAccountId = service?.stripeAccountId;

    if (!connectedAccountId) {
      return res.status(400).send("Service provider has not connected Stripe.");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title || "Unnamed Service",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        serviceId,
        userId,
        appointmentId,
      },
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pay/cancel`,
      payment_intent_data: {
        application_fee_amount: Math.floor(amount * 100 * 0.1), // 10% 抽成
        transfer_data: {
          destination: connectedAccountId,
        },
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ 创建支付会话失败:", err.message);
    res.status(500).send("Internal Server Error: " + err.message);
  }
}
