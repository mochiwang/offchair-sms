// src/components/HeroSection.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBox from "./SearchBox";

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
    <div style={{ width: "100%", overflow: "hidden", backgroundColor: "black" }}>
      
      {/* 背景区 */}
      <div style={{ width: "100%", height: "85vh", position: "relative" }}>
        
        {/* 当前背景图 */}
        <div style={{
          backgroundImage: `url('${backgroundImages[currentBgIndex]}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          transition: "opacity 1s ease-in-out",
          opacity: bgOpacity,
        }} />

        {/* 黑色渐变遮罩 */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.5) 80%)",
          zIndex: 2,
        }} />

        {/* 内容层 */}
        <div style={{
          position: "relative",
          zIndex: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: "2rem",
          textAlign: "center",
          color: "white",
        }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            textShadow: "0 2px 6px rgba(0,0,0,0.5)",
          }}>
            Let every passion be visible.<br />
            Let every act of sharing spark a connection.
          </h1>

          {/* 搜索框 */}
          <div style={{
            width: "85%",
            maxWidth: "420px",
          }}>
            <SearchBox />
          </div>
        </div>
      </div>

      {/* 下方黑色区域补充 */}
      <div style={{
        width: "100%",
        minHeight: "15vh",
        backgroundColor: "black",
      }}>
        {/* 这里可以继续布局首页其他内容 */}
      </div>
    </div>
  );
}

export default HeroSection;
