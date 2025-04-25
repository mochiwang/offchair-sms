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
import { cancelExpiredUnpaidAppointments } from "../utils/cancelExpiredUnpaidAppointments";

const db = getFirestore(app);
const auth = getAuth(app);
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function MyBookingsTab() {
  const [appointments, setAppointments] = useState([]);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const handleCancel = async (bookingId, slotId) => {
    await deleteDoc(doc(db, "appointments", bookingId));
    await setDoc(doc(db, "slots", slotId), { available: true, userId: null, locked: false }, { merge: true });
    setAppointments((prev) => prev.filter((b) => b.id !== bookingId));
    alert("已取消预约");
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
      }),
    });

    const data = await res.json();
    const stripe = await stripePromise;

    if (data.id) {
      await stripe.redirectToCheckout({ sessionId: data.id });
    } else {
      alert("❌ 创建支付会话失败，请稍后再试");
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

              <p style={{ margin: "6px 0", color: "#666" }}>
                状态：{b.status === "confirmed" ? "✅ 已确认" : "⏳ 待商家确认"}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
                {isGuest && (
                  <>
                    {b.status === "confirmed" && !b.paid && (
                      <button
                        onClick={() => handleCheckout(b)}
                        style={buttonStyle("#fffbea", "#facc15", "#b45309")}
                      >
                        去付款 💳
                      </button>
                    )}
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
                    {b.status === "booked" ? (
                      <button
                        onClick={() => handleConfirm(b.id, b.userId)}
                        style={buttonStyle("#ff2d55", "#ff2d55", "#fff")}
                      >
                        确认预约
                      </button>
                    ) : (
                      <button disabled style={buttonStyle("#f4f4f5", "#ccc", "#aaa")}>已确认</button>
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
