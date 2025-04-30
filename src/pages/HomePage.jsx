import { useState, useEffect } from "react";
import HeroNavBar from "../components/HeroNavBar";
import HeroSection from "../components/HeroSection";
import RecommendedSection from "../components/RecommendedSection";
import CategorySection from "../components/CategorySection";
import WhyOffChairSection from "../components/WhyOffChairSection";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../firebase";

const auth = getAuth(app);

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const openMenu = () => {
    setMenuOpen(true);
    setTimeout(() => setMenuAnimating(true), 20);
  };

  const closeMenu = () => {
    setMenuAnimating(false);
    setTimeout(() => setMenuOpen(false), 300);
  };

  const handlePostTaskClick = () => {
    if (currentUser) {
      navigate("/create");
    } else {
      navigate("/login");
    }
    closeMenu();
  };

  const menuItems = [
    { label: "Post a Task", action: handlePostTaskClick },
    { label: "Login", path: "/login" },
    { label: "Help", path: "/help" },
  ];

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      {/* 顶部导航栏 */}
      <HeroNavBar onMenuOpen={openMenu} variant="home" />

      {/* 弹出菜单浮窗 */}
      {menuOpen && (
        <div
          onClick={closeMenu}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.9)",
            zIndex: 1002,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: menuAnimating ? "translateY(0)" : "translateY(-30px)",
            opacity: menuAnimating ? 1 : 0,
            transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
            pointerEvents: menuAnimating ? "auto" : "none",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              textAlign: "center",
              color: "white",
              fontSize: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            {menuItems.map((item, index) => (
              <div
                key={index}
                style={{
                  cursor: "pointer",
                  padding: "0.8rem 1.5rem",
                  borderRadius: "12px",
                  transition: "all 0.25s ease",
                }}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    navigate(item.path);
                    closeMenu();
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 主体内容结构（保持你原来喜欢的三段式） */}
      <HeroSection />
      <RecommendedSection />
      <CategorySection />
      <WhyOffChairSection />
      <Footer />
    </div>
  );
}

export default HomePage;
