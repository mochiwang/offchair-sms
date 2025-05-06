import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { startOfMonth } from "date-fns";

import "../App.css";

function SideMenuOverlay({ currentUser, onClose }) {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const [role, setRole] = useState(null);
  const [stripeAccountId, setStripeAccountId] = useState(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRole(data.role);
          setStripeAccountId(data.stripeAccountId || null);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchMonthlyEarnings = async () => {
      if (currentUser && role === "merchant") {
        const beginningOfMonth = Timestamp.fromDate(startOfMonth(new Date()));
        const q = query(
          collection(db, "appointments"),
          where("serviceOwnerId", "==", currentUser.uid),
          where("paid", "==", true),
          where("startTime", ">=", beginningOfMonth)
        );
        
        const snapshot = await getDocs(q);
        let total = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          total += data.amount || 0;
        });
        setMonthlyEarnings(total / 100); // cents to dollars
      }
    };

    fetchMonthlyEarnings();
  }, [currentUser, role]);

  const handleToggleRole = async () => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);

    if (role === "guest") {
      if (!stripeAccountId) {
        navigate("/onboarding/start");
        onClose();
        return;
      }
      await updateDoc(userRef, { role: "merchant" });
      setRole("merchant");
    } else {
      await updateDoc(userRef, { role: "guest" });
      setRole("guest");
    }
  };

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
        {currentUser && (
          <div
            style={{
              color: "#fff",
              padding: "1rem",
              textAlign: "center",
              marginTop: "1rem",
              backgroundColor: "rgba(0,0,0,0.6)",
              zIndex: 10,
              position: "relative",
              borderBottom: "1px solid #555",
            }}
          >
            Current Role: <strong>{role === "merchant" ? "Merchant" : "Guest"}</strong>
            <br />
            <button
              onClick={handleToggleRole}
              style={{
                marginTop: "0.5rem",
                backgroundColor: "#fff",
                color: "#333",
                padding: "6px 12px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Switch to {role === "merchant" ? "Guest" : "Merchant"}
            </button>
          </div>
        )}

        {currentUser ? (
          role === "merchant" ? (
            <>
              <MenuButton text="My Page" onClick={() => { navigate("/mypage"); onClose(); }} delay={0.1} />
              <MenuButton text="My Services" onClick={() => { navigate("/myservices"); onClose(); }} delay={0.2} />
              <MenuButton text="Reservations for Me" onClick={() => { navigate("/ReservationsForMe"); onClose(); }} delay={0.3} />

              {/* 💰 Earnings 按钮 */}
              <button
                onClick={() => { navigate("/finance"); onClose(); }}
                style={{
                  backgroundColor: "#8B5CF6",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  margin: "0.5rem 1rem",
                  border: "none",
                  cursor: "pointer",
                  width: "calc(100% - 2rem)",
                  transition: "background-color 0.3s ease",
                }}
              >
                💰 Earnings This Month: ${monthlyEarnings.toFixed(2)}
              </button>
              
              <MenuButton text="Logout" onClick={handleLogout} delay={0.7} />
            </>
          ) : (
            <>
              <MenuButton text="My Page" onClick={() => { navigate("/mypage"); onClose(); }} delay={0.1} />
              <MenuButton text="My Favorites" onClick={() => { navigate("/favorites"); onClose(); }} delay={0.2} />
              <MenuButton text="My Bookings" onClick={() => { navigate("/mybookings"); onClose(); }} delay={0.3} />
              <MenuButton text="Transaction History" onClick={() => { navigate("/transaction-history"); onClose(); }} delay={0.45} />

           
              <MenuButton text="Logout" onClick={handleLogout} delay={0.6} />
            </>
          )
        ) : (
          <>
            <MenuButton text="Login" onClick={() => { navigate("/login"); onClose(); }} delay={0.2} />

          </>
        )}
      </div>
    </div>
  );
}

function MenuButton({ text, onClick, delay = 0 }) {
  return (
    <button
      className="overlay-button fade-in"
      onClick={onClick}
      style={{
        backgroundColor: "transparent",
        border: "none",
        color: "white",
        fontSize: "1.2rem",
        padding: "1rem",
        cursor: "pointer",
        width: "100%",
        textAlign: "center",
        animationDelay: `${delay}s`,
      }}
    >
      {text}
    </button>
  );
}

export default SideMenuOverlay;
