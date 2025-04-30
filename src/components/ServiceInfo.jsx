// src/components/ServiceInfo.jsx

function ServiceInfo({ description, price, location, tags, createdAt }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p style={{ fontSize: "1.1rem", color: "#555" }}>{description}</p>
      <p>
        <strong>Price:</strong> ¥{price}
      </p>
      <p>
        <strong>Location:</strong> {location || "Please log in to view"}
      </p>
      <p>
        <strong>Tags:</strong>{" "}
        {tags?.length > 0 ? tags.map((t) => `#${t}`).join(" ") : "No tags"}
      </p>
      {createdAt?.toDate && (
        <p style={{ fontSize: "0.9rem", color: "#888" }}>
          Posted on: {createdAt.toDate().toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default ServiceInfo;
