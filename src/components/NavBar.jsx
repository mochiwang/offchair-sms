import { NavLink } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import app from "../firebase";
import { useNavigate } from "react-router-dom";


const auth = getAuth(app);

function NavBar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  return (
    <nav className="navbar">
      {/* 左侧：Logo + 标题 */}
      <div className="navbar-logo">
        <img
          src="/logo-cropped .PNG"
          alt="Logo"
          className="navbar-logo-image"
        />
      </div>


      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => isActive ? "active-link" : ""}>首页</NavLink>

        {/* ✅ 加入地图链接，并放在首页后面 */}
        <NavLink to="/map" className={({ isActive }) => isActive ? "active-link" : ""}>地图</NavLink>

        <NavLink to="/create" className={({ isActive }) => isActive ? "active-link" : ""}>发布服务</NavLink>

        {user ? (
          <>
          <NavLink to="/mypage" className={({ isActive }) => isActive ? "active-link" : ""}>我的服务</NavLink>
            <NavLink to="/favorites" className={({ isActive }) => isActive ? "active-link" : ""}>收藏</NavLink>
            <NavLink to="/friends" className={({ isActive }) => isActive ? "active-link" : ""}>好友</NavLink>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => isActive ? "active-link" : ""}>登录</NavLink>
        )}
      </div>
    </nav>
  );
}

export default NavBar;