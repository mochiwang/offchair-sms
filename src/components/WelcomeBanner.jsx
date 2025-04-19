import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import app from "../firebase";

const auth = getAuth(app);

function WelcomeBanner({ user }) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <div style={{ marginBottom: "1rem", color: "#777" }}>
        未登录，请 <span
          style={{ color: "#0073bb", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => navigate("/login")}
        >前往登录</span>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      👋 欢迎回来，{user.email}
      <button
        onClick={async () => {
          localStorage.setItem("loggingOut", "true");
          await signOut(auth);
          navigate("/");
        }}
        style={{
          marginLeft: "1rem",
          padding: "6px 12px",
          backgroundColor: "#ddd",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        登出
      </button>
    </div>
  );
}

export default WelcomeBanner;
