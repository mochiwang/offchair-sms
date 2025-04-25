// src/pages/MyPage.jsx
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
} from "firebase/firestore";

import app from "../firebase";
import MyServicesTab from "../components/MyServicesTab";
import MyFavoritesTab from "../components/MyFavoritesTab";
import EditProfileModal from "../components/EditProfileModal";
import MyWorksTab from "../components/MyWorksTab";
import { useNavigate } from "react-router-dom";

import Masonry from 'react-masonry-css';
import MyBookingsTab from "../components/MyBookingsTab";
import MyReviewsTab from "../components/MyReviewsTab";




import {
  tabButtonStyle,
  activeTabStyle,
} from "../styleConstants";

const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_AVATARS = [
  "https://i.pravatar.cc/80?img=1",
  "https://i.pravatar.cc/80?img=2",
  "https://i.pravatar.cc/80?img=3",
  "https://i.pravatar.cc/80?img=4",
];

function MyPage() {
  const [activeTab, setActiveTab] = useState("services");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profileRef = doc(db, "users", firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        }
      }
    });
    window.scrollTo(0, 0);
    return () => unsubscribe();
  }, []);



  useEffect(() => {
    console.log("🔥 当前 UID：", currentUser?.uid);
  }, [currentUser]);
  const fetchProfile = async () => {
    if (user) {
      const profileRef = doc(db, "users", user.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setProfile(profileSnap.data());
      }
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case "services":
        return <MyServicesTab />;
      case "favorites":
        return <MyFavoritesTab />;
      case "works":
        return <MyWorksTab />;
      case "bookings":
        return <MyBookingsTab />;
      case "reviews":
        return <MyReviewsTab />;
      default:
        return null;
    }
  };
  

  const avatarUrl =
    profile.avatarUrl ||
    DEFAULT_AVATARS[user?.uid?.charCodeAt(0) % DEFAULT_AVATARS.length] ||
    DEFAULT_AVATARS[0];

  return (
    <div style={{ padding: "6rem 2rem 2rem" }}> {/* 增加顶部 padding 避免导航栏重叠 */}
      <div
        className="profile-header"
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <img
          src={avatarUrl}
          alt="avatar"
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            marginRight: "1rem",
            objectFit: "cover",
          }}
        />
        <div>
          <h2>{profile.displayName || "未命名用户"}</h2>
          <p style={{ color: "#888" }}>{user?.email}</p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
  <button
    onClick={() => setShowEditModal(true)}
    style={{
      backgroundColor: "#edeaff",
      color: "#5c4db1",
      padding: "6px 12px",
      borderRadius: "8px",
      border: "none",
      fontSize: "0.9rem",
      cursor: "pointer",
    }}
  >
    编辑资料
  </button>

  <button
      onClick={() => {
        auth.signOut();
        navigate("/"); // ✅ 登出后跳转到首页
      }}
    style={{
      backgroundColor: "#ffecec",
      color: "#d33",
      padding: "6px 12px",
      borderRadius: "8px",
      border: "none",
      fontSize: "0.9rem",
      cursor: "pointer",
    }}
  >
    退出登录
  </button>
</div>


        </div>
      </div>

      <div
className="tab-bar"
style={{
  display: "flex",
  gap: "1rem",
  borderTop: "0",
  borderLeft: "0",
  borderRight: "0",
  borderBottom: "2px solid #eee", // ✅ 安全写法
  marginBottom: "1rem",
}}
      >
{["services", "favorites", "works", "bookings", "reviews"].map((key) => (
  <button
    key={key}
    onClick={() => setActiveTab(key)}
    style={{
      ...tabButtonStyle,
      ...(activeTab === key ? activeTabStyle : {}),
    }}
  >
    {key === "services"
      ? "我的服务"
      : key === "favorites"
      ? "收藏"
      : key === "works"
      ? "作品集"
      : key === "bookings"
      ? "我的预约"
      : "我的评价"}
  </button>
))}

      </div>

      <div className="tab-content">{renderTab()}</div>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentUser={user}
        refreshProfile={fetchProfile}
      />
    </div>
  );
}

export default MyPage;
