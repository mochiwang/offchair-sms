import NavBar from "./NavBar";
import ChatPopup from "./ChatPopup";
import { getAuth, signOut } from "firebase/auth";
import app from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";

const auth = getAuth(app);

function Layout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isMapPage = location.pathname === "/map";

  // ✅ 地图页：不渲染聊天组件和用户信息，仅渲染 NavBar + children
  if (isMapPage) {
    return (
      <>
        <NavBar />
        <div style={{ height: "100vh", overflow: "hidden" }}>{children}</div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <ChatPopup />
      {/* ✅ Layout 不再包裹 page-container，页面自己控制容器 */}
      {children}
    </>
  );
}

export default Layout;