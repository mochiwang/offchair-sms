import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

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

import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import UserProfilePage from "./pages/UserProfilePage";
import TestPage from "./pages/TestPage";
import PaySuccessPage from "./pages/PaySuccessPage";
import PayCancelPage from "./pages/PayCancelPage";
import PaymentReminderModal from "./components/payment/PaymentReminderModal";
import MyReviewsPage from './pages/MyReviewsPage'; // 顶部记得 import 进来
import MyBookingsPage from './pages/MyBookingsPage'; // ✅ 顶部记得 import
import MyServicesPage from './pages/MyServices';
import SearchResults from "./pages/SearchResults";

import './App.css';

const auth = getAuth(app);
const GOOGLE_MAPS_API_KEY = "AIzaSyDcIEOYVRuvJicRMu6uPloOAk9QrbEk7ww";
const LIBRARIES = ["places"]; // ✅ 避免多次传入新数组

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Routes>
      {/* 首页不套 Layout，独立 */}
      <Route path="/" element={<HomePage />} />

      {/* 其他页面继续套 Layout */}
      <Route path="/create" element={<RequireAuth><Layout user={user} variant="normal"><CreatePage /></Layout></RequireAuth>} />

      <Route path="/test" element={<TestPage />} />
      <Route path="/detail/:id" element={<Layout user={user}><DetailPage /></Layout>} />
      <Route path="/login" element={<LoginPage/>} />
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
    </Routes>
  );
}

function App() {
  return (
    <Router>
      {/* ✅ 显示待付款提醒弹窗（全局） */}
      <PaymentReminderModal />
      <AppContent />
    </Router>
  );
}

export default App;
