// src/components/BookingPanel.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarWithSlots from "./CalendarWithSlots";
import { handleBookingWithLock } from "../utils/handleBookingWithLock";

function BookingPanel({ currentUser, service, slots, isCompact = false }) {
  const navigate = useNavigate();

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  // ✅ Not logged in: prompt login
  if (!currentUser) {
    return (
      <div style={panelStyle}>
        <h3 style={titleStyle}>Available Time Slots</h3>
        <p style={textStyle}>Please log in to view available time slots.</p>
        <button onClick={() => navigate("/login")} style={buttonStyle}>
          Log In
        </button>
      </div>
    );
  }

  // ✅ Hide for owner or no slots available
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
      alert("✅ Booking request submitted. Please wait for confirmation.");
    } else {
      alert("❌ " + res.message);
    }
  };

  const handleConfirm = () => {
    if (!selectedSlotId) {
      alert("Please select a time slot first.");
      return;
    }
    handleBook(selectedSlotId);
  };

  // ✅ Mobile: Compact Mode
  if (isCompact) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          padding: "1rem",
          backgroundColor: "#fff",
          borderTop: "1px solid #ddd",
          boxShadow: "0 -2px 6px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        {!showCalendar ? (
          <button
            onClick={() => setShowCalendar(true)}
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "1rem",
              fontWeight: "bold",
              backgroundColor: "#ff5858",
              color: "white",
              border: "none",
              borderRadius: "12px",
            }}
          >
            Book Now
          </button>
        ) : (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <CalendarWithSlots
                slots={slots}
                onBook={(slot) => setSelectedSlotId(slot.id)}
                selectedSlotId={selectedSlotId}
              />
            </div>
            <button
              onClick={handleConfirm}
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1rem",
                fontWeight: "bold",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "12px",
              }}
            >
              Confirm Booking
            </button>
          </>
        )}
      </div>
    );
  }

  // ✅ Desktop: Full Panel
  return (
    <div style={panelStyle}>
      <h3 style={titleStyle}>Available Time Slots</h3>
      <CalendarWithSlots
        slots={slots}
        onBook={(slot) => handleBook(slot.id)}
      />
    </div>
  );
}

export default BookingPanel;

// 💄 Styles
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
