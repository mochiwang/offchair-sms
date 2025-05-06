// src/pages/MerchantFinancePage.jsx
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { startOfMonth } from "date-fns";
import Layout from "../components/Layout";

const db = getFirestore();
const auth = getAuth();

function MerchantFinancePage() {
  const [records, setRecords] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFinanceRecords = async () => {
      if (!user) return;
      const beginningOfMonth = Timestamp.fromDate(startOfMonth(new Date()));

      const q = query(
        collection(db, "appointments"),
        where("serviceOwnerId", "==", user.uid),
        where("paid", "==", true),
        where("startTime", ">=", beginningOfMonth)
      );

      const snapshot = await getDocs(q);
      const list = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const guestSnap = await getDoc(doc(db, "users", data.userId));
          const guest = guestSnap.exists() ? guestSnap.data() : {};
          return {
            id: docSnap.id,
            guestName: guest.displayName || "Anonymous",
            serviceTitle: data.title || "Untitled Service",
            startTime: data.startTime,
            amount: data.amount || 0,
            transferred: data.transferred || false,
          };
        })
      );
      setRecords(list);
      setTotalEarnings(list.reduce((sum, r) => sum + r.amount, 0) / 100);
      setLoading(false);
    };
    fetchFinanceRecords();
  }, [user]);

  if (loading) return <Layout><div style={{ padding: "2rem" }}>Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Monthly Earnings Summary
        </h2>
        <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
          💰 Total: <strong>${totalEarnings.toFixed(2)}</strong> across {records.length} bookings
        </p>

        {records.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "1rem",
              marginBottom: "1rem",
              backgroundColor: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0" }}>{r.serviceTitle}</h3>
            <p style={{ margin: 0 }}>👤 Guest: {r.guestName}</p>
            <p style={{ margin: 0 }}>📅 {new Date(r.startTime.seconds * 1000).toLocaleString()}</p>
            <p style={{ margin: 0 }}>💵 ${r.amount / 100}</p>
            <p style={{ margin: 0, color: r.transferred ? "green" : "orange" }}>
              🔁 {r.transferred ? "Transferred" : "Pending Transfer"}
            </p>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export default MerchantFinancePage;
