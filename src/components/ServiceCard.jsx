// src/components/ServiceCard.jsx
import { Link } from "react-router-dom";

function ServiceCard({ service, isFav, onToggleFavorite, isOwner, onDelete }) {
  return (
    <div
      className="service-card"
      style={{
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        transition: "transform 0.2s ease",
        width: "100%",
        minWidth: "280px",
        maxWidth: "340px",
        margin: "0 auto",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {/* 删除按钮 */}
      {isOwner && (
        <button
          onClick={() => onDelete(service.id)}
          className="delete-btn"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(255,255,255,0.9)",
            border: "none",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            fontSize: "18px",
            color: "#888",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        >
          ×
        </button>
      )}

      {/* 收藏按钮 */}
      {onToggleFavorite && !isOwner && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(service.id);
          }}
          title={isFav ? "取消收藏" : "添加收藏"}
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
            color: isFav ? "#ffd700" : "#ccc",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        >
          {isFav ? "⭐️" : "☆"}
        </button>
      )}

      {/* 主内容 */}
      <Link
        to={`/detail/${service.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {/* 图片部分 */}
        {service.images?.length > 0 ? (
          <img
            src={service.images[0]}
            alt={service.title}
            loading="lazy"  // ✅ 加上懒加载
            style={{
              width: "100%",
              height: "220px",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "220px",
              backgroundColor: "#f2f2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#bbb",
              fontSize: "0.9rem",
            }}
          >
            无图预览
          </div>
        )}

        {/* 简单文字部分 */}
        <div style={{ padding: "0.8rem" }}>
          <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.3rem" }}>
            {service.title}
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#777" }}>
            {service.zipCode || "未知地点"}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default ServiceCard;
