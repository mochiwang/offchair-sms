// src/pages/TestPage.jsx
import { useState } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import app from "../firebase";

const db = getFirestore(app);

function TestPage() {
  const [smsStatus, setSmsStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMarkAsMember = async () => {
    const userId = "0eYzdYyCsvhRdy88hfWd8LUOOLu2";
    const userRef = doc(db, "users", userId);
    try {
      await setDoc(userRef, { isMember: true }, { merge: true });
      alert("✅ 成功标记该用户为会员！");
    } catch (error) {
      console.error("❌ 出错：", error);
      alert("❌ 标记失败，请查看控制台！");
    }
  };

  const handleSendSMS = async () => {
    setLoading(true);
    setSmsStatus(null);
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "+185554902594", // 你的测试手机号
          message: "这是一条来自 TestPage 的测试短信 🚀",
        }),
      });
      
      // 👉 先尝试读取文本，避免 JSON 格式错误
      const raw = await res.text();
      console.log("📦 原始响应：", raw);

      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        setSmsStatus("❌ 返回的不是合法 JSON：" + raw);
        setLoading(false);
        return;
      }

      if (data.sid) {
        setSmsStatus("✅ 短信发送成功，SID：" + data.sid);
      } else {
        setSmsStatus("❌ 发送失败：" + (data.message || "未知错误"));
      }
    } catch (error) {
      console.error("❌ 出错：", error);
      setSmsStatus("❌ 出错：" + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>开发者测试页面</h2>

      <button
        onClick={handleMarkAsMember}
        style={{
          padding: "10px 20px",
          fontSize: "1rem",
          backgroundColor: "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginRight: "1rem",
        }}
      >
        设置该用户为会员
      </button>

      <button
        onClick={handleSendSMS}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "1rem",
          backgroundColor: "#2196f3",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {loading ? "发送中..." : "测试发送短信"}
      </button>

      {smsStatus && <p style={{ marginTop: "1rem" }}>{smsStatus}</p>}
    </div>
  );
}

export default TestPage;
