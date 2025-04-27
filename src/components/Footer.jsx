// src/components/Footer.jsx

function Footer() {
    return (
      <footer style={{ backgroundColor: "black", color: "white", padding: "3rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* 主内容区域 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            {/* 平台名字或Logo占位 */}
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>OffChair</div>
  
            {/* 链接区域 */}
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center", fontSize: "0.95rem" }}>
              <a href="/about" style={{ color: "#ccc", textDecoration: "none" }}>About Us</a>
              <a href="/contact" style={{ color: "#ccc", textDecoration: "none" }}>Contact</a>
              <a href="/faq" style={{ color: "#ccc", textDecoration: "none" }}>FAQ</a>
              <a href="/privacy" style={{ color: "#ccc", textDecoration: "none" }}>Privacy Policy</a>
            </div>
          </div>
  
          {/* 分割线 */}
          <div style={{ width: "100%", height: "1px", backgroundColor: "#333" }} />
  
          {/* 版权信息 */}
          <div style={{ fontSize: "0.8rem", color: "#777", textAlign: "center" }}>
            © {new Date().getFullYear()} OffChair. All rights reserved.
          </div>
        </div>
      </footer>
    );
  }
  
  export default Footer;
  