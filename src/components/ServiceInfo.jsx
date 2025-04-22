// src/components/ServiceInfo.jsx
function ServiceInfo({ description, price, location, tags, createdAt }) {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "1.1rem", color: "#555" }}>{description}</p>
        <p>
          <strong>价格：</strong> ¥{price}
        </p>
        <p>
          <strong>地址：</strong> {location || "请登录后查看"}
        </p>
        <p>
          <strong>标签：</strong>{" "}
          {tags?.map((t) => `#${t}`).join(" ") || "暂无标签"}
        </p>
        {createdAt?.toDate && (
          <p style={{ fontSize: "0.9rem", color: "#888" }}>
            发布时间：{createdAt.toDate().toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  
  export default ServiceInfo;
  