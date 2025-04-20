import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore(app);
const auth = getAuth(app);

function MyBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const currentUser = auth.currentUser;

  const handleCancelBooking = async (bookingId, slotId) => {
    try {
      await deleteDoc(doc(db, "appointments", bookingId));
      const slotRef = doc(db, "slots", slotId);
      await setDoc(slotRef, { available: true, userId: null }, { merge: true });
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      alert("已取消预约！");
    } catch (err) {
      console.error("取消失败", err);
      alert("取消失败，请稍后再试");
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) return;

      const q = query(
        collection(db, "appointments"),
        where("userId", "==", currentUser.uid)
      );
      const snap = await getDocs(q);

      const results = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const serviceRef = doc(db, "services", data.serviceId);
          const serviceSnap = await getDoc(serviceRef);
          return {
            ...data,
            id: docSnap.id,
            service: serviceSnap.exists() ? serviceSnap.data() : null,
          };
        })
      );

      setBookings(results);
    };

    fetchBookings();
  }, [currentUser]);

  return (
    <div style={{ padding: "1rem 0" }}>
      {bookings.length === 0 ? (
        <p style={{ color: "#666", fontSize: "0.95rem" }}>你还没有预约任何服务。</p>
      ) : (
        bookings.map((booking) => (
          <div
            key={booking.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              border: "1px solid #eee",
              borderRadius: "10px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <img
              src={booking.service?.images?.[0] || "/placeholder.jpg"}
              alt="service"
              style={{
                width: "100px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <div>
              <h4 style={{ margin: 0 }}>{booking.service?.title || "未知服务"}</h4>
              <p style={{ margin: "4px 0", color: "#555" }}>
                🕒 {new Date(booking.startTime.seconds * 1000).toLocaleString()} - {new Date(booking.endTime.seconds * 1000).toLocaleTimeString()}
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#777" }}>
                📍 {booking.service?.location || "未提供地址"}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#aaa" }}>
                状态：{booking.status}
              </p>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => {
                    const chatId = [currentUser.uid, booking.service.userId].sort().join("_");
                    localStorage.setItem("chat_after_booking", chatId);
                    window.location.reload();
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    backgroundColor: "#eef",
                    color: "#333",
                    border: "1px solid #cce",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  开始聊天
                </button>

                <button
                  onClick={() => handleCancelBooking(booking.id, booking.slotId)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    backgroundColor: "#ffecec",
                    color: "#d33",
                    border: "1px solid #f5c2c2",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  取消预约
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyBookingsTab;
