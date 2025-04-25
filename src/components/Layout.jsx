import NavBar from "./NavBar";
import ChatPopup from "./ChatPopup";
import { getAuth, signOut } from "firebase/auth";
import app from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import PaymentReminderModal from "../components/payment/PaymentReminderModal";


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
      {children}
      <PaymentReminderModal /> {/* ✅ 放在页面底部 */}
    </>
  );

}

export default Layout;