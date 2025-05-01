import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

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
import MyReviewsPage from './pages/MyReviewsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import MyServicesPage from './pages/MyServices';
import SearchResults from "./pages/SearchResults";

import './App.css';

const auth = getAuth(app);

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // ✅ 自动登出逻辑
  useEffect(() => {
    if (!auth.currentUser) return;

    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const THIRTY_MINUTES = 30 * 60 * 1000;
      if (now - lastActivity > THIRTY_MINUTES) {
        clearInterval(checkInactivity);
        signOut(auth).then(() => {
          alert("You’ve been logged out due to 30 minutes of inactivity.");
          navigate("/login");
        });
      }
    }, 60 * 1000); // 每分钟检查一次

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);

    return () => {
      clearInterval(checkInactivity);
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
    };
  }, [auth.currentUser, navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
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
      <PaymentReminderModal />
      <AppContent />
    </Router>
  );
}

export default App;
