import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "../App.css"; // 确保引入了你的动画样式

function SideMenuOverlay({ currentUser, onClose }) {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleProtectedNavigation = (path) => {
    if (currentUser) {
      navigate(path);
    } else {
      navigate("/login");
    }
    onClose();
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
    navigate("/");
  };

  return (
    <div className="overlay-container" onClick={onClose}>
      <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
        {/* 三道杠弹出的菜单内容 */}

        {/* 所有人都能看到 */}
        <MenuButton text="Post a Service" onClick={() => handleProtectedNavigation("/create")} delay={0.1} />

        {currentUser ? (
          <>
            {/* 登录后才出现 */}
            <MenuButton text="My Page" onClick={() => { navigate("/mypage"); onClose(); }} delay={0.2} />
            <MenuButton text="My Services" onClick={() => { navigate("/myservices"); onClose(); }} delay={0.3} />
            <MenuButton text="My Favorites" onClick={() => { navigate("/favorites"); onClose(); }} delay={0.4} />
            <MenuButton text="My Bookings" onClick={() => { navigate("/mybookings"); onClose(); }} delay={0.5} />
            <MenuButton text="My Reviews" onClick={() => { navigate("/myreviews"); onClose(); }} delay={0.6} />
            <MenuButton text="Help" onClick={() => { navigate("/help"); onClose(); }} delay={0.7} />
            <MenuButton text="Logout" onClick={handleLogout} delay={0.8} />
          </>
        ) : (
          <>
            {/* 未登录时 */}
            <MenuButton text="Login" onClick={() => { navigate("/login"); onClose(); }} delay={0.2} />
            <MenuButton text="Help" onClick={() => { navigate("/help"); onClose(); }} delay={0.3} />
          </>
        )}
      </div>
    </div>
  );
}

function MenuButton({ text, onClick, delay = 0 }) {
  return (
    <button
      className="overlay-button fade-in"
      onClick={onClick}
      style={{
        backgroundColor: "transparent",
        border: "none",
        color: "white",
        fontSize: "1.2rem",
        padding: "1rem",
        cursor: "pointer",
        width: "100%",
        textAlign: "center",
        animationDelay: `${delay}s`,
      }}
    >
      {text}
    </button>
  );
}

export default SideMenuOverlay;
