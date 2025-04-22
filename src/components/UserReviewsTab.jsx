// src/components/UserReviewsTab.jsx
import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";

const db = getFirestore(app);

function UserReviewsTab({ uid }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const fetchComments = async () => {
      const ref = collection(db, "users", uid, "reviews");
      const snap = await getDocs(ref);
      const list = snap.docs.map((doc) => doc.data());
      setComments(list);
    };

    fetchComments();
  }, [uid]);

  if (comments.length === 0) {
    return <p style={{ color: "#888" }}>暂无服务评价。</p>;
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
      {comments.map((cmt, i) => (
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
              @{cmt.displayName}
            </p>
            <p style={{ marginTop: "0.25rem", color: "#333" }}>{cmt.text}</p>
          </div>

          <div style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.75rem" }}>
            服务：{cmt.serviceTitle || "未知服务"}<br />
            评分：{cmt.rating ? `${cmt.rating} 分` : "未评分"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserReviewsTab;
