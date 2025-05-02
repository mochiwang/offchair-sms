// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from './firebase';

import HomePage from './pages/HomePage';
import FriendsPage from './pages/FriendsPage';
import CreatePage from './pages/CreatePage';
import DetailPage from './pages/DetailPage';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage';
import ChatListPage from './pages/ChatListPage';
import FavoritesPage from './pages/FavoritesPage';
import MapPage from './pages/MapPage';
import UserProfilePage from './pages/UserProfilePage';
import TestPage from './pages/TestPage';
import PaySuccessPage from './pages/PaySuccessPage';
import PayCancelPage from './pages/PayCancelPage';
import MyReviewsPage from './pages/MyReviewsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import MyServicesPage from './pages/MyServices';
import SearchResults from './pages/SearchResults';

import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import PaymentReminderModal from './components/payment/PaymentReminderModal';
import PaymentSuccess from './pages/PaymentSuccess';
import RateService from './pages/RateService';

import './App.css';

const auth = getAuth(app);

function AppContent() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();

  // ✅ 监听登录状态
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("✅ 登录状态更新，当前 UID:", firebaseUser?.uid || "未登录");
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // ✅ 自动登出逻辑（30 分钟无操作）
  useEffect(() => {
    if (!auth.currentUser) return;

    let lastActivity = Date.now();
    const updateActivity = () => lastActivity = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > 30 * 60 * 1000) {
        clearInterval(interval);
        signOut(auth).then(() => {
          alert("You’ve been logged out due to inactivity.");
          navigate("/login");
        });
      }
    }, 60 * 1000);

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
    };
  }, [auth.currentUser, navigate]);

  if (!authReady) {
    return <div style={{ padding: '6rem', textAlign: 'center' }}>Loading authentication...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<RequireAuth><Layout user={user} variant="normal"><CreatePage /></Layout></RequireAuth>} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/detail/:id" element={<Layout user={user}><DetailPage /></Layout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/mypage" element={<RequireAuth><Layout user={user}><MyPage /></Layout></RequireAuth>} />
      <Route path="/chats" element={<RequireAuth><Layout user={user}><ChatListPage /></Layout></RequireAuth>} />
      <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
      <Route path="/friends" element={<RequireAuth><Layout user={user}><FriendsPage /></Layout></RequireAuth>} />
      <Route path="/myreviews" element={<RequireAuth><MyReviewsPage /></RequireAuth>} />
      <Route path="/map" element={<Layout user={user}><MapPage /></Layout>} />
      <Route path="/user/:uid" element={<UserProfilePage />} />
      <Route path="/pay/success" element={<PaySuccessPage />} />
      <Route path="/pay/cancel" element={<PayCancelPage />} />
      <Route path="/myservices" element={<RequireAuth><MyServicesPage /></RequireAuth>} />
      <Route path="/search" element={<Layout variant="normal"><SearchResults /></Layout>} />
      <Route path="/mybookings" element={<RequireAuth><MyBookingsPage /></RequireAuth>} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/rate/:serviceId" element={<RateService />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <PaymentReminderModal />
      <AppContent />
    </Router>
  );
}

export default App;
