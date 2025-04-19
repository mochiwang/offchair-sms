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
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const db = getFirestore(app);
const auth = getAuth(app);

function MyServices() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const fetchServices = async () => {
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
      setLoading(false);
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
    <div style={{ padding: "4rem 4rem 2rem", width: "100%", maxWidth: "none" }}>
      <h2>我发布的服务</h2>

      <input
        type="text"
        placeholder="搜索标签或标题（如：美甲、摄影）"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          padding: "8px",
          width: "250px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginBottom: "1rem",
        }}
      />

      {filteredServices.length === 0 ? (
        <EmptyState message="没有找到匹配的服务，换个关键词试试吧～" icon="🔍" />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {filteredServices.map((service) => (
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
                minWidth: "260px",
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
                }}
              >
                ×
              </button>

              <Link
                to={`/detail/${service.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {service.image ? (
                  <img
                    src={service.image}
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
                <p>
                  <strong>价格：</strong> ¥{service.price}
                </p>
                <p>
                  <strong>地点：</strong> {service.location}
                </p>
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
      )}
    </div>
  );
}

export default MyServices;
