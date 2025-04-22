// /api/send-sms.js
import twilio from "twilio";

export default async function handler(req, res) {
  // ✅ 添加 CORS 头信息，允许本地和远程调用
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ 限制只允许 POST 请求
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  // ✅ 提取 body 参数
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ success: false, message: "Missing phone number or message" });
  }

  // ✅ 检查环境变量
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  // ✅ 👇 加这一段日志
console.log("🔍 Twilio 环境变量检查：", {
    TWILIO_ACCOUNT_SID: accountSid,
    TWILIO_AUTH_TOKEN: authToken ? "(已读取)" : "(未读取)",
    TWILIO_PHONE_NUMBER: from
  });

  if (!accountSid || !authToken || !from) {
    return res.status(500).json({
      success: false,
      message: "Missing Twilio environment variables",
    });
  }

  // ✅ 初始化 Twilio 客户端
  const client = twilio(accountSid, authToken);

  try {
    // ✅ 发送短信
    const result = await client.messages.create({
      body: message,
      from,
      to,
    });

    // ✅ 成功返回
    return res.status(200).json({
      success: true,
      sid: result.sid,
    });
  } catch (error) {
    // ❌ 错误处理
    console.error("❌ Twilio 发送失败：", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send SMS",
    });
  }
}
