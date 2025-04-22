// src/components/BookingPanel.jsx
import CalendarWithSlots from "./CalendarWithSlots";

function BookingPanel({ currentUser, service, slots, handleBooking }) {
  // 不展示条件：商家本人 或 无 slot
  if (!currentUser || currentUser.uid === service.userId || slots.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        width: "360px",
        padding: "1rem",
        border: "1px solid #eee",
        borderRadius: "10px",
      }}
    >
      <h4 style={{ marginBottom: "1rem" }}>可预约时间</h4>
      <CalendarWithSlots slots={slots} onBook={handleBooking} />
    </div>
  );
}

export default BookingPanel;
