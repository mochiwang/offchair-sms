// pages/api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // ✅ 添加 CORS 头部，允许 localhost 调用
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ 如果是浏览器的预检请求，提前响应
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { serviceId, title, amount, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: title },
            unit_amount: amount * 100, // 单位是美分
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        serviceId,
        userId,
      },
      success_url: `${req.headers.origin}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pay/cancel`,
    });

    // ✅ 测试阶段返回 session.url 供前端直接跳转
    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("❌ 创建支付会话失败", err);
    res.status(500).send("Internal Server Error: " + err.message);

  }
}
