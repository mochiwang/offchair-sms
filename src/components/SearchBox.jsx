import { useState } from "react";

  

function SearchBox() {
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = () => {
    console.log("搜索条件：", { activity, location, date });
    alert(`搜索中：\n活动：${activity}\n地点：${location}\n时间：${date}`);
  };

  return (
    <div
      style={{
        background: "white",
        padding: "1.5rem",
        borderRadius: "1rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        width: "90%",
        maxWidth: "400px", // ✅ 控制最大宽度，不会太大
        textAlign: "left",
        backgroundColor: "rgba(255, 255, 255, 0.9)", 

      }}
    >
      {/* 活动 */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
          What are you planning?
        </label>
        <input
          type="text"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="Enter your activity"
          style={{
            marginTop: "0.5rem",
            width: "100%",
            padding: "0.8rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
            height: "48px", // ✅ 统一高度
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* 地点 */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
          Where?
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter a city or address"
          style={{
            marginTop: "0.5rem",
            width: "100%",
            padding: "0.8rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
            height: "48px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* 时间 */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
          When?
        </label>
        <input
          type="text"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="Anytime"
          style={{
            marginTop: "0.5rem",
            width: "100%",
            padding: "0.8rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
            height: "48px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* 搜索按钮 */}
      <button
        onClick={handleSearch}
        style={{
          marginTop: "1rem",
          width: "100%",
          background: "black",
          color: "white",
          padding: "0.8rem",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "bold",
          border: "none",
          height: "48px", // ✅ 搜索按钮也是统一高度
          cursor: "pointer",
        }}
      >
        Search ➔
      </button>
    </div>
  );
}

export default SearchBox;
