// src/components/CalendarWithSlots.jsx
import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function CalendarWithSlots({ slots = [], onBook, selectedSlotId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

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
      <h3>📅 Select a Date:</h3>
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
          return hasSlot ? "has-slot" : null;
        }}
        tileDisabled={({ date, view }) => {
          if (view !== "month") return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date < today;
        }}
      />

      <div style={{ marginTop: "1.5rem" }}>
        <h4>🕓 Available Slots:</h4>
        {filteredSlots.length === 0 ? (
          <p style={{ color: "#999" }}>No available slots for this date.</p>
        ) : (
          filteredSlots.map((slot) => (
            <div
              key={slot.id}
              onClick={() => onBook(slot)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #eee",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem",
                backgroundColor:
                  selectedSlotId === slot.id ? "#f0f8ff" : "white",
                cursor: "pointer",
                transition: "background-color 0.25s ease",
              }}
            >
              <span>{formatTimeRange(slot.startTime, slot.endTime)}</span>
              {selectedSlotId === slot.id && (
                <span style={{ color: "#5c4db1", fontWeight: "bold" }}>
                  Selected
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CalendarWithSlots;
