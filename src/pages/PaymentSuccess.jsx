import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    console.log("✅ Payment successful, session_id:", sessionId);

    // 👉 You can optionally fetch the session details here in the future
  }, []);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>🎉 Payment Successful!</h1>
      <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
        Your booking is now confirmed. The provider will get in touch with you soon.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
        <button
          onClick={() => navigate("/my-bookings")}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          View My Bookings
        </button>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#eee",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
