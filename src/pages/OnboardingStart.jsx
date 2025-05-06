// src/pages/OnboardingStart.jsx
import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "../firebase";
import { useNavigate } from "react-router-dom";

const auth = getAuth(app);
const db = getFirestore(app);

function OnboardingStart() {
  const navigate = useNavigate();

  useEffect(() => {
    const startOnboarding = async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in first.");
        navigate("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      // 如果已经有 stripeAccountId，说明注册过了
      if (userData?.stripeAccountId) {
        alert("You’ve already connected your Stripe account.");
        navigate("/mypage");
        return;
      }

      try {
        const res = await fetch("https://offchair-backend.vercel.app/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid, email: user.email }),
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert("Failed to create Stripe account link.");
        }
      } catch (err) {
        console.error("Stripe onboarding failed:", err);
        alert("Error: " + err.message);
      }
    };

    startOnboarding();
  }, [navigate]);

  return (
    <div style={{ padding: "6rem", textAlign: "center" }}>
      Connecting to Stripe...
    </div>
  );
}

export default OnboardingStart;
