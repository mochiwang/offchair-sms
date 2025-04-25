// src/pages/PayPage.jsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";

// 安全使用环境变量加载 Stripe 公钥
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// 根据环境判断 API 请求地址
const API_BASE = import.meta.env.MODE === "development"
  ? "https://offchair.vercel.app" // 本地开发使用线上 API
  : ""; // 线上部署使用相对路径

function PayPage() {
  const { appointmentId } = useParams(); // 路由：/pay/:appointmentId

  useEffect(() => {
    const redirectToCheckout = async () => {
      const stripe = await stripePromise;

      try {
        const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId }),
        });

        const data = await res.json();

        if (data.sessionId) {
          const result = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });

          if (result.error) {
            alert("跳转支付失败：" + result.error.message);
          }
        } else {
          alert("创建支付会话失败，请稍后重试");
        }
      } catch (err) {
        console.error("请求 Stripe 会话失败：", err);
        alert("连接支付服务器失败，请稍后重试");
      }
    };

    redirectToCheckout();
  }, [appointmentId]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>正在跳转支付页面，请稍候...</h2>
    </div>
  );
}

export default PayPage;
