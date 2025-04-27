// src/components/HeroNavBar.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SideMenuOverlay from "./SideMenuOverlay";
import { getAuth } from "firebase/auth";

function HeroNavBar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  return (
    <>
      {/* 顶部固定白色导航栏 */}
      <div
        style={{
          width: "100%",
          height: "64px",
          backgroundColor: "white",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 1.5rem",
          boxSizing: "border-box",
          boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
        }}
      >
        {/* 左侧 Logo */}
        <div
          onClick={() => navigate("/")}
          style={{
            fontSize: "1.8rem",
            fontWeight: "bold",
            color: "#333",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          OffChair
        </div>

        {/* 右侧 三道杠按钮 */}
        <button
          onClick={() => setShowMenu(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "#333",
            fontSize: "2rem",
            cursor: "pointer",
            padding: "0.5rem",
          }}
        >
          ☰
        </button>
      </div>

      {/* 三道杠菜单浮出 */}
      {showMenu && (
        <SideMenuOverlay currentUser={currentUser} onClose={() => setShowMenu(false)} />
      )}
    </>
  );
}

export default HeroNavBar;
