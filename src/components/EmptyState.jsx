function EmptyState({ message = "No content yet", icon = "📭" }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "3rem 1rem",
        color: "#666",
        opacity: 0.9,
      }}
    >
      <div style={{ fontSize: "3.5rem" }}>{icon}</div>
      <p style={{ marginTop: "1rem", fontSize: "1.1rem", lineHeight: "1.6" }}>
        {message}
      </p>
    </div>
  );
}

export default EmptyState;
