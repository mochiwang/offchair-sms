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

const auth = getAuth(app);
const db = getFirestore(app);

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const ensureUserInFirestore = async (uid, email) => {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: email,
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await ensureUserInFirestore(user.uid, user.email);
        alert("注册成功！");
        setIsRegister(false);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await ensureUserInFirestore(user.uid, user.email);
        alert("登录成功！");
        navigate("/");
      }
    } catch (error) {
      alert("失败：" + error.message);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f6f6f6",
      }}
    >
      <div
        style={{
          width: "320px",
          padding: "2rem",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem" }}>
          {isRegister ? "注册账户" : "登录账户"}
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "1rem",
            }}
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px",
              backgroundColor: "#96b5f6",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isRegister ? "注册" : "登录"}
          </button>
        </form>
        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{
            marginTop: "1rem",
            fontSize: "0.9rem",
            color: "#5c6bc0",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isRegister ? "已有账户？去登录" : "还没有账户？去注册"}
        </button>
      </div>
    </div>
  );
}


export default LoginPage;
