import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import app from "../firebase";

const db = getFirestore(app);

// ✅ 中文同义词归一映射
const synonymMap = {
  "美甲": "Nail Art",
  "美容": "Nail Art",
  "私教": "Fitness",
  "健身": "Fitness",
  "写真": "Photography",
  "旅拍": "Photography",
  "手工": "Handcraft",
  "烘焙": "Baking",
  "宠物": "Pet Care",
  "导游": "Travel Guide",
  "乐器": "Music"
};

function normalizeTag(tag) {
  return synonymMap[tag] || tag;
}

function CategorySection() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const allTags = [];
        querySnapshot.forEach(doc => {
          const tags = doc.data().tags || [];
          tags.forEach(tag => {
            if (tag.trim()) {
              allTags.push(normalizeTag(tag.trim()));
            }
          });
        });

        const uniqueSorted = [...new Set(allTags)].sort();
        setCategories(uniqueSorted);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleCategoryClick = (keyword) => {
    navigate(`/search?keyword=${encodeURIComponent(keyword)}`);
  };

  return (
    <section style={{ backgroundColor: "white", padding: "4rem 1rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{
          fontSize: "1.8rem",
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: "2rem"
        }}>
          Explore by Category
        </h2>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading categories...</p>
        ) : (
          <>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center"
            }}>
              {categories.map((cat, index) => (
                <div
                  key={index}
                  onClick={() => handleCategoryClick(cat)}
                  style={{
                    padding: "0.8rem 1.2rem",
                    borderRadius: "999px",
                    backgroundColor: "#f9f9f9",
                    fontSize: "1rem",
                    fontWeight: "500",
                    color: "#333",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    userSelect: "none"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                >
                  {cat}
                </div>
              ))}
            </div>

            <p style={{
              textAlign: "center",
              color: "#888",
              marginTop: "2.5rem",
              fontSize: "1rem",
              lineHeight: "1.6"
            }}>
              Can't find what you're looking for? <br />
              <strong>You just discovered a new opportunity!</strong> 🚀<br />
              Be the first to offer it on OffChair.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default CategorySection;
