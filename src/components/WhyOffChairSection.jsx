// src/components/WhyOffChairSection.jsx

function WhyOffChairSection() {
    const reasons = [
      {
        title: "Discover",
        description: "Find unique services, workshops, and activities tailored to your interests.",
      },
      {
        title: "Connect",
        description: "Meet passionate creators, learners, and communities who share your enthusiasm.",
      },
      {
        title: "Grow",
        description: "Turn hobbies into opportunities — whether you're offering services or seeking new experiences.",
      },
    ];
  
    return (
      <section
        style={{
          width: "100%",
          backgroundColor: "black",
          color: "white",
          padding: "4rem 1rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem" }}>
            Why OffChair
          </h2>
  
          <p style={{ fontSize: "1rem", color: "#ccc", marginBottom: "3rem", lineHeight: 1.6 }}>
            OffChair is a platform designed to bring passions to life.<br />
            We believe every passion deserves to be seen, shared, and transformed into real-life experiences.
          </p>
  
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", textAlign: "left" }}>
            {reasons.map((item, index) => (
              <div key={index}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                  {String(index + 1).padStart(2, "0")} {item.title}
                </h3>
                <p style={{ fontSize: "1rem", color: "#ccc" }}>{item.description}</p>
              </div>
            ))}
          </div>
  
          <p style={{ fontSize: "1rem", color: "#ccc", marginTop: "3rem", lineHeight: 1.6 }}>
            At OffChair, we make it easy for individuals to showcase their talents and for others to find meaningful, inspiring activities.<br />
            Because every passion deserves a stage.
          </p>
  
          <p style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "2rem", color: "#fff" }}>
            ✨ Let every passion be visible. Let every connection spark new possibilities.
          </p>
        </div>
      </section>
    );
  }
  
  export default WhyOffChairSection;
  