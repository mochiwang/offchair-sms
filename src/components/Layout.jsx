import HeroNavBar from "./HeroNavBar"; // ✅ 用新版 HeroNavBar
import ChatPopup from "./ChatPopup";
import { getAuth } from "firebase/auth";
import app from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import PaymentReminderModal from "../components/payment/PaymentReminderModal";

const auth = getAuth(app);

/**
 * Layout
 * @param {object} props
 * @param {ReactNode} props.children - 子元素
 * @param {object} props.user - 当前用户
 * @param {string} props.variant - "home" | "normal" - 顶部导航栏风格
 */
function Layout({ children, user, variant = "normal" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isMapPage = location.pathname === "/map";

  if (isMapPage) {
    return (
      <>
        <HeroNavBar variant="normal" /> {/* 地图页也是黑色背景导航 */}
        <div style={{ height: "100vh", overflow: "hidden" }}>{children}</div>
      </>
    );
  }

  return (
    <>
      <HeroNavBar variant={variant} /> {/* 使用传入的 variant */}
      <ChatPopup />
      <div style={{ paddingTop: "64px" }}>{children}</div> {/* 给导航栏留出高度 */}
      <PaymentReminderModal />
    </>
  );
}

export default Layout;
