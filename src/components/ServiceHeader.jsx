// src/components/ServiceHeader.jsx
import { useNavigate } from "react-router-dom";


function ServiceHeader({
  title,
  isFav,
  toggleFavorite,
  sellerName,
  sellerAvatar,
  sellerId,
  rating,
}) {
  const navigate = useNavigate();

  return (
    <div style={{ marginBottom: "2rem" }}>
      {/* 标题 + 收藏按钮 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>{title}</h1>
        <span
          style={{
            fontSize: "2rem",
            cursor: "pointer",
            color: isFav ? "#f7b500" : "#aaa",
            userSelect: "none",
          }}
          onClick={toggleFavorite}
        >
          {isFav ? "★" : "☆"}
        </span>
      </div>

      {/* 商家头像 + 昵称 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          cursor: "pointer",
        }}
        onClick={() => navigate(`/user/${sellerId}`)}
      >
        <img
          src={sellerAvatar || "https://via.placeholder.com/48"}
          alt="商家头像"
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <div>
          <div style={{ fontWeight: "bold", fontSize: "1rem", color: "#333" }}>
            {sellerName || "商家"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#888" }}>点击查看商家主页</div>
        </div>
      </div>

      {/* 评分展示 */}
      <div style={{ display: "flex", alignItems: "center", margin: "0.5rem 0" }}>
        <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>评分：</span>
        <span style={{ marginLeft: "0.5rem", color: "#555" }}>
          {rating ? `${rating.toFixed(1)} 分` : "暂无评分"}
        </span>
      </div>
    </div>
  );
}

export default ServiceHeader;
