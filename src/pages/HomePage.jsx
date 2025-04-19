import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import Masonry from "react-masonry-css";

const db = getFirestore(app);
const auth = getAuth(app);

function HomePage() {
  const [services, setServices] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  // ✅ 改成最多 3 列，避免每列太窄
  const breakpointColumnsObj = {
    default: 3,
    1200: 2,
    768: 1,
  };

  useEffect(() => {
    const fetchServices = async () => {
      const snapshot = await getDocs(collection(db, "services"));
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setServices(items);
      setLoading(false);
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchFavorites = async () => {
      const snapshot = await getDocs(
        collection(db, "users", currentUser.uid, "favorites")
      );
      const favIds = snapshot.docs.map((doc) => doc.id);
      setFavorites(favIds);
    };
    fetchFavorites();
  }, [currentUser]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "services", id));
      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch (err) {
      console.error("删除失败：", err);
      alert("删除失败 ❌");
    }
  };

  const toggleFavorite = async (serviceId) => {
    if (!currentUser) {
      alert("请先登录再收藏！");
      return;
    }

    const favRef = doc(db, "users", currentUser.uid, "favorites", serviceId);
    const isFav = favorites.includes(serviceId);

    try {
      if (isFav) {
        await deleteDoc(favRef);
        setFavorites((prev) => prev.filter((id) => id !== serviceId));
      } else {
        await setDoc(favRef, { timestamp: new Date() });
        setFavorites((prev) => [...prev, serviceId]);
      }
    } catch (error) {
      console.error("收藏失败 ❌", error);
    }
  };

  const filteredServices = services.filter((service) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    const text = `${service.title || ""} ${service.description || ""} ${service.tags?.join(" ") || ""}`.toLowerCase();

    return text.includes(keyword);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: "4rem 1rem 2rem", width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "1100px", textAlign: "center" }}>
        
        {/* 品牌文案区域 */}
        <h1 style={{ fontSize: "1.8rem", fontWeight: "600", lineHeight: "1.6", marginBottom: "2.5rem" }}>
          Let every passion be visible.<br />
          Let every act of sharing spark a connection.<br />
          Let interest transform into real-life experience.
        </h1>
  
        {/* 搜索框 + 标题 */}
        <h2 style={{ fontSize: "1.4rem", textAlign: "left", marginBottom: "1rem" }}>兴趣服务</h2>
        <input
          type="text"
          placeholder="搜索标签或标题（如：美甲、摄影）"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "10px",
            width: "300px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "2rem",
          }}
        />
  
        {/* 卡片列表 */}
        {filteredServices.length === 0 ? (
          <EmptyState message="没有找到匹配的服务，换个关键词试试吧～" icon="🔍" />
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {filteredServices.map((service) => {
              const isOwner = currentUser && service.userId === currentUser.uid;
              const isFav = favorites.includes(service.id);
  
              return (
                <div
                  key={service.id}
                  className="card"
                  style={{
                    position: "relative",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    transition: "transform 0.2s ease",
                    width: "100%",
                    minWidth: "280px",        // ✅ 加这个
                    maxWidth: "340px",        // ✅ 可选限制最大宽度
                    margin: "0 auto"          // ✅ 居中
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="delete-btn"
                    >
                      ×
                    </button>
                  )}
  
                  {currentUser && !isOwner && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(service.id);
                      }}
                      title={isFav ? "取消收藏" : "添加收藏"}
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        background: "rgba(255,255,255,0.9)",
                        border: "none",
                        borderRadius: "50%",
                        width: "28px",
                        height: "28px",
                        fontSize: "18px",
                        color: isFav ? "#ffd700" : "#ccc",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                      }}
                    >
                      {isFav ? "⭐️" : "☆"}
                    </button>
                  )}
  
                  <Link
                    to={`/detail/${service.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {service.images?.length > 0 ? (
                      <img
                        src={service.images[0]}
                        alt={service.title}
                        style={{
                          width: "100%",
                          height: "220px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "220px",
                          backgroundColor: "#f2f2f2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#bbb",
                          fontSize: "0.9rem",
                        }}
                      >
                        无图预览
                      </div>
                    )}
  
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <p>
                      <strong>价格：</strong> ¥{service.price}
                    </p>
                    <div
                      style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                      }}
                    >
                      {service.tags?.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            fontSize: "0.8rem",
                            backgroundColor: "#f0f0f0",
                            padding: "2px 6px",
                            borderRadius: "12px",
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                </div>
              );
            })}
          </Masonry>
        )}
     </div>
    </div>
  ); // ✅ 正确结束 return
} // ✅ 正确结束 function HomePage
export default HomePage;


