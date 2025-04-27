// src/components/SearchBox.jsx
import { useState } from "react";

function SearchBox() {
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("Anytime");

  const handleSearch = (e) => {
    e.preventDefault();
    // 这里可以写跳转或搜索逻辑
    console.log("Searching:", { activity, location, time });
  };

  return (
    <form onSubmit={handleSearch} style={formStyle}>
      <input
        type="text"
        placeholder="What are you planning?"
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="Where?"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="When?"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        style={inputStyle}
      />
      <button type="submit" style={buttonStyle}>
        Search →
      </button>
    </form>
  );
}

// 样式调整：重点让搜索框更扁、更紧凑
const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px", // 输入框之间间距小一点
};

const inputStyle = {
  padding: "8px 10px",         // ✅ padding变小
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "0.95rem",          // ✅ 字体略小
  height: "36px",               // ✅ 高度压低
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "8px 14px",
  backgroundColor: "black",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  fontSize: "1rem",
  height: "42px",               // ✅ 按钮高度压低
  cursor: "pointer",
  width: "100%",
  marginTop: "6px",             // ✅ 按钮和输入框间距小一点
};

export default SearchBox;
