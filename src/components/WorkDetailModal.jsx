// src/components/WorkDetailModal.jsx
import { useState } from "react";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../firebase";
import { useNavigate } from "react-router-dom";

const db = getFirestore(app);
const auth = getAuth(app);

function WorkDetailModal({ item, onClose, refresh }) {
  const [commentText, setCommentText] = useState("");
  const [likedAnimation, setLikedAnimation] = useState(false);
  const [favAnimation, setFavAnimation] = useState(false);
  const [work, setWork] = useState(item);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();


const goToUserPage = (uid) => {
  navigate(`/user/${uid}`);
};

  const fetchWork = async () => {
    const docRef = doc(db, "users", currentUser.uid, "gallery", item.id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      setWork({ id: snap.id, ...snap.data() });
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    const docRef = doc(db, "users", currentUser.uid, "gallery", item.id);
    const alreadyLiked = work.likedBy?.includes(currentUser.uid);

    await updateDoc(docRef, {
      likes: alreadyLiked ? (work.likes || 0) - 1 : (work.likes || 0) + 1,
      likedBy: alreadyLiked
        ? work.likedBy.filter((id) => id !== currentUser.uid)
        : [...(work.likedBy || []), currentUser.uid],
    });

    await fetchWork();
    setLikedAnimation(true);
    setTimeout(() => setLikedAnimation(false), 300);
    refresh();
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;
    const docRef = doc(db, "users", currentUser.uid, "gallery", item.id);
    const newComment = {
      id: Date.now(),
      text: commentText.trim(),
      displayName: currentUser.displayName || "匿名",
      createdAt: new Date().toISOString(),
      uid: currentUser.uid,
    };

    await updateDoc(docRef, {
      comments: arrayUnion(newComment),
    });
    await fetchWork();
    setCommentText("");
    refresh();
  };

  const handleCommentDelete = async (commentId) => {
    if (!currentUser) return;
    const docRef = doc(db, "users", currentUser.uid, "gallery", item.id);
    const targetComment = work.comments.find(c => c.id === commentId);
    if (!targetComment || targetComment.uid !== currentUser.uid) return;

    await updateDoc(docRef, {
      comments: arrayRemove(targetComment),
    });
    await fetchWork();
    refresh();
  };

  const handleFavorite = async () => {
    if (!currentUser) return;
    const docRef = doc(db, "users", currentUser.uid, "gallery", item.id);
    const alreadyFav = work.favoritedBy?.includes(currentUser.uid);

    await updateDoc(docRef, {
      favoritedBy: alreadyFav
        ? work.favoritedBy.filter((id) => id !== currentUser.uid)
        : [...(work.favoritedBy || []), currentUser.uid],
    });
    await fetchWork();
    setFavAnimation(true);
    setTimeout(() => setFavAnimation(false), 300);
    refresh();
  };

  const liked = work.likedBy?.includes(currentUser?.uid);
  const favorited = work.favoritedBy?.includes(currentUser?.uid);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "20px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          style={{ float: "right", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
        >
          ×
        </button>
       {/* ✅ 新增：支持图文并茂展示 */}
{Array.isArray(work.images) && work.images.length > 0 ? (
  work.images.map((img, idx) => (
    <img
      key={idx}
      src={img}
      alt={`图${idx + 1}`}
      style={{ width: "100%", borderRadius: "8px", marginBottom: "0.75rem" }}
    />
  ))
) : work.type === "image" ? (
  <img src={work.url} alt="preview" style={{ width: "100%", borderRadius: "8px" }} />
) : (
  <video src={work.url} controls style={{ width: "100%", borderRadius: "8px" }} />
)}


        <h4 style={{ marginTop: "1rem" }}>{work.caption}</h4>
        <div style={{ marginBottom: "1rem" }}>
          {work.tags?.map((tag, idx) => (
            <span
              key={idx}
              style={{
                fontSize: "0.8rem",
                backgroundColor: "#eee",
                padding: "3px 6px",
                marginRight: "5px",
                borderRadius: "10px",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* 点赞 + 收藏按钮 */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", justifyContent: "center" }}>
          <button
            onClick={handleLike}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#fff",
              border: "1px solid #eee",
              borderRadius: "999px",
              padding: "6px 14px",
              boxShadow: likedAnimation ? "0 0 12px rgba(255,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.06)",
              color: liked ? "#ff4757" : "#888",
              fontWeight: "500",
              cursor: "pointer",
              fontSize: "0.95rem",
              transform: likedAnimation ? "scale(1.1)" : "scale(1)",
              transition: "all 0.2s ease"
            }}
          >
            ❤️ {work.likes || 0}
          </button>

          <button
            onClick={handleFavorite}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#fff",
              border: "1px solid #eee",
              borderRadius: "999px",
              padding: "6px 14px",
              boxShadow: favAnimation ? "0 0 12px rgba(255,215,0,0.3)" : "0 2px 6px rgba(0,0,0,0.06)",
              color: favorited ? "#f4c430" : "#888",
              fontWeight: "500",
              cursor: "pointer",
              fontSize: "0.95rem",
              transform: favAnimation ? "scale(1.1)" : "scale(1)",
              transition: "all 0.2s ease"
            }}
          >
            ⭐ 收藏
          </button>
        </div>

        <div id="comments">
          <h5>评论</h5>
          {work.comments?.length > 0 ? (
            work.comments.map((cmt) => (
              <div key={cmt.id} style={{ marginBottom: "6px" }}>
                <strong style={{ cursor: "pointer", color: "#5c4db1" }} onClick={() => goToUserPage(cmt.uid)}
>
  @{cmt.displayName}
</strong>：{cmt.text}
                {cmt.uid === currentUser?.uid && (
                  <button
                    onClick={() => handleCommentDelete(cmt.id)}
                    style={{ marginLeft: "8px", fontSize: "0.75rem", color: "red", border: "none", background: "none", cursor: "pointer" }}
                  >
                    删除
                  </button>
                )}
              </div>
            ))
          ) : (
            <p style={{ fontSize: "0.9rem", color: "#666" }}>还没有评论</p>
          )}

          <form onSubmit={handleCommentSubmit} style={{ marginTop: "0.5rem" }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的评论..."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </form>
        </div>
      </div>
    </div>
  );
}

export default WorkDetailModal;
