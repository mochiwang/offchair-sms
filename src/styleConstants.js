// src/styleConstants.js
export const primaryButtonStyle = {
    backgroundColor: "#bfcaff",  // 蓝紫色
    color: "#333",
    padding: "8px 16px",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  };
  
  export const tabButtonStyle = {
    backgroundColor: "#f1f1f1",
    color: "#333",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    borderBottom: "none", // ✅ 避免和 activeTabStyle 冲突
    padding: "6px 16px",
    fontWeight: "bold",
    borderRadius: "12px",
    cursor: "pointer",
    marginRight: "1rem",
  };
  
  export const activeTabStyle = {
    backgroundColor: "#edeaff",  // 淡紫色背景
    borderBottom: "3px solid #8c7ae6",  // 紫色底线
    color: "#5c4db1",  // 深紫色文字
  };

  export const primaryPurpleButtonStyle = {
    backgroundColor: "#edeaff",  // 背景淡紫
    color: "#5c4db1",            // 字体深紫
    padding: "8px 16px",
    border: "none",
    borderRadius: "20px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };
  