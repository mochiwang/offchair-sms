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
import HeroNavBar from "../components/HeroNavBar";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const db = getFirestore(app);
const auth = getAuth(app);

function MyServicesPage() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const fetchServices = async () => {
      const q = query(collection(db, "services"), where("userId", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setServices(items);
      setFilteredServices(items);
      setLoading(false);
    };
    fetchServices();
    window.scrollTo(0, 0);
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
    <>
      <HeroNavBar variant="normal" />
      <div style={{ padding: "6rem 1rem 2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>我的发布</h2>

        <input
          type="text"
          placeholder="搜索标题、描述或标签"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            padding: "8px",
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "1.5rem",
          }}
        />

        {filteredServices.length === 0 ? (
          <EmptyState message="没有找到匹配的服务，换个关键词试试吧～" icon="🔍" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
            {filteredServices.map((service) => {
              const imageUrl = service.image || (service.images?.[0]) || null;

              return (
                <div
                  key={service.id}
                  style={{
                    position: "relative",
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
                      zIndex: 2,
                    }}
                  >
                    ×
                  </button>

                  <Link
                    to={`/detail/${service.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={service.title}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "200px",
                          backgroundColor: "#f2f2f2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#aaa",
                          fontSize: "1rem",
                        }}
                      >
                        无图预览
                      </div>
                    )}

                    <div style={{ padding: "0.75rem 1rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>
                        {service.title}
                      </h3>

                      <p style={{ fontSize: "0.95rem", color: "#333", margin: "0 0 0.5rem 0" }}>
                        {service.description?.slice(0, 60) || "暂无描述"}...
                      </p>

                      <p style={{ fontSize: "0.9rem", color: "#555", margin: 0 }}>
                        <strong>价格：</strong>¥{service.price}
                      </p>

                      {service.location && (
                        <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.3rem" }}>
                          📍 {service.location}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default MyServicesPage;
