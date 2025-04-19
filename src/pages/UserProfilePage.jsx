// src/pages/UserProfilePage.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  doc,
} from "firebase/firestore";
import app from "../firebase";
import WorkDetailModal from "../components/WorkDetailModal";
import { useNavigate } from "react-router-dom";

const db = getFirestore(app);

function UserProfilePage() {
  const { uid } = useParams();
  const [userMedia, setUserMedia] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const navigate = useNavigate();

  const fetchMedia = async () => {
    const q = query(collection(db, "users", uid, "gallery"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUserMedia(items);
  };

  const fetchUserInfo = async () => {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      setUserInfo(snap.data());
    }
  };

  useEffect(() => {
    fetchMedia();
    fetchUserInfo();
  }, [uid]);

  return (

    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      {userInfo && (
        <>
          {/* 顶部返回 + 标题导航栏 */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <span
              onClick={() => navigate(-1)}
              style={{ cursor: "pointer", fontSize: "1.5rem", color: "#5c4db1" }}
            >
              ←
            </span>
            <h2 style={{ margin: 0 }}>用户主页</h2>
          </div>

          {/* 用户信息卡片 */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <img
              src={userInfo.avatarUrl || "https://via.placeholder.com/64"}
              alt="头像"
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
            />
            <div>
              <h3 style={{ margin: 0 }}>{userInfo.displayName || "用户"}</h3>
              <p style={{ color: "#666", margin: "4px 0" }}>{userInfo.bio || "这个人很神秘，还没有写简介。"}</p>
              <button style={{
                padding: "6px 14px",
                borderRadius: "999px",
                backgroundColor: "#5c4db1",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}>
                + 关注
              </button>
            </div>
          </div>
        </>
      )}



      <h3 style={{ marginBottom: "1rem" }}>📸 作品</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        {userMedia.map((item) => (
          <div
            key={item.id}
            onClick={() => setPreviewItem(item)}
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: "0.5rem",
              cursor: "pointer",
              backgroundColor: "#fafafa"
            }}
          >
            {item.images?.length > 0 ? (
              <img src={item.images[0]} style={{ width: "100%", borderRadius: "6px" }} />
            ) : item.type === "image" ? (
              <img src={item.url} style={{ width: "100%", borderRadius: "6px" }} />
            ) : (
              <video src={item.url} controls style={{ width: "100%", borderRadius: "6px" }} />
            )}
            <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{item.caption}</p>
          </div>
        ))}
      </div>

      {previewItem && (
        <WorkDetailModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          refresh={fetchMedia}
        />
      )}
    </div>
  );
}

export default UserProfilePage;
