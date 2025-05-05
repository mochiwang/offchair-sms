// /api/create-stripe-account.js
import Stripe from 'stripe';
import admin from 'firebase-admin';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { uid, email } = req.body;
  if (!uid || !email) return res.status(400).send('Missing uid or email');

  try {
    // 1. 创建 Stripe Express Connected Account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: { transfers: { requested: true } },
    });

    // 2. 保存账户 ID 到 Firestore 用户档案中
    await db.collection('users').doc(uid).set({ stripeAccountId: account.id }, { merge: true });

    // 3. 生成 Onboarding 链接
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/complete`,
      type: 'account_onboarding',
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err) {
    console.error('Error creating Stripe account:', err);
    return res.status(500).json({ error: 'Internal Server Error' });

  }
}
