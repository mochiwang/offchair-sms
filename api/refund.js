// /api/refund.js
import Stripe from 'stripe';
import admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

// ✅ 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { appointmentId } = req.body;

  if (!appointmentId) return res.status(400).send("Missing appointmentId");

  try {
    const ref = db.collection("appointments").doc(appointmentId);
    const snap = await ref.get();

    if (!snap.exists) return res.status(404).send("Appointment not found");

    const data = snap.data();

    if (!data.paymentIntentId) {
      return res.status(400).send("No paymentIntentId found. Cannot refund.");
    }

    if (data.refunded) {
      return res.status(400).send("Already refunded.");
    }

    // ✅ 发起 Stripe 退款
    const refund = await stripe.refunds.create({
      payment_intent: data.paymentIntentId,
    });

    // ✅ 更新 Firestore 状态
    await ref.update({
      refunded: true,
      cancelledAt: new Date().toISOString(),
      cancelledBy: "user",
      refundId: refund.id,
    });

    console.log("✅ Refund succeeded:", refund.id);

    return res.status(200).json({ success: true, refundId: refund.id });
  } catch (err) {
    console.error("❌ Refund failed:", err);
    return res.status(500).send("Refund failed: " + err.message);
  }
}
