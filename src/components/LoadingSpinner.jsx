function LoadingSpinner() {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div className="loader" style={spinnerStyle} />
        <p style={{ color: "#666", marginTop: "1rem" }}>加载中...</p>
      </div>
    );
  }
  
  const spinnerStyle = {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #0073bb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  };
  
  export default LoadingSpinner;
  