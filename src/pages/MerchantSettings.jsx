// src/pages/MerchantSettings.jsx

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import app from "../firebase";

const db = getFirestore(app);
const auth = getAuth(app);

function MerchantSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingUrl, setOnboardingUrl] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStripeInfo = async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("Please login first.");
        navigate("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("User not found");
        return;
      }

      const data = userSnap.data();
      setAccountId(data.stripeAccountId || null);

      if (!data.stripeAccountId) {
        // 未开户，调用后端 API 获取 onboarding 链接
        const res = await fetch("/api/create-stripe-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid }),
        });

        const result = await res.json();
        if (result.url) setOnboardingUrl(result.url);
      }

      setIsLoading(false);
    };

    fetchStripeInfo();
  }, [navigate]);

  if (isLoading) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div style={{ padding: "6rem 1rem 2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem" }}>
        Merchant Payment Settings
      </h1>

      {accountId ? (
        <>
          <p>Your Stripe account is linked.</p>
          <p>Account ID: <code>{accountId}</code></p>
        </>
      ) : onboardingUrl ? (
        <a
          href={onboardingUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            padding: "1rem 2rem",
            backgroundColor: "#0f172a",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold",
          }}
        >
          Complete Stripe Onboarding
        </a>
      ) : (
        <p>Failed to get onboarding link.</p>
      )}
    </div>
  );
}

export default MerchantSettings;
