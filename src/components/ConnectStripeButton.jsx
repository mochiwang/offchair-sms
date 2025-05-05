import { getAuth } from "firebase/auth";

function ConnectStripeButton() {
  const handleConnect = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      alert("Please log in first.");
      return;
    }

    const res = await fetch("/api/create-stripe-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Failed to create Stripe onboarding link.");
    }
  };

  return (
    <button
      onClick={handleConnect}
      style={{
        padding: "10px 16px",
        backgroundColor: "#635bff",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        fontWeight: "bold",
        cursor: "pointer",
        marginTop: "1rem",
      }}
    >
      Connect Stripe 收款账户
    </button>
  );
}

export default ConnectStripeButton;
