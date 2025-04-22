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
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const db = getFirestore(app);
const auth = getAuth(app);

function MyBookingsTab() {
  const [appointments, setAppointments] = useState([]);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const handleCancel = async (bookingId, slotId) => {
    await deleteDoc(doc(db, "appointments", bookingId));
    await setDoc(doc(db, "slots", slotId), { available: true, userId: null }, { merge: true });
    setAppointments((prev) => prev.filter((b) => b.id !== bookingId));
    alert("已取消预约");
  };

  const handleConfirm = async (bookingId) => {
    await updateDoc(doc(db, "appointments", bookingId), { status: "confirmed" });
    setAppointments((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" } : b))
    );
    alert("✅ 已确认预约");
  };

  useEffect(() => {
    if (!currentUser) return;

    const fetch = async () => {
      const q = query(collection(db, "appointments"));
      const snap = await getDocs(q);

      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const serviceSnap = await getDoc(doc(db, "services", data.serviceId));
          const service = serviceSnap.exists() ? serviceSnap.data() : null;

          const guestSnap = await getDoc(doc(db, "users", data.userId));
          const guest = guestSnap.exists() ? guestSnap.data() : { displayName: "匿名用户" };

          return {
            ...data,
            id: d.id,
            service,
            guest,
          };
        })
      );

      const future = list.filter((b) => {
        const end = b.endTime?.seconds * 1000;
        return end && end > Date.now();
      });

      const myAppointments = future.filter(
        (b) =>
          b.userId === currentUser.uid || b.serviceOwnerId === currentUser.uid
      );

      setAppointments(myAppointments);
    };

    fetch();
  }, [currentUser]);

  return (
    <div style={{ padding: "1rem 0" }}>
      {appointments.length === 0 ? (
        <p style={{ color: "#666", fontSize: "0.95rem" }}>你还没有任何即将到来的预约。</p>
      ) : (
        appointments.map((b) => {
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
                marginBottom: "1.5rem",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#111" }}>
                {b.service?.title || "未知服务"}
              </h3>

              <p style={{ margin: "6px 0", color: "#555" }}>
                🕒 {new Date(b.startTime.seconds * 1000).toLocaleString()}
              </p>

              {/* 按钮组 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
                {isGuest && (
                  <>
                    <button
                      onClick={() => {
                        const chatId = [currentUser.uid, b.service.userId].sort().join("_");
                        localStorage.setItem("chat_after_booking", chatId);
                        window.location.reload();
                      }}
                      style={buttonStyle("#fff0f3", "#ff2d55", "#ff2d55")}
                    >
                      联系商家
                    </button>
                    <button
                      onClick={() => handleCancel(b.id, b.slotId)}
                      style={buttonStyle("#ffecec", "#d33", "#d33")}
                    >
                      取消预约
                    </button>
                  </>
                )}

                {isMerchant && (
                  <>
                    {b.status === "booked" && (
                      <button
                        onClick={() => handleConfirm(b.id)}
                        style={buttonStyle("#ff2d55", "#ff2d55", "#fff")}
                      >
                        确认预约
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/user/${b.userId}`)}
                      style={buttonStyle("#f4f4f5", "#ccc")}
                    >
                      查看客人主页
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigate(`/detail/${b.serviceId}`)}
                  style={buttonStyle("#f4f4f5", "#ccc")}
                >
                  查看服务详情
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
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

export default MyBookingsTab;
