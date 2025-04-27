// src/components/RecommendedSection.jsx
import { useNavigate } from "react-router-dom";

function RecommendedSection() {
  const navigate = useNavigate();

  const handleViewDetail = () => {
    navigate("/search?keyword=%E7%BE%8E%E7%94%B2"); // 中文URL编码，代表美甲
  };

  return (
    <section style={{ backgroundColor: "#f7f7f7", padding: "4rem 1rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", textAlign: "center", marginBottom: "2rem" }}>
          Recommended Services
        </h2>

        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}>
          {/* 服务图片（可选） */}
          <img
            src="/categories/nail.jpg"
            alt="Nail Art"
            style={{
              width: "120px",
              height: "120px",
              objectFit: "cover",
              borderRadius: "12px",
              marginBottom: "1.5rem",
            }}
          />

          {/* 服务标题 */}
          <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>Professional Nail Art</h3>

          {/* 服务描述 */}
          <p style={{ fontSize: "1rem", color: "#555", marginBottom: "1.5rem" }}>
            Discover the best nail art services near you. Book talented artists for your next look!
          </p>

          {/* 查看详情按钮 */}
          <button
            onClick={handleViewDetail}
            style={{
              padding: "0.8rem 2rem",
              borderRadius: "8px",
              backgroundColor: "black",
              color: "white",
              fontSize: "1rem",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#333"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "black"}
          >
            Explore
          </button>
        </div>
      </div>
    </section>
  );
}

export default RecommendedSection;
