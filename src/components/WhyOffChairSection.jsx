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
          padding: "5rem 1rem 6rem", // ✅ 保证外部有左右边距
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {/* 内部包一层，限制宽度 */}
        <div style={{
          maxWidth: "800px",
          width: "100%",
          margin: "0 auto",
        }}>
          {/* 主标题 */}
          <h2 style={{
            fontSize: "2.2rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            color: "#ffffff",
          }}>
            Why OffChair
          </h2>
  
          {/* 主文案 */}
          <p style={{
            fontSize: "1.1rem",
            color: "#cccccc",
            marginBottom: "4rem",
            lineHeight: "1.8",
            wordBreak: "break-word", // ✅ 单词太长也不会超出
          }}>
            OffChair is a platform designed to bring passions to life.<br />
            We believe every passion deserves to be seen, shared, and transformed into real-life experiences.
          </p>
  
          {/* 三个亮点区 */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem",
            textAlign: "left",
          }}>
            {reasons.map((item, index) => (
              <div key={index}>
                <h3 style={{
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  color: "#ffffff",
                  marginBottom: "0.6rem",
                }}>
                  {String(index + 1).padStart(2, "0")} {item.title}
                </h3>
                <p style={{
                  fontSize: "1rem",
                  color: "#cccccc",
                  lineHeight: "1.7",
                  wordBreak: "break-word",
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
  
          {/* 收尾文案 */}
          <p style={{
            fontSize: "1.05rem",
            color: "#cccccc",
            marginTop: "4rem",
            lineHeight: "1.8",
            wordBreak: "break-word",
          }}>
            At OffChair, we make it easy for individuals to showcase their talents and for others to find meaningful, inspiring activities.<br />
            Because every passion deserves a stage.
          </p>
  
          {/* 最后一句总结 */}
          <p style={{
            fontSize: "1.4rem",
            fontWeight: "bold",
            marginTop: "2.5rem",
            color: "#ffffff",
          }}>
            ✨ Let every passion be visible. Let every connection spark new possibilities.
          </p>
        </div>
      </section>
    );
  }
  
  export default WhyOffChairSection;
  