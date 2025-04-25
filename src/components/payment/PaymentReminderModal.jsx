// src/components/payment/PaymentReminderModal.jsx
import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../../firebase";
import { useNavigate } from "react-router-dom";

const db = getFirestore(app);
const auth = getAuth(app);

function PaymentReminderModal() {
  const [show, setShow] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem("dismissedPaymentReminder");
    if (dismissed === "true") return;

    const checkUnpaid = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid),
        where("status", "==", "confirmed"),
        where("paid", "==", false)
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        const first = snap.docs[0];
        setAppointmentId(first.id);
        setShow(true);
      }
    };

    checkUnpaid();
  }, []);

  if (!show || !appointmentId) return null;

  const dismissReminder = () => {
    localStorage.setItem("dismissedPaymentReminder", "true");
    setShow(false);
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: "1rem" }}>💳 待付款提醒</h3>
        <p style={{ marginBottom: "1.5rem", fontSize: "1rem", color: "#333" }}>
          你有一个已确认但未付款的预约，请尽快完成付款。
        </p>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => navigate(`/pay/${appointmentId}`)}
            style={primaryButton}
          >
            去付款
          </button>
          <button
            onClick={dismissReminder}
            style={secondaryButton}
          >
            今天不再提醒
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentReminderModal;

// 样式
const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "2rem",
  borderRadius: "10px",
  width: "90%",
  maxWidth: "420px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  textAlign: "center",
};

const primaryButton = {
  padding: "10px 20px",
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const secondaryButton = {
  padding: "10px 20px",
  backgroundColor: "#eee",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: "6px",
  cursor: "pointer",
};
