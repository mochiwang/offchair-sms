import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import app from "../firebase";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";
import { primaryPurpleButtonStyle } from "../styleConstants";

const db = getFirestore(app);
const auth = getAuth(app);

function MyServicesTab() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const fetchServices = async () => {
      try {
        const q = query(
          collection(db, "services"),
          where("userId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServices(items);
        setFilteredServices(items);
      } catch (err) {
        console.error("加载服务失败：", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [currentUser]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "services", id));
      const updated = services.filter((s) => s.id !== id);
      setServices(updated);
      setFilteredServices(updated);
    } catch (err) {
      console.error("删除失败：", err);
      alert("删除失败 ❌");
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const keyword = term.trim().toLowerCase();
    if (!keyword) {
      setFilteredServices(services);
    } else {
      const results = services.filter((service) => {
        const text = `${service.title} ${service.description} ${service.tags?.join(" ")}`.toLowerCase();
        return text.includes(keyword);
      });
      setFilteredServices(results);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* 顶部搜索 + 发布 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <input
          type="text"
          placeholder="搜索我的服务（标题、描述、标签）"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            padding: "10px",
            width: "100%",
            maxWidth: "320px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={() => window.location.href = "/create"}
          style={primaryPurpleButtonStyle}
        >
          ➕ 发布服务
        </button>
      </div>

      {/* 卡片区 */}
      {filteredServices.length === 0 ? (
        <EmptyState message="暂无匹配的服务，试试其他关键词吧！" icon="🔍" />
      ) : (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              width: "100%",
              maxWidth: "1200px",
              padding: "0 1rem",
            }}
          >
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="card"
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  padding: "1.5rem",
                  position: "relative",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <button
                  onClick={() => handleDelete(service.id)}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "#ff4d4f",
                    border: "none",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>

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
                        height: "180px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "180px",
                        backgroundColor: "#f2f2f2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                        color: "#aaa",
                      }}
                    >
                      无图预览
                    </div>
                  )}

                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <p><strong>价格：</strong> ¥{service.price}</p>
                  <p><strong>地点：</strong> {service.location}</p>

                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {service.tags?.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          fontSize: "0.8rem",
                          backgroundColor: "#f0f0f0",
                          padding: "4px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyServicesTab;
