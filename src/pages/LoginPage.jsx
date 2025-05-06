// src/pages/LoginPage.jsx
import { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import app from "../firebase";
import HeroNavBar from "../components/HeroNavBar";

const auth = getAuth(app);
const db = getFirestore(app);

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();



  const ensureUserInFirestore = async (uid, email, isRegistering = false) => {
    const userRef = doc(db, "users", uid);
    const baseData = {
      email,
      createdAt: serverTimestamp(),
    };
  
    const dataToSet = isRegistering ? { ...baseData, role: "guest" } : baseData;
  
    await setDoc(userRef, dataToSet, { merge: true });
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await ensureUserInFirestore(user.uid, user.email, true);



        alert("✅ 登录成功，请点击确认继续");
        navigate("/mybookings");


        setIsRegister(false);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await ensureUserInFirestore(user.uid, user.email); // ✅ 登录只合并数据，不写 role


        navigate("/");
      }
    } catch (error) {
      alert("失败：" + error.message);
    }
  };

  // 背景点击时返回首页
  const handleBackgroundClick = () => {
    navigate("/");
  };

  return (
    <div style={{ 
      width: "100%", 
      minHeight: "100vh", 
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* 顶部 HeroNavBar */}
      <HeroNavBar />

      {/* 右上角关闭按钮 */}
      <button
        onClick={handleBackgroundClick}
        style={{
          position: "fixed",
          top: "18px",
          right: "20px",
          background: "transparent",
          border: "none",
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#333",
          cursor: "pointer",
          zIndex: 1100,
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        ×
      </button>

      {/* 背景可点击区域 */}
      <div
        onClick={handleBackgroundClick}
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
        }}
      >
        {/* 白色卡片内部，阻止点击冒泡 */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "400px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "2rem 1.5rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 10,
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: "0.5rem", fontWeight: "bold" }}>
            {isRegister ? "Sign Up" : "Welcome back"}
          </h2>

          {!isRegister && (
            <p style={{ textAlign: "center", marginBottom: "1.5rem", fontSize: "0.9rem", color: "#666" }}>
              Please log in
            </p>
          )}

          {/* 第三方登录按钮 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <button style={thirdPartyButtonStyle}>Sign up with Google</button>
            <button style={thirdPartyButtonStyle}>Sign up with Apple</button>
            <button style={thirdPartyButtonStyle}>Sign up with Facebook</button>
          </div>

          {/* 分隔线 */}
          <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#ddd" }} />
            <div style={{ margin: "0 0.5rem", color: "#aaa", fontSize: "0.8rem" }}>or</div>
            <div style={{ flex: 1, height: "1px", background: "#ddd" }} />
          </div>

          {/* 邮箱登录表单 */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
            <button
              type="submit"
              style={{
                padding: "12px",
                backgroundColor: "#6B5BFF",
                color: "white",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              {isRegister ? "Sign Up" : "Log In"}
            </button>
          </form>

          {/* 忘记密码 */}
          {!isRegister && (
            <div style={{ textAlign: "center", marginTop: "0.8rem" }}>
              <a href="#" style={{ color: "#6B5BFF", fontSize: "0.85rem", textDecoration: "none" }}>
                Forgot Password
              </a>
            </div>
          )}

          {/* 切换登录/注册 */}
          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem" }}>
            {isRegister ? "Already have an account?" : "Don't have an account?"}
            <span
              onClick={() => setIsRegister(!isRegister)}
              style={{ marginLeft: "0.3rem", color: "#6B5BFF", cursor: "pointer", fontWeight: "bold" }}
            >
              {isRegister ? "Log In" : "Sign Up"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "1rem",
};

const thirdPartyButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "12px",
  borderRadius: "8px",
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
  color: "#333",
};

export default LoginPage;
