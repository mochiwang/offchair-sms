import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  deleteDoc, 
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import HeroNavBar from "../components/HeroNavBar"; // ✅ 引入 HeroNavBar

const db = getFirestore(app);
const auth = getAuth(app);

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const favRef = collection(db, "users", currentUser.uid, "favorites");

    const unsubscribe = onSnapshot(favRef, async (snapshot) => {
      const items = [];
      for (let docSnap of snapshot.docs) {
        const serviceRef = doc(db, "services", docSnap.id);
        const serviceSnap = await getDoc(serviceRef);
        if (serviceSnap.exists()) {
          items.push({ id: docSnap.id, ...serviceSnap.data() });
        }
      }

      setFavorites(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const toggleFavorite = async (serviceId) => {
    const favRef = doc(db, "users", currentUser.uid, "favorites", serviceId);
    await deleteDoc(favRef);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <HeroNavBar variant="normal" /> {/* ✅ 顶部加 HeroNavBar，普通模式 */}

      <div className="page-container" style={{ paddingTop: "6rem" }}> {/* ✅ 加顶部padding避免被遮挡 */}
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>我的收藏</h2>

        {favorites.length === 0 ? (
          <EmptyState message="你还没有收藏任何服务，快去首页发现喜欢的内容吧～" icon="📌" />
        ) : (
          <div className="card-container">
            {favorites.map((service) => (
              <div
                key={service.id}
                className="card"
                style={{ position: "relative" }}
              >
                {/* 收藏按钮 */}
                <button
                  onClick={() => toggleFavorite(service.id)}
                  title="取消收藏"
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
                    color: "#ffc107",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                    transition: "all 0.2s ease-in-out"
                  }}
                >
                  ⭐
                </button>

                <Link
                  to={`/detail/${service.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <p>
                    <strong>价格：</strong> ¥{service.price}
                  </p>
                  <p>
                    <strong>地点：</strong> {service.location}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default FavoritesPage;
