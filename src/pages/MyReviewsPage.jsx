import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import HeroNavBar from "../components/HeroNavBar";
import app from "../firebase";

const db = getFirestore(app);
const auth = getAuth(app);

function MyReviewsPage() {
  const [activeTab, setActiveTab] = useState("guest"); // guest 或 host
  const [guestReviews, setGuestReviews] = useState([]);
  const [hostReviews, setHostReviews] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const fetchReviews = async () => {
      const guestRef = collection(db, "users", currentUser.uid, "guestReviews");
      const hostRef = collection(db, "users", currentUser.uid, "hostReviews");

      const guestSnap = await getDocs(guestRef);
      const hostSnap = await getDocs(hostRef);

      setGuestReviews(guestSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setHostReviews(hostSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchReviews();
    window.scrollTo(0, 0);
  }, [currentUser]);

  const renderReviews = (reviews) => {
    if (reviews.length === 0) {
      return (
        <p style={{ color: "#888", textAlign: "center", marginTop: "2rem" }}>
          暂无评论。
        </p>
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginTop: "2rem" }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              padding: "1.75rem",
              border: "1px solid #eee",
              borderRadius: "16px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "1.2rem", color: "#5c4db1" }}>
                @{activeTab === "guest" ? (review.guestName || "匿名用户") : (review.hostName || "匿名用户")}
              </p>
              <p style={{ marginTop: "0.5rem", color: "#333", fontSize: "1rem" }}>
                {review.text || "无评论内容"}
              </p>
            </div>

            <div style={{ fontSize: "0.9rem", color: "#666", lineHeight: "1.5" }}>
              服务：{review.serviceTitle || "未知服务"}<br />
              评分：{review.rating ? `${review.rating} 分` : "未评分"}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <HeroNavBar />
      <div style={{ padding: "6rem 1rem 2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", textAlign: "center", marginBottom: "2rem" }}>
          Reviews
        </h1>

        {/* Tab 切换 */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setActiveTab("guest")}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              fontWeight: activeTab === "guest" ? "bold" : "normal",
              color: activeTab === "guest" ? "#000" : "#bbb",
              borderBottom: activeTab === "guest" ? "2px solid black" : "none",
              paddingBottom: "0.5rem",
              cursor: "pointer",
            }}
          >
            About you as a guest
          </button>

          <button
            onClick={() => setActiveTab("host")}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              fontWeight: activeTab === "host" ? "bold" : "normal",
              color: activeTab === "host" ? "#000" : "#bbb",
              borderBottom: activeTab === "host" ? "2px solid black" : "none",
              paddingBottom: "0.5rem",
              cursor: "pointer",
            }}
          >
            About you as a host
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === "guest" ? renderReviews(guestReviews) : renderReviews(hostReviews)}
      </div>
    </>
  );
}

export default MyReviewsPage;
