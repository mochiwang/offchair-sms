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
      <Route path="/" element={<Layout user={user}><HomePage /></Layout>} />
      <Route path="/create" element={
  <Layout user={user}>
    <CreatePage />
  </Layout>
} />
      <Route path="/detail/:id" element={<Layout user={user}><DetailPage /></Layout>} />
      <Route path="/login" element={<Layout user={user}><LoginPage /></Layout>} />
      <Route path="/mypage" element={<RequireAuth><Layout user={user}><MyPage /></Layout></RequireAuth>} />
      <Route path="/chats" element={<RequireAuth><Layout user={user}><ChatListPage /></Layout></RequireAuth>} />
      <Route path="/favorites" element={<RequireAuth><Layout user={user}><FavoritesPage /></Layout></RequireAuth>} />
      <Route path="/friends" element={<RequireAuth><Layout user={user}><FriendsPage /></Layout></RequireAuth>} />
      <Route path="/map" element={<Layout user={user}><MapPage /></Layout>} />
      <Route path="/user/:uid" element={<UserProfilePage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
        <AppContent />
    </Router>
  );
}

export default App;
