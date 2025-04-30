import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import app from "../firebase";
import ServiceCard from "../components/ServiceCard"; // 你已有的卡片组件
import LoadingSpinner from "../components/LoadingSpinner"; // 可选

const db = getFirestore(app);

function SearchResults() {
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(location.search);
  const activity = params.get("activity") || "";
  const searchLocation = params.get("location") || "";
  const time = params.get("time") || "";

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        let q = collection(db, "services");

        // 构造条件数组
        const conditions = [];
        if (activity) {
          conditions.push(where("keywords", "array-contains", activity));
        }
        if (searchLocation) {
          conditions.push(where("zipCode", "==", searchLocation));
        }
        if (time && time !== "Anytime") {
          conditions.push(where("availableTimes", "array-contains", time)); // 假设你的服务中有这个字段
        }

        const finalQuery = conditions.length
          ? query(q, ...conditions)
          : q;

        const snapshot = await getDocs(finalQuery);
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServices(results);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
      setLoading(false);
    };

    fetchServices();
  }, [activity, searchLocation, time]);

  return (
    <div style={{ padding: "2rem" }}>
<h2 style={{ marginBottom: "1rem" }}>
  Search Results for <span style={{ color: "#ff5858" }}>"{activity}"</span>
</h2>

      {loading ? (
        <LoadingSpinner />
      ) : services.length === 0 ? (
        <p>No matching services found.</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.5rem"
        }}>
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResults;
