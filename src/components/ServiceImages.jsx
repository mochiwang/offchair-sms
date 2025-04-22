// src/components/ServiceImages.jsx
import { useState } from "react";

function ServiceImages({ images = [] }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!images.length) return null;

  return (
    <>
      {/* 主图 + 小图展示区域 */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "2rem",
          height: "501px",
        }}
      >
        <img
          src={images[0]}
          alt="main"
          onClick={() => setPreviewUrl(images[0])}
          style={{
            width: "65%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "35%",
          }}
        >
          {images.slice(1, 5).map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`sub-${index}`}
              onClick={() => setPreviewUrl(url)}
              style={{
                width: "100%",
                height: "calc(25% - 6px)",
                objectFit: "cover",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* 图片放大预览弹窗 */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            cursor: "pointer",
          }}
        >
          <img
            src={previewUrl}
            alt="preview"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: "12px",
              boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      )}
    </>
  );
}

export default ServiceImages;
