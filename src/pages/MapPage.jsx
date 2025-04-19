import { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import app from "../firebase";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

const db = getFirestore(app);

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 37.8715,
  lng: -122.273,
};

function MapPage() {
  const [services, setServices] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDcIEOYVRuvJicRMu6uPloOAk9QrbEk7ww",
    libraries: ["places"],
  });

  useEffect(() => {
    const fetchServices = async () => {
      const snapshot = await getDocs(collection(db, "services"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setServices(list);
    };
    fetchServices();
  }, []);

  const filteredServices = services.filter((s) =>
    (s.title + s.description)
      .toLowerCase()
      .includes(searchText.trim().toLowerCase())
  );

  if (!isLoaded) return <div>地图加载中...</div>;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* 左侧服务卡片区域 */}
      <div
        style={{
          width: "460px",
          overflowY: "auto",
          padding: "1rem",
          background: "#fff",
          borderRight: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: "1rem" }}>附近的兴趣服务</h2>
        <input
          type="text"
          placeholder="搜索关键词..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        {filteredServices.map((service, index) => (
          <div
            key={service.id}
            onMouseEnter={() => setHoveredId(service.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              if (mapRef.current && service.latitude && service.longitude) {
                mapRef.current.panTo({
                  lat: service.latitude,
                  lng: service.longitude,
                });
              }
              setSelectedMarkerId(service.id);
            }}
            style={{
              display: "flex",
              gap: "12px",
              border:
                hoveredId === service.id
                  ? "2px solid #0073bb"
                  : "1px solid #e0e0e0",
              borderRadius: "10px",
              padding: "10px",
              marginBottom: "14px",
              backgroundColor: "#fff",
              transition: "border 0.3s ease",
              cursor: "pointer",
            }}
          >
            <img
              src={service.image || "/default-image.jpg"}
              alt={service.title}
              style={{
                width: "100px",
                height: "100px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "1rem" }}>
                {index + 1}. {service.title}
              </div>
              <div style={{ margin: "4px 0" }}>
                <span style={{ color: "#f15c00", fontWeight: "bold" }}>★★★★☆</span>{" "}
                <span style={{ fontSize: "0.85rem", color: "#555" }}>
                  ({service.reviews || 100} reviews)
                </span>
              </div>
              <div style={{ fontSize: "0.9rem", color: "#777", marginBottom: "4px" }}>
                ¥{service.price} · Closed until Tomorrow
              </div>
              <div style={{ fontSize: "0.85rem", color: "#555" }}>
                {service.description?.slice(0, 50)}...
              </div>
              <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {service.tags?.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "3px 8px",
                      background: "#f1f1f1",
                      borderRadius: "14px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 右侧地图区域 */}
      <div style={{ flex: 1, height: "100%" }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={13}
          onLoad={(map) => (mapRef.current = map)}
        >
          {filteredServices.map((service, index) =>
            service.latitude && service.longitude ? (
              <Marker
                key={service.id}
                position={{ lat: service.latitude, lng: service.longitude }}
                onMouseOver={() => setHoveredId(service.id)}
                onMouseOut={() => setHoveredId(null)}
                onClick={() => setSelectedMarkerId(service.id)}
                icon={{
                  url: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=${
                    index + 1
                  }|${hoveredId === service.id ? "FF0000" : "F57C00"}|FFFFFF`,
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
              />
            ) : null
          )}

          {filteredServices.map(
            (service) =>
              selectedMarkerId === service.id &&
              service.latitude &&
              service.longitude && (
                <InfoWindow
                  key={service.id}
                  position={{ lat: service.latitude, lng: service.longitude }}
                  onCloseClick={() => setSelectedMarkerId(null)}
                >
                  <div style={{ maxWidth: "200px" }}>
                    <h3 style={{ margin: 0 }}>{service.title}</h3>
                    <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                      {service.description}
                    </p>
                    <p style={{ margin: 0, fontWeight: "bold" }}>
                      ¥{service.price}
                    </p>
                  </div>
                </InfoWindow>
              )
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

export default MapPage;
