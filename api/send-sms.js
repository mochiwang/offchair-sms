// /api/send-sms.js
import twilio from "twilio";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ success: false, message: "Missing phone number or message" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return res.status(500).json({
      success: false,
      message: "Missing Twilio environment variables",
    });
  }

  const client = twilio(accountSid, authToken); // ✅ 使用 import 的 twilio

  try {
    const result = await client.messages.create({
      body: message,
      from,
      to,
    });

    return res.status(200).json({
      success: true,
      sid: result.sid,
    });
  } catch (error) {
    console.error("❌ Twilio 发送失败：", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send SMS",
    });
  }
}
