import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import StarRatings from "react-star-ratings";

const db = getFirestore(app);
const auth = getAuth(app);

function MyReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const fetchReviews = async () => {
      const ref = collection(db, "users", currentUser.uid, "receivedFromMerchants");
      const snap = await getDocs(ref);
      const list = snap.docs.map((doc) => doc.data());
      setReviews(list);
    };

    fetchReviews();
  }, [currentUser]);

  if (reviews.length === 0) {
    return <p style={{ color: "#888" }}>你还没有收到任何商家评价。</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "1rem",
        marginTop: "1rem",
      }}
    >
      {reviews.map((rev, i) => (
        <div
          key={i}
          style={{
            padding: "1rem",
            border: "1px solid #eee",
            borderRadius: "12px",
            backgroundColor: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: "bold", color: "#5c4db1" }}>
              商家：@{rev.merchantName || "未知商家"}
            </p>
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#666" }}>
              服务：{rev.serviceTitle || "未知服务"}
            </p>
            {rev.comment && (
              <p style={{ marginTop: "0.5rem", color: "#333" }}>{rev.comment}</p>
            )}
          </div>

          <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#888" }}>
            评分：
            <StarRatings
              rating={rev.rating}
              starRatedColor="#facc15"
              starEmptyColor="#e5e7eb"
              numberOfStars={5}
              name={`rating-${i}`}
              starDimension="18px"
              starSpacing="2px"
            />
            {rev.createdAt && (
              <div style={{ marginTop: "4px", fontSize: "0.8rem" }}>
                时间：{new Date(rev.createdAt.seconds * 1000).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyReviewsTab;
