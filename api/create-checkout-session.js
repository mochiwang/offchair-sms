import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // ✅ 添加 CORS 头部，允许调用
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ 如果是预检请求，提前返回
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send("Method not allowed");
  }

  const { serviceId, title, amount, userId, slotId } = req.body;

  // ✅ 构建 appointmentId（基于你 Firestore 的文档 ID 命名逻辑）
  const appointmentId = `${userId}_${slotId}`;

  // ✅ 打印参数用于调试
  console.log("💬 接收到参数：", { serviceId, title, amount, userId, slotId, appointmentId });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
      mode: 'payment',
      metadata: {
        serviceId,
        userId,
        appointmentId, // ✅ 传入精准标识
      },
      success_url: `${req.headers.origin}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pay/cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ 创建支付会话失败:", err.message);
    res.status(500).send("Internal Server Error: " + err.message);
  }
}
