import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SearchBox() {
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("Anytime");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (activity.trim()) params.append("activity", activity.trim());
    if (location.trim()) params.append("location", location.trim());
    if (time.trim() && time !== "Anytime") params.append("time", time.trim());

    // 跳转到搜索结果页面并附带参数
    navigate(`/search?${params.toString()}`);
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

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "0.95rem",
  height: "36px",
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
  height: "42px",
  cursor: "pointer",
  width: "100%",
  marginTop: "6px",
};

export default SearchBox;
