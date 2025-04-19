// src/components/MyFavoritesTab.jsx
import { useEffect, useState } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";
import app from "../firebase";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

const db = getFirestore(app);
const auth = getAuth(app);

function MyFavoritesTab() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const fetchFavorites = async () => {
      try {
        const favRef = collection(db, "users", currentUser.uid, "favorites");
        const favSnap = await getDocs(favRef);

        const servicePromises = favSnap.docs.map(async (docRef) => {
          const serviceId = docRef.id;
          const serviceSnap = await getDoc(doc(db, "services", serviceId));
          if (serviceSnap.exists()) {
            return { id: serviceId, ...serviceSnap.data() };
          }
          return null;
        });

        const results = await Promise.all(servicePromises);
        const validResults = results.filter((s) => s !== null);
        setFavorites(validResults);
      } catch (err) {
        console.error("加载收藏失败：", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="my-favorites-tab">
      <h3 style={{ marginBottom: "1rem" }}>❤️ 我收藏的服务</h3>
      {favorites.length === 0 ? (
        <EmptyState message="你还没有收藏任何服务" icon="📌" />
      ) : (
        <div
          className="card-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {favorites.map((service) => (
            <Link
              key={service.id}
              to={`/detail/${service.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="card"
                style={{
                  border: "1px solid #eee",
                  borderRadius: "10px",
                  padding: "12px",
                  background: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                  }}
                />
                <h4>{service.title}</h4>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                  {service.description}
                </p>
                <p style={{ marginTop: "4px" }}>
                  <strong>价格：</strong> ¥{service.price}
                </p>
                <p>
                  <strong>地点：</strong> {service.location}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyFavoritesTab;
