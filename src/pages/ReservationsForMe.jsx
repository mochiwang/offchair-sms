import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import app from "../firebase";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";

const auth = getAuth(app);
const db = getFirestore(app);

function ReservationsForMe() {
  const [appointments, setAppointments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const q = query(
          collection(db, "appointments"),
          where("serviceOwnerId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const list = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const serviceSnap = await getDoc(doc(db, "services", data.serviceId));
            const service = serviceSnap.exists() ? serviceSnap.data() : null;
            const guestSnap = await getDoc(doc(db, "users", data.userId));
            const guest = guestSnap.exists() ? guestSnap.data() : { displayName: "Anonymous" };
            return {
              ...data,
              id: docSnap.id,
              service,
              guest,
            };
          })
        );
        setAppointments(list);
      }
    });
    return () => unsubscribe();
  }, []);

  const confirmBooking = async (bookingId, userId) => {
    const deadline = Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000));
    await updateDoc(doc(db, "appointments", bookingId), {
      status: "confirmed",
      paid: false,
      paymentDeadline: deadline,
      confirmedAt: serverTimestamp(),
    });
    alert("✅ Appointment confirmed.");
  };

  const cancelBooking = async (booking) => {
    const confirm = window.confirm("Cancel and refund this booking?");
    if (!confirm) return;
    await deleteDoc(doc(db, "appointments", booking.id));
    await setDoc(
      doc(db, "slots", booking.slotId),
      {
        available: true,
        locked: false,
        userId: null,
      },
      { merge: true }
    );
    alert("✅ Booking cancelled.");
    setAppointments((prev) => prev.filter((b) => b.id !== booking.id));
  };

  return (
    <Layout variant="normal">
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
          Reservations For Me
        </h2>

        {appointments.length === 0 ? (
          <p style={{ color: "#777" }}>No one has booked your services yet.</p>
        ) : (
          appointments.map((b) => {
            const serviceTitle = b.service?.title || "🛠️ [Deleted Service]";
            const imageUrl =
              b.service?.image ||
              (Array.isArray(b.service?.images) && b.service.images.length > 0
                ? b.service.images[0]
                : null);

            return (
              <div
                key={b.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "12px",
                  padding: "1rem",
                  marginBottom: "1rem",
                  backgroundColor: "#fff",
                }}
              >
                <h3>{serviceTitle}</h3>

                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={serviceTitle}
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      borderRadius: "8px",
                      marginTop: "0.5rem",
                      objectFit: "cover",
                    }}
                  />
                )}

                <p>Guest: {b.guest?.displayName || "Unknown"}</p>
                <p>Date: {new Date(b.startTime.seconds * 1000).toLocaleString()}</p>
                <p>Status: {b.status}</p>

                <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {b.status === "booked" && (
                    <button onClick={() => confirmBooking(b.id, b.userId)}>
                      Confirm
                    </button>
                  )}
                  <button onClick={() => navigate(`/user/${b.userId}`)}>View Guest</button>
                  <button onClick={() => cancelBooking(b)} style={{ color: "red" }}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}

export default ReservationsForMe;
