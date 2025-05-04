import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  where,
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
import { cancelExpiredUnpaidAppointments } from "../utils/cancelExpiredUnpaidAppointments";
import { onAuthStateChanged } from "firebase/auth";


const db = getFirestore(app);
const auth = getAuth(app);
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function MyBookingsTab() {
  const [appointments, setAppointments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  // ✅ 通用按钮样式函数
const buttonStyle = (bg, border, color = "#000") => ({
  backgroundColor: bg,
  border: `1px solid ${border}`,
  color,
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 500,
});

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
  });
  return () => unsubscribe();
}, []);

  const navigate = useNavigate();

  const handleCancel = async (booking) => {
    const { id: bookingId, slotId, paid } = booking;
  
    if (paid) {
      const confirmRefund = window.confirm("This booking has been paid. Do you want to cancel and request a refund?");
      if (!confirmRefund) return;
  
      try {
        const res = await fetch("/api/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: bookingId }),
        });
  
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
  
        alert("✅ Refund requested. It may take a few days to arrive.");
      } catch (err) {
        console.error("Refund failed:", err);
        alert("❌ Refund failed: " + err.message);
        return;
      }
    }
  
    // 🔄 无论是否退款，都释放 slot
    await deleteDoc(doc(db, "appointments", bookingId));
    await setDoc(
      doc(db, "slots", slotId),
      { available: true, userId: null, locked: false },
      { merge: true }
    );
  
    setAppointments((prev) => prev.filter((b) => b.id !== bookingId));
    alert("🗑️ Booking cancelled");
  };
  
  

  // ✅ 新增：判断环境
const API_BASE = import.meta.env.MODE === "development"
? "https://offchair.vercel.app"
: "";

const handleCheckout = async (booking) => {
  try {
    const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: booking.serviceId,
        title: booking.service?.title || "服务",
        amount: booking.service?.price || 100,
        userId: booking.userId,
        slotId: booking.slotId, // ✅ 补上这一行
      }),
    });

    // ✅ 新增这一段
    if (!res.ok) {
      const text = await res.text(); // 用 text() 捕获后端返回的错误内容
      console.error("❌ 接口调用失败：", res.status, text);
      alert("服务器出错：" + text);
      return;
    }

    // ✅ 确认是成功的响应后，再解析 JSON
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("❌ 获取支付链接失败");
    }
  } catch (error) {
    console.error("跳转 Stripe 付款失败:", error);
    alert("❌ 付款失败，请稍后重试");
  }
};

  useEffect(() => {
    cancelExpiredUnpaidAppointments().then(res => {
      console.log(`✅ 自动取消了 ${res.cancelled} 条超时未付款的预约`);
    });
  }, []);

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

      alert("✅ 已确认预约，已尝试提醒客人付款");

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const user = userSnap.exists() ? userSnap.data() : null;

      if (user?.isMember && user.phoneNumber) {
        await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: user.phoneNumber,
            message: `你预约的服务已被商家确认，请尽快付款以完成预约～`,
          }),
        });
        console.log("📩 短信提醒已发送给客人");
      } else {
        console.log("📭 非会员或无手机号，不发送短信");
      }
    } catch (err) {
      console.error("❌ 确认预约失败：", err);
      alert("❌ 确认失败，请稍后重试");
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const fetch = async () => {
      const uid = currentUser.uid;

      const guestQ = query(collection(db, "appointments"), where("userId", "==", uid));
      const merchantQ = query(collection(db, "appointments"), where("serviceOwnerId", "==", uid));
      
      const [guestSnap, merchantSnap] = await Promise.all([
        getDocs(guestQ),
        getDocs(merchantQ),
      ]);
      
      const allDocs = [...guestSnap.docs, ...merchantSnap.docs];
      

      const list = await Promise.all(
        allDocs.map(async (d) => {
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
    };

    fetch();
  }, [currentUser]);

  const handleMarkCompleted = async (booking, role) => {
    const update = {};
    if (role === "guest") update.guestCompleted = true;
    if (role === "merchant") update.merchantCompleted = true;
  
    // 如果双方都已完成，添加 completedAt
    if (
      (role === "guest" && booking.merchantCompleted) ||
      (role === "merchant" && booking.guestCompleted)
    ) {
      update.completedAt = serverTimestamp();
    }
  
    try {
      await updateDoc(doc(db, "appointments", booking.id), update);
      alert("✅ Marked as completed");
  
      setAppointments((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, ...update } : b
        )
      );
    } catch (err) {
      console.error("❌ Failed to mark as completed:", err);
      alert("Failed to update status.");
    }
  };

  const handleMerchantCancel = async (booking) => {
    const confirm = window.confirm("Are you sure you want to cancel this booking and issue a full refund?");
    if (!confirm) return;
  
    try {
      // ✅ 调用退款 API
      const res = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: booking.id }),
      });
  
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
  
      // ✅ 删除预约 + 解锁 slot
      await deleteDoc(doc(db, "appointments", booking.id));
      await setDoc(doc(db, "slots", booking.slotId), {
        available: true,
        locked: false,
        userId: null,
      }, { merge: true });
  
      setAppointments((prev) => prev.filter((b) => b.id !== booking.id));
      alert("✅ Booking canceled and guest has been refunded.");
    } catch (err) {
      console.error("Merchant cancel failed:", err);
      alert("❌ Failed to cancel booking: " + err.message);
    }
  };
  
  

  return (
    <div style={{ padding: "1rem 0" }}>
      {appointments.length === 0 ? (
        <p style={{ color: "#666", fontSize: "0.95rem" }}>You have no upcoming bookings.</p>
      ) : (
        appointments.map((b) => {
          const isGuest = b.userId === currentUser.uid;
          const isMerchant = b.serviceOwnerId === currentUser.uid;
          const now = Date.now();
          const serviceEndTime = b.endTime?.seconds * 1000 || 0;
          const gracePeriod = 6 * 60 * 60 * 1000;
          const isTimeOver = serviceEndTime + gracePeriod < now;
          const serviceCompleted =
            b.paid &&
            ((b.guestCompleted && b.merchantCompleted) || isTimeOver);
  
          const bgColor = isGuest ? "#f9f5ff" : "#f0f9ff";
          const borderColor = isGuest ? "#d8b4fe" : "#93c5fd";

          const showReminderIfNeeded = (booking) => {
            const now = Date.now();
            const start = booking.startTime?.seconds * 1000;
            const tenMinutesBefore = start - 10 * 60 * 1000;
          
            // 是否进入提醒时间段
            if (now > tenMinutesBefore && now < start) {
              const key = `reminder_shown_${booking.id}`;
              if (!localStorage.getItem(key)) {
                alert(`🔔 Reminder: Your service "${booking.service?.title}" is starting in 10 minutes!`);
                localStorage.setItem(key, "true");
              }
            }
          };
            // ✅ 插在这里！
  if (isGuest && b.status === "confirmed" && b.paid) {
    showReminderIfNeeded(b);
  }
  
          return (
<div
  key={b.id}
  style={{
    backgroundColor: b.refunded ? "#f3f4f6" : bgColor,
    border: `1px solid ${b.refunded ? "#ccc" : borderColor}`,
    borderRadius: "16px",
    padding: "1.25rem",
    marginBottom: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    transition: "transform 0.2s ease",
    opacity: b.refunded ? 0.7 : 1,
    pointerEvents: b.refunded ? "none" : "auto",
  }}
  onMouseEnter={(e) => {
    if (!b.refunded) e.currentTarget.style.transform = "scale(1.01)";
  }}
  onMouseLeave={(e) => {
    if (!b.refunded) e.currentTarget.style.transform = "scale(1)";
  }}
>

              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#111" }}>
                {b.service?.title || "Untitled Service"}
              </h3>
  
              <p style={{ margin: "6px 0", color: "#555" }}>
                🕒 {new Date(b.startTime.seconds * 1000).toLocaleString()}
              </p>
  
              <p style={{ margin: "6px 0", color: "#666", display: "flex", alignItems: "center", gap: "0.75rem" }}>
  Status: {b.status === "confirmed" ? "✅ Confirmed" : "⏳ Waiting for confirmation"}

  {b.refunded ? (
    <span style={{
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "0.8rem",
      fontWeight: "bold"
    }}>
      REFUNDED
    </span>
  ) : b.paid ? (
    <span style={{
      backgroundColor: "#dcfce7",
      color: "#15803d",
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "0.8rem",
      fontWeight: "bold"
    }}>
      PAID
    </span>
  ) : null}
</p>

{b.refunded && (
  <p style={{ color: "#888", fontStyle: "italic", marginTop: "0.5rem" }}>
    This booking has been refunded.
  </p>
)}


  
              {isGuest && b.paid && (
                <p style={{ color: "#10b981", fontSize: "0.9rem", fontWeight: 500 }}>
                  ✅ Your payment has been received. This booking is confirmed.
                </p>
              )}
              {isMerchant && b.paid && (
                <p style={{ color: "#0f5132", fontSize: "0.9rem", fontWeight: 500 }}>
                  💡 The guest has paid. Please prepare for the service.
                </p>
              )}
  
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
                {isGuest && (
                  <>
                    {b.status === "confirmed" && !b.paid && (
                      <button
                        onClick={() => handleCheckout(b)}
                        style={buttonStyle("#fffbea", "#facc15", "#b45309")}
                      >
                        Pay Now 💳
                      </button>
                    )}

<button
  onClick={() => handleCancel(b)}
  style={buttonStyle("#ffecec", "#d33", "#d33")}
>
  Cancel Booking
</button>



                    <button
                      onClick={() => {
                        const chatId = [currentUser.uid, b.service.userId].sort().join("_");
                        localStorage.setItem("chat_after_booking", chatId);
                        window.location.reload();
                      }}
                      style={buttonStyle("#fff0f3", "#ff2d55", "#ff2d55")}
                    >
                      Contact Provider
                    </button>
                    </>

                  
                )}
  
                {/* ✅ Mark as Completed 按钮 */}
                {isGuest && b.paid && now > serviceEndTime && !b.guestCompleted && (
                  <button
                    onClick={() => handleMarkCompleted(b, "guest")}
                    style={buttonStyle("#fefce8", "#eab308")}
                  >
                    Mark as Completed ✅
                  </button>
                )}
                {isMerchant && b.paid && now > serviceEndTime && !b.merchantCompleted && (
                  <button
                    onClick={() => handleMarkCompleted(b, "merchant")}
                    style={buttonStyle("#eef2ff", "#6366f1")}
                  >
                    Mark as Completed ✅
                  </button>
                )}
  
                {/* ✅ Leave a Rating */}
                {isGuest && serviceCompleted && !b.hasRated && (
                  <button
                    onClick={() => navigate(`/rate/${b.serviceId}?slotId=${b.slotId}`)}
                    style={buttonStyle("#ecfccb", "#65a30d")}
                  >
                    Leave a Rating 🌟
                  </button>
                )}
  
                {isMerchant && (
                  <>
                    {b.status === "booked" ? (
                      <button
                        onClick={() => handleConfirm(b.id, b.userId)}
                        style={buttonStyle("#ff2d55", "#ff2d55", "#fff")}
                      >
                        Confirm Booking
                      </button>
                    ) : (
                      <button disabled style={buttonStyle("#f4f4f5", "#ccc", "#aaa")}>
                        Confirmed
                      </button>
                    )}
                    {/* ✅ 新增：商家取消按钮 */}
    <button
      onClick={() => handleMerchantCancel(b)}
      style={buttonStyle("#fff1f2", "#e11d48", "#e11d48")}
    >
      Cancel Booking
    </button>

                    <button
                      onClick={() => navigate(`/user/${b.userId}`)}
                      style={buttonStyle("#f4f4f5", "#ccc")}
                    >
                      View Guest Profile
                    </button>
                  </>
                )}
  
                <button
                  onClick={() => navigate(`/detail/${b.serviceId}`)}
                  style={buttonStyle("#f4f4f5", "#ccc")}
                >
                  View Service Details
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
  
  
}

export default MyBookingsTab;
