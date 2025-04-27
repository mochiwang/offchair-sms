// src/components/HeroSection.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBox from "./SearchBox";
import SideMenu from "../components/SideMenu";

const backgroundImages = [
  "/1.jpg",
  "/2.jpg",
  "/3.jpg",
];

function HeroSection() {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [previousBgIndex, setPreviousBgIndex] = useState(null);
  const [bgOpacity, setBgOpacity] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setBgOpacity(0);
      setTimeout(() => {
        setPreviousBgIndex(currentBgIndex);
        setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
        setBgOpacity(1);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentBgIndex]);

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden" }}>
      {/* 上一张背景图 */}
      {previousBgIndex !== null && (
        <div
          style={{
            backgroundImage: `url('${backgroundImages[previousBgIndex]}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            opacity: 1 - bgOpacity,
            transition: "opacity 1s ease-in-out",
            backgroundColor: "black",
            zIndex: 0,
          }}
        />
      )}

      {/* 当前背景图 */}
      <div
        style={{
          backgroundImage: `url('${backgroundImages[currentBgIndex]}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          opacity: bgOpacity,
          transition: "opacity 1s ease-in-out",
          backgroundColor: "black",
          zIndex: 1,
        }}
      />

      {/* 内容部分 */}
      <div style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "white",
        height: "100vh",
        padding: "6rem 1rem 2rem",
      }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "bold",
          marginBottom: "2rem",
          textShadow: "0 2px 6px rgba(0,0,0,0.5)",
        }}>
          Let every passion be visible.<br />
          Let every act of sharing spark a connection.
        </h1>

        {/* 搜索浮窗 */}
        <SearchBox />
      </div>
    </div>
  );
}

export default HeroSection;
