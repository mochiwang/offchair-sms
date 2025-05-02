import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../firebase";

const db = getFirestore(app);
const auth = getAuth(app);

function RateService() {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get("slotId");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!currentUser) {
      alert("Please log in first.");
      return;
    }

    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    try {
      // 检查是否已经评价过这个 slotId
      const q = query(
        collection(db, "ratings"),
        where("userId", "==", currentUser.uid),
        where("slotId", "==", slotId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert("You have already rated this service.");
        return;
      }

      await addDoc(collection(db, "ratings"), {
        userId: currentUser.uid,
        serviceId,
        slotId,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      // 🔍 查询商家的 UID 和服务信息（你也可以把这些信息提前传进页面）
const serviceRef = doc(db, "services", serviceId);
const serviceSnap = await getDoc(serviceRef);
const serviceData = serviceSnap.exists() ? serviceSnap.data() : null;

if (serviceData) {
  const merchantId = serviceData.userId;
  const appointmentId = `${currentUser.uid}_${slotId}`;

  await setDoc(doc(db, "users", merchantId, "hostReviews", appointmentId), {
    guestName: currentUser.displayName || "Anonymous",
    rating,
    text: comment,
    serviceTitle: serviceData.title || "Untitled Service",
    createdAt: serverTimestamp(),
  });
}


      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting rating:", err);
      alert("Failed to submit rating.");
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Thank you for your feedback!</h2>
        <button onClick={() => navigate("/my-bookings")}>Back to My Bookings</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Rate This Service</h2>

      <label style={{ display: "block", marginBottom: "0.5rem" }}>Your Rating:</label>
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        style={{ padding: "0.5rem", marginBottom: "1rem" }}
      >
        <option value={0}>Select</option>
        {[1, 2, 3, 4, 5].map((r) => (
          <option key={r} value={r}>
            {r} Star{r > 1 ? "s" : ""}
          </option>
        ))}
      </select>

      <label style={{ display: "block", marginBottom: "0.5rem" }}>Leave a comment:</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={5}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1.5rem" }}
      />

      <button
        onClick={handleSubmit}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Submit Rating
      </button>
    </div>
  );
}

export default RateService;
