import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  doc,
} from "firebase/firestore";
import app from "../firebase";
import WorkDetailModal from "../components/WorkDetailModal";
import UserReviewsTab from "../components/UserReviewsTab";


const db = getFirestore(app);

function UserProfilePage() {
  const { uid } = useParams();
  const [userMedia, setUserMedia] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const navigate = useNavigate();

  const fetchMedia = async () => {
    const q = query(collection(db, "users", uid, "gallery"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setUserMedia(items);
  };

  const fetchUserInfo = async () => {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      setUserInfo(snap.data());
    }
  };

  const fetchRatings = async () => {
    if (!uid) return;

    // 获取该用户发布的所有服务
    const serviceSnap = await getDocs(
      query(collection(db, "services"), where("userId", "==", uid))
    );
    const serviceIds = serviceSnap.docs.map((doc) => doc.id);
    if (serviceIds.length === 0) return;

    // 获取所有评分，并筛选相关服务
    const ratingSnap = await getDocs(collection(db, "ratings"));
    const ratings = ratingSnap.docs
      .map((doc) => doc.data())
      .filter((r) => serviceIds.includes(r.serviceId));

    if (ratings.length === 0) return;

    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    setAverageRating(avg);
    setTotalRatings(ratings.length);
  };

  useEffect(() => {
    fetchMedia();
    fetchUserInfo();
    fetchRatings();
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
              <p style={{ color: "#666", margin: "4px 0" }}>
                {userInfo.bio || "这个人很神秘，还没有写简介。"}
              </p>

             {/*
             
            
              {averageRating !== null && (
                <div style={{ margin: "4px 0" }}>
                  <StarRatings
                    rating={averageRating}
                    starRatedColor="#f59e0b"
                    starEmptyColor="#e5e7eb"
                    numberOfStars={5}
                    name="merchant-rating"
                    starDimension="20px"
                    starSpacing="2px"
                  />
                  <p style={{ marginTop: "4px", fontSize: "0.9rem", color: "#666" }}>
                    平均评分：<strong style={{ color: "#f59e0b" }}>{averageRating.toFixed(1)}</strong> 分（共 {totalRatings} 条评分）
                  </p>
                </div>
              )}
             
             */}


            

              <button
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  backgroundColor: "#5c4db1",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  marginTop: "0.5rem",
                }}
              >
                + 关注
              </button>
            </div>
          </div>
        </>
      )}

      {/* 作品区 */}
      <h3 style={{ marginBottom: "1rem" }}>📸 作品</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        {userMedia.map((item) => (
          <div
            key={item.id}
            onClick={() => setPreviewItem(item)}
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: "0.5rem",
              cursor: "pointer",
              backgroundColor: "#fafafa",
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

      {/* 服务评价区 */}
      <div style={{ paddingTop: "1rem", borderTop: "1px solid #eee" }}>
        <h3 style={{ marginBottom: "1rem" }}>💬 服务评价</h3>
        <UserReviewsTab uid={uid} />
      </div>

      {/* 作品预览浮窗 */}
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
