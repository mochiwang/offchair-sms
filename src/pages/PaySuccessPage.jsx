// src/pages/PaySuccessPage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PaySuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const clearAfterSuccess = setTimeout(() => {
      navigate("/mypage");
    }, 3000);
    return () => clearTimeout(clearAfterSuccess);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <h2 style={{ color: "#16a34a" }}>✅ 支付成功！</h2>
      <p>你已完成预约支付，将在 3 秒后返回“我的主页”</p>
    </div>
  );
}

export default PaySuccessPage;
