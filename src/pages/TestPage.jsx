// src/pages/TestPage.jsx
import { getFirestore, doc, setDoc } from "firebase/firestore";
import app from "../firebase";

const db = getFirestore(app);

function TestPage() {
  const handleMarkAsMember = async () => {
    const userId = "0eYzdYyCsvhRdy88hfWd8LUOOLu2";
    const userRef = doc(db, "users", userId);
    try {
      await setDoc(userRef, { isMember: true }, { merge: true });
      alert("✅ 成功标记该用户为会员！");
    } catch (error) {
      console.error("❌ 出错：", error);
      alert("❌ 标记失败，请查看控制台！");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>开发者测试页面</h2>
      <button
        onClick={handleMarkAsMember}
        style={{
          padding: "10px 20px",
          fontSize: "1rem",
          backgroundColor: "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        设置该用户为会员
      </button>
    </div>
  );
}

export default TestPage;
