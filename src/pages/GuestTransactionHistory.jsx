import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import app from "../firebase";

const auth = getAuth(app);
const db = getFirestore(app);

function GuestTransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchTransactions(currentUser.uid);
      } else {
        setUser(null);
        setTransactions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchTransactions = async (uid) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", uid),
        where("paid", "==", true),
        orderBy("startTime", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    } catch (err) {
      console.error("❌ Failed to fetch transactions:", err);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
        Transaction History
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: "center", color: "#666", padding: "2rem 0" }}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/6134/6134065.png"
            alt="No transactions"
            style={{ width: "80px", marginBottom: "1rem", opacity: 0.6 }}
          />
          <p style={{ fontSize: "1.1rem" }}>
            You have no transaction history yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {transactions.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
                background: "#fff",
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                {item.serviceTitle || "Untitled Service"}
              </div>
              <div style={{ marginTop: "0.3rem", color: "#555" }}>
                Amount: ${item.amount?.toFixed(2) || "N/A"}
              </div>
              <div style={{ marginTop: "0.3rem", color: "#777" }}>
                Date:{" "}
                {item.startTime?.seconds
                  ? new Date(item.startTime.seconds * 1000).toLocaleString()
                  : "N/A"}
              </div>
              <div style={{ marginTop: "0.3rem", color: "#777" }}>
                Status: Paid
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GuestTransactionHistory;
