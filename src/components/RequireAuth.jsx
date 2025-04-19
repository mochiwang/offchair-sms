import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../firebase";

const auth = getAuth(app);

function RequireAuth({ children }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const isLoggingOut = localStorage.getItem("loggingOut");

      setUser(firebaseUser);
      setChecking(false);

      if (!firebaseUser && !isLoggingOut) {
        alert("请先登录！");
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (checking) return null;

  return user ? children : null;
}

export default RequireAuth;
