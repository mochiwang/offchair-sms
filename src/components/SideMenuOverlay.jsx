// src/components/SideMenuOverlay.jsx
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "../App.css"; // 引入你的动画样式

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
        {/* 动态菜单内容 */}
        <MenuButton text="Post a Service" onClick={() => handleProtectedNavigation("/create")} />

        {currentUser ? (
          <>
            <MenuButton text="My Page" onClick={() => { navigate("/mypage"); onClose(); }} />
            <MenuButton text="Help" onClick={() => { navigate("/help"); onClose(); }} />
            <MenuButton text="Logout" onClick={handleLogout} />
          </>
        ) : (
          <>
            <MenuButton text="Login" onClick={() => { navigate("/login"); onClose(); }} />
            <MenuButton text="Help" onClick={() => { navigate("/help"); onClose(); }} />
          </>
        )}
      </div>
    </div>
  );
}

function MenuButton({ text, onClick }) {
  return (
    <button className="overlay-button" onClick={onClick}>
      {text}
    </button>
  );
}

export default SideMenuOverlay;
