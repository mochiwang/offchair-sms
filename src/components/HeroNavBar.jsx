import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import SideMenuOverlay from "./SideMenuOverlay";



/**
 * HeroNavBar
 * @param {string} variant "home" | "normal"  - "home"表示首页，透明开始；"normal"表示普通页，黑色背景开始
 */
function HeroNavBar({ variant = "normal" }) {
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

  // ✅ 根据 variant 决定背景颜色
  const backgroundColor = (() => {
    if (variant === "home") {
      return isScrolled ? "rgba(0, 0, 0, 0.8)" : "transparent";
    } else {
      return "rgba(0, 0, 0, 0.8)";
    }
  })();

  // ✅ 滚动后加阴影，增加层次感
  const boxShadow = isScrolled ? "0 2px 6px rgba(0,0,0,0.2)" : "none";

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
          backgroundColor: backgroundColor,
          color: "white",
          transition: "background-color 0.3s ease",
          boxShadow: boxShadow,
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

        {/* 右边三道杠按钮 */}
        <div style={{ paddingRight: "1rem" }}>
          <button
            onClick={() => setShowMenu(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              fontSize: "2rem",
              cursor: "pointer",
              padding: "0.3rem 0.8rem",
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* 三道杠菜单浮窗 */}
      {showMenu && (
        <SideMenuOverlay currentUser={currentUser} onClose={() => setShowMenu(false)} />
      )}
    </>
  );
}

export default HeroNavBar;
