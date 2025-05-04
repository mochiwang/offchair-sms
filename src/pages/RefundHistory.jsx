// src/pages/RefundHistory.jsx

import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore(app);
const auth = getAuth(app);

function RefundHistory() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const fetchRefunds = async () => {
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", currentUser.uid),
        where("refunded", "==", true)
      );

      const snap = await getDocs(q);
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const serviceSnap = await getDoc(doc(db, "services", data.serviceId));
          const service = serviceSnap.exists() ? serviceSnap.data() : null;
          return {
            ...data,
            id: d.id,
            serviceTitle: service?.title || "Untitled Service",
            serviceOwnerId: service?.userId || "",
          };
        })
      );

      setRefunds(list);
      setLoading(false);
    };

    fetchRefunds();
  }, [currentUser]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div style={{ padding: "6rem 1rem 2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem" }}>
        Refund History
      </h1>

      {refunds.length === 0 ? (
        <p style={{ color: "#666" }}>You have no refund records.</p>
      ) : (
        refunds.map((r) => (
          <div
            key={r.id}
            style={{
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "12px",
              marginBottom: "1rem",
              backgroundColor: "#f8fafc",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem" }}>{r.serviceTitle}</h3>
            <p style={{ margin: "4px 0", color: "#333" }}>
              Time: {new Date(r.startTime.seconds * 1000).toLocaleString()} —{" "}
              {new Date(r.endTime.seconds * 1000).toLocaleString()}
            </p>
            <p style={{ margin: "4px 0", color: "#666" }}>
              Cancelled At:{" "}
              {r.cancelledAt
                ? new Date(r.cancelledAt).toLocaleString()
                : "Unknown"}
            </p>
            <p style={{ margin: "4px 0", fontWeight: "bold", color: "#dc2626" }}>
              ✅ Refunded
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default RefundHistory;
