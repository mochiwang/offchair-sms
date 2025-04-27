// src/components/HeroNavBar.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import SideMenuOverlay from "./SideMenuOverlay";

function HeroNavBar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* 顶部导航栏 */}
      <div
        style={{
          width: "100%",
          height: "64px",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 1.5rem",
          backgroundColor: isScrolled ? "rgba(0, 0, 0, 0.8)" : "transparent",
          color: "white",
          transition: "background-color 0.3s ease",
          boxShadow: isScrolled ? "0 2px 6px rgba(0,0,0,0.2)" : "none",
        }}
      >
        {/* 左边 Logo */}
        <div
          onClick={() => navigate("/")}
          style={{
            fontSize: "1.8rem",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            cursor: "pointer",
          }}
        >
          OffChair
        </div>

        {/* 右边 三道杠按钮（✅加微调，避免太贴边） */}
        <div style={{ paddingRight: "0.3rem" }}>
          <button
            onClick={() => setShowMenu(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              fontSize: "2rem",
              cursor: "pointer",
              padding: "0.3rem 0.5rem", // ✅按钮本身也加点padding，点起来更顺手
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* 三道杠菜单浮出 */}
      {showMenu && (
        <SideMenuOverlay currentUser={currentUser} onClose={() => setShowMenu(false)} />
      )}
    </>
  );
}

export default HeroNavBar;
