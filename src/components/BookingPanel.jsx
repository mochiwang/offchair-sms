// src/components/BookingPanel.jsx
import CalendarWithSlots from "./CalendarWithSlots";
import { useNavigate } from "react-router-dom";
import { handleBookingWithLock } from "../utils/handleBookingWithLock";

function BookingPanel({ currentUser, service, slots }) {
  const navigate = useNavigate();

  // ✅ 未登录用户：提示登录
  if (!currentUser) {
    return (
      <div style={panelStyle}>
        <h3 style={titleStyle}>可预约时间</h3>
        <p style={textStyle}>请先登录后查看服务可预约时间。</p>
        <button onClick={() => navigate("/login")} style={buttonStyle}>
          立即登录
        </button>
      </div>
    );
  }

  // ✅ 如果是商家本人 or 没有 slot，不展示
  if (currentUser.uid === service.userId || slots.length === 0) {
    return null;
  }

  const handleBook = async (slotId) => {
    const res = await handleBookingWithLock({
      slotId,
      serviceId: service.id,
      userId: currentUser.uid,
    });

    if (res.success) {
      alert("✅ 预约请求已提交，请等待商家确认");
    } else {
      alert("❌ " + res.message);
    }
  };

  return (
    <div style={panelStyle}>
      <h3 style={titleStyle}>可预约时间</h3>
      <CalendarWithSlots slots={slots} onBook={handleBook} />
    </div>
  );
}

export default BookingPanel;

// 💄 样式
const panelStyle = {
  width: "360px",
  padding: "1rem",
  border: "1px solid #eee",
  borderRadius: "10px",
  backgroundColor: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const titleStyle = {
  marginBottom: "1rem",
  fontSize: "1.2rem",
  fontWeight: "bold",
  color: "#111",
};

const textStyle = {
  fontSize: "0.95rem",
  color: "#666",
};

const buttonStyle = {
  marginTop: "0.75rem",
  padding: "8px 16px",
  borderRadius: "6px",
  backgroundColor: "#3b82f6",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};
