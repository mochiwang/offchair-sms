// src/components/CalendarWithSlots.jsx
import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function CalendarWithSlots({ slots = [], onBook }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 筛选当前选中的日期对应的 slot（精确到年月日）
  const filteredSlots = slots.filter((slot) => {
    const slotDate = new Date(slot.startTime.seconds * 1000);
    return (
      slotDate.getFullYear() === selectedDate.getFullYear() &&
      slotDate.getMonth() === selectedDate.getMonth() &&
      slotDate.getDate() === selectedDate.getDate()
    );
  });

  const formatTimeRange = (start, end) => {
    const s = new Date(start.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const e = new Date(end.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${s} - ${e}`;
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>📅 选择日期：</h3>
      <Calendar
        calendarType="gregory" 
  onChange={setSelectedDate}
  value={selectedDate}

  tileClassName={({ date }) => {
    const hasSlot = slots.some((slot) => {
      const slotDate = new Date(slot.startTime.seconds * 1000);
      return (
        slotDate.getFullYear() === date.getFullYear() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getDate() === date.getDate()
      );
    });
    return hasSlot ? "has-slot" : null; // 👈 有 slot 的日期高亮
  }}
  tileDisabled={({ date, view }) => {
    if (view !== "month") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // 标准化为当天零点
    return date < today;
  }}
/>


      <div style={{ marginTop: "1.5rem" }}>
        <h4>🕓 可预约时间：</h4>
        {filteredSlots.length === 0 ? (
          <p style={{ color: "#999" }}>该日暂无可预约时间</p>
        ) : (
          filteredSlots.map((slot) => (
            <div
              key={slot.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #eee",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem",
              }}
            >
              <span>{formatTimeRange(slot.startTime, slot.endTime)}</span>
              <button
                onClick={() => onBook(slot.id)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#5c4db1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                预约
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CalendarWithSlots;
