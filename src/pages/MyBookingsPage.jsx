import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import HeroNavBar from "../components/HeroNavBar";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { cancelExpiredUnpaidAppointments } from "../utils/cancelExpiredUnpaidAppointments";

const db = getFirestore(app);
const auth = getAuth(app);
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function MyBookingsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const API_BASE = import.meta.env.MODE === "development"
    ? "https://offchair.vercel.app"
    : "";

  useEffect(() => {
    cancelExpiredUnpaidAppointments().then(res => {
      console.log(`✅ Automatically canceled ${res.cancelled} expired unpaid appointments.`);
    });
  }, []);

  const fetchAppointments = async () => {
    if (!currentUser) return;

    const guestQ = query(
      collection(db, "appointments"),
      where("userId", "==", currentUser.uid)
    );
    
    const merchantQ = query(
      collection(db, "appointments"),
      where("serviceOwnerId", "==", currentUser.uid)
    );
    
    const [guestSnap, merchantSnap] = await Promise.all([
      getDocs(guestQ),
      getDocs(merchantQ),
    ]);
    
    const snap = [...guestSnap.docs, ...merchantSnap.docs];
    const seen = new Set();
    const deduped = snap.filter(d => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
    

    const list = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const serviceSnap = await getDoc(doc(db, "services", data.serviceId));
        const service = serviceSnap.exists() ? serviceSnap.data() : null;

        const guestSnap = await getDoc(doc(db, "users", data.userId));
        const guest = guestSnap.exists() ? guestSnap.data() : { displayName: "Anonymous" };

        return {
          ...data,
          id: d.id,
          service,
          guest,
          serviceOwnerId: service?.userId || "",
        };
      })
    );

    const now = Date.now();
    const future = list.filter((b) => {
      const end = b.endTime?.seconds * 1000;
      return end && end > now;
    });

    const myAppointments = future.filter(
      (b) =>
        b.userId === currentUser.uid || b.serviceOwnerId === currentUser.uid
    );

    setAppointments(myAppointments);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
    window.scrollTo(0, 0);
  }, [currentUser]);

  const handleCancel = async (bookingId, slotId) => {
    await deleteDoc(doc(db, "appointments", bookingId));
    await setDoc(doc(db, "slots", slotId), { available: true, userId: null, locked: false }, { merge: true });
    setAppointments((prev) => prev.filter((b) => b.id !== bookingId));
    alert("Booking canceled.");
  };

  const handleConfirm = async (bookingId, userId) => {
    try {
      const deadline = Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000));
      await updateDoc(doc(db, "appointments", bookingId), {
        status: "confirmed",
        paid: false,
        paymentDeadline: deadline,
        confirmedAt: serverTimestamp(),
      });

      setAppointments((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "confirmed", paid: false, paymentDeadline: deadline } : b
        )
      );

      alert("✅ Appointment confirmed. Guest has been reminded to pay.");

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const user = userSnap.exists() ? userSnap.data() : null;

      if (user?.isMember && user.phoneNumber) {
        await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: user.phoneNumber,
            message: `Your appointment has been confirmed. Please complete the payment.`,
          }),
        });
        console.log("📩 SMS reminder sent to guest.");
      } else {
        console.log("📭 Non-member or no phone number, SMS not sent.");
      }
    } catch (err) {
      console.error("❌ Failed to confirm appointment:", err);
      alert("❌ Confirmation failed. Please try again later.");
    }
  };

  const handleCheckout = async (booking) => {
    try {
      const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: booking.serviceId,
          title: booking.service?.title || "Service",
          amount: booking.service?.price || 100,
          userId: booking.userId,
          slotId: booking.slotId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ API request failed:", res.status, text);
        alert("Server error: " + text);
        return;
      }

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("❌ Failed to get payment link.");
      }
    } catch (error) {
      console.error("Stripe checkout failed:", error);
      alert("❌ Payment failed. Please try again later.");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <HeroNavBar variant="normal" />
      <div style={{ padding: "6rem 1rem 2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>My Bookings</h2>

        {appointments.length === 0 ? (
          <EmptyState message="You don't have any upcoming bookings yet." icon="📅" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
            {appointments.map((b) => {
              const isGuest = b.userId === currentUser.uid;
              const isMerchant = b.serviceOwnerId === currentUser.uid;

              const bgColor = isGuest ? "#f9f5ff" : "#f0f9ff";
              const borderColor = isGuest ? "#d8b4fe" : "#93c5fd";

              return (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: "16px",
                    padding: "1.25rem",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#111" }}>
                    {b.service?.title || "Unknown Service"}
                  </h3>
                  <p style={{ margin: "6px 0", color: "#555" }}>
                    🕒 {new Date(b.startTime.seconds * 1000).toLocaleString()}
                  </p>
                  <p style={{ margin: "6px 0", color: "#666" }}>
                    Status: {b.status === "confirmed" ? "✅ Confirmed" : "⏳ Awaiting confirmation"}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
                    {isGuest && (
                      <>
                        {b.status === "confirmed" && !b.paid && (
                          <button onClick={() => handleCheckout(b)} style={buttonStyle("#fffbea", "#facc15", "#b45309")}>
                            Pay Now 💳
                          </button>
                        )}
                        <button onClick={() => navigate(`/detail/${b.serviceId}`)} style={buttonStyle("#f4f4f5", "#ccc")}>
                          View Service
                        </button>
                        <button onClick={() => handleCancel(b.id, b.slotId)} style={buttonStyle("#ffecec", "#d33", "#d33")}>
                          Cancel Booking
                        </button>
                      </>
                    )}

                    {isMerchant && (
                      <>
                        {b.status === "booked" ? (
                          <button onClick={() => handleConfirm(b.id, b.userId)} style={buttonStyle("#ff2d55", "#ff2d55", "#fff")}>
                            Confirm Booking
                          </button>
                        ) : (
                          <button disabled style={buttonStyle("#f4f4f5", "#ccc", "#aaa")}>
                            Confirmed
                          </button>
                        )}
                        <button onClick={() => navigate(`/user/${b.userId}`)} style={buttonStyle("#f4f4f5", "#ccc")}>
                          View Guest
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function buttonStyle(bg, border, text = "#333") {
  return {
    padding: "8px 14px",
    borderRadius: "999px",
    backgroundColor: bg,
    color: text,
    border: `1px solid ${border}`,
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
}

export default MyBookingsPage;
