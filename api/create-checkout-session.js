import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // ✅ 添加 CORS 头部，允许本地和线上调用
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ 预检请求直接返回
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ❌ 拒绝非 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).send("Method not allowed");
  }

  const { serviceId, title, amount, userId } = req.body;

  // ✅ 打印传入参数用于调试
  console.log("💬 接收到参数：", { serviceId, title, amount, userId });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title || "Unnamed Service"
            },
            unit_amount: Math.round(amount * 100), // 单位为美分，必须为整数
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

    // ✅ 返回测试阶段的直接跳转 URL
    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("❌ 创建支付会话失败:", err.message);
    console.error("🔍 堆栈信息:", err.stack);
    res.status(500).send("Internal Server Error: " + err.message);
  }
}
