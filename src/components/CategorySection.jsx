// src/components/CategorySection.jsx
import { useNavigate } from "react-router-dom";

function CategorySection() {
  const navigate = useNavigate();

  const categories = [
    "Nail Art",
    "Fitness",
    "Photography",
    "Handcraft",
    "Music",
    "Baking",
    "Pet Care",
    "Travel Guide",
  ];

  const handleCategoryClick = (keyword) => {
    navigate(`/search?keyword=${encodeURIComponent(keyword)}`);
  };

  return (
    <section style={{ backgroundColor: "white", padding: "4rem 1rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", textAlign: "center", marginBottom: "2rem" }}>
          Explore by Category
        </h2>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        }}>
          {categories.map((cat, index) => (
            <div
              key={index}
              onClick={() => handleCategoryClick(cat)}
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "1rem 1.5rem",
                borderRadius: "10px",
                backgroundColor: "#f9f9f9",
                fontSize: "1rem",
                fontWeight: "500",
                color: "#333",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
