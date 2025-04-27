import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../App.css"; // ✅ 假设动画放到你的全局 css

function SideMenu({ currentUser, onClose }) {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
    navigate("/");
  };

  const handleProtectedNavigation = (path) => {
    if (currentUser) {
      navigate(path);
    } else {
      navigate("/login");
    }
    onClose();
  };

  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 1099,
        }}
      ></div>

      {/* 侧滑菜单 */}
      <div className="side-menu-slide">
        <button
          onClick={onClose}
          style={{
            alignSelf: "flex-end",
            background: "transparent",
            border: "none",
            fontSize: "1.8rem",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          ×
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <MenuItem label="Home" onClick={() => { navigate("/"); onClose(); }} />

          {currentUser && (
            <>
              <MenuItem label="My Page" onClick={() => { navigate("/mypage"); onClose(); }} />
              <MenuItem label="My Favorites" onClick={() => { navigate("/favorites"); onClose(); }} />
              <MenuItem label="My Bookings" onClick={() => { navigate("/bookings"); onClose(); }} />
            </>
          )}

          <div style={{ borderBottom: "1px solid #eee", margin: "1rem 0" }} />

          <MenuItem label="Post a Service" onClick={() => handleProtectedNavigation("/create")} />

          {currentUser && (
            <MenuItem label="Settings" onClick={() => { navigate("/settings"); onClose(); }} />
          )}

          <div style={{ borderBottom: "1px solid #eee", margin: "1rem 0" }} />

          {currentUser ? (
            <MenuItem label="Logout" onClick={handleLogout} />
          ) : (
            <>
              <MenuItem label="Login" onClick={() => { navigate("/login"); onClose(); }} />
              <MenuItem label="Register" onClick={() => { navigate("/register"); onClose(); }} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function MenuItem({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        textAlign: "left",
        padding: "0.5rem 0",
        fontSize: "1rem",
        fontWeight: "bold",
        color: "#333",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default SideMenu;
