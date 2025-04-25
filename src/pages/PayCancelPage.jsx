// src/pages/PayCancelPage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PayCancelPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const clearAfterCancel = setTimeout(() => {
      navigate("/mypage");
    }, 3000);
    return () => clearTimeout(clearAfterCancel);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <h2 style={{ color: "#dc2626" }}>❌ 支付已取消</h2>
      <p>你已取消付款，将在 3 秒后返回“我的主页”</p>
    </div>
  );
}

export default PayCancelPage;
