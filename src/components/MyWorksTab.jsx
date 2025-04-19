// src/components/MyWorksTab.jsx
import { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getAuth } from "firebase/auth";
import app from "../firebase";
import imageCompression from "browser-image-compression";
import WorkDetailModal from "./WorkDetailModal";

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

function MyWorksTab() {
  const [mediaList, setMediaList] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const menuRef = useRef(null);
  const currentUser = auth.currentUser;
  const MAX_IMAGES = 30;
  const MAX_VIDEOS = 1;

  const fetchMedia = async () => {
    if (!currentUser) return;
    const q = query(collection(db, "users", currentUser.uid, "gallery"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    setMediaList(items);
  };

  useEffect(() => {
    fetchMedia();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpload = async () => {
    if (!file || !currentUser) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const imageCount = mediaList.filter((m) => m.type === "image").length;
    const videoCount = mediaList.filter((m) => m.type === "video").length;

    if (isImage && imageCount >= MAX_IMAGES) {
      alert("最多上传 30 张图片");
      return;
    }
    if (isVideo && videoCount >= MAX_VIDEOS) {
      alert("最多只能上传 1 个视频");
      return;
    }
    if (!isImage && !isVideo) {
      alert("只支持上传图片（jpg/png）或视频（mp4）");
      return;
    }

    if (isVideo && file.type !== "video/mp4") {
      alert(
        "❗ 当前仅支持上传 .mp4 格式的视频。\n\n📱 iPhone 用户请尝试：\n- 在相册中导出为“文件”后上传\n- 或使用 InShot / 视频转换器 App\n- 或使用 CloudConvert：https://cloudconvert.com\n\n谢谢理解！"
      );
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert("文件大小不能超过 20MB");
      return;
    }

    try {
      setUploading(true);
      const timeout = setTimeout(() => {
        setUploading(false);
        alert("上传超时，请检查网络后重试");
      }, 20000);

      const ext = file.name.split(".").pop();
      const fileRef = ref(storage, `gallery/${currentUser.uid}/${Date.now()}.${ext}`);

      let fileToUpload = file;
      if (isImage) {
        try {
          fileToUpload = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
        } catch (err) {
          console.warn("图片压缩失败，使用原图上传", err);
        }
      }

      await uploadBytes(fileRef, fileToUpload);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "users", currentUser.uid, "gallery"), {
        url,
        caption: caption.trim(),
        tags: tags.trim().split(/[ ,#]+/).filter(Boolean),
        likes: 0,
        likedBy: [],
        isCover: false,
        type: isImage ? "image" : "video",
        createdAt: serverTimestamp(),
        favoritedBy: [],
      });

      clearTimeout(timeout);
      alert("✅ 上传完成！");
      setFile(null);
      setCaption("");
      setTags("");
      setUploading(false);
      fetchMedia();
    } catch (err) {
      console.error("❌ 上传失败", err);
      setUploading(false);
      alert("上传失败，请稍后再试");
    }
  };

  const handleDelete = async (id, url) => {
    if (!currentUser) return;
    if (!window.confirm("确定要删除该作品吗？")) return;
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
    await deleteDoc(doc(db, "users", currentUser.uid, "gallery", id));
    setFile(null);
    fetchMedia();
  };

  const handleSetCover = async (itemId) => {
    if (!currentUser) return;
    const collRef = collection(db, "users", currentUser.uid, "gallery");
    const allDocs = await getDocs(collRef);
    const batch = allDocs.docs.map((d) =>
      updateDoc(doc(db, "users", currentUser.uid, "gallery", d.id), { isCover: false })
    );
    await Promise.all(batch);
    await updateDoc(doc(db, "users", currentUser.uid, "gallery", itemId), {
      isCover: true,
    });
    fetchMedia();
  };

  const imageCount = mediaList.filter((m) => m.type === "image").length;
  const videoCount = mediaList.filter((m) => m.type === "video").length;

  return (
      <div>
        <h3 style={{ marginBottom: "1rem" }}>📁 我的作品集</h3>
        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "0.5rem" }}>
          免费用户最多上传 <strong>30 张图片</strong> 和 <strong>1 个视频</strong>。<br />
          当前已上传：<strong>{imageCount}</strong> 张图片，<strong>{videoCount}</strong> 个视频。<br />
          想上传更多内容？请升级为会员 🔓<br />
          会员可上传最多 100 张图片 和 10 个视频，畅享更多创作空间！
        </p>
    
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          <textarea
            placeholder="为你的作品添加说明（可选）"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{ width: "100%", maxWidth: "400px", height: "60px", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", resize: "none" }}
          />
          <input
            type="text"
            placeholder="添加标签，使用逗号、空格或 # 分隔"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{ width: "100%", maxWidth: "400px", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <label htmlFor="upload-file" style={{ padding: "10px 20px", backgroundColor: "#edeaff", color: "#5c4db1", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>📤 选择文件</label>
            <input
              id="upload-file"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: "none" }}
            />
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              style={{
                padding: "10px 20px",
                backgroundColor: uploading || !file ? "#ccc" : "#5c4db1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: uploading || !file ? "not-allowed" : "pointer"
              }}
            >
              {uploading ? "上传中..." : "上传作品"}
            </button>
          </div>
        </div>
    
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
          {mediaList.map((item) => (
            <div key={item.id} style={{ position: "relative", border: "1px solid #eee", padding: "0.5rem", borderRadius: "8px", backgroundColor: item.isCover ? "#fff6e8" : "#fafafa" }}>
              {item.type === "image" ? (
                <img src={item.url} alt="upload" style={{ width: "100%", borderRadius: "6px", cursor: "pointer" }} onClick={() => setPreviewItem(item)} />
              ) : (
                <video src={item.url} controls style={{ width: "100%", borderRadius: "6px" }} onClick={() => setPreviewItem(item)}/>
              )}
              {item.caption && <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#333" }}>{item.caption}</p>}
              {item.tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                  {item.tags.map((tag, idx) => (
                    <span key={idx} style={{ fontSize: "0.75rem", backgroundColor: "#f0f0f0", padding: "2px 6px", borderRadius: "12px" }}>#{tag}</span>
                  ))}
                </div>
              )}
              {item.isCover && (
                <span style={{ fontSize: "0.7rem", color: "#f57c00" }}>封面作品</span>
              )}
    
              {/* 右上角菜单按钮 */}
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  cursor: "pointer",
                  fontSize: "20px",
                  padding: "2px 6px",
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}
                onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}
              >
                ⋯
              </div>
    
              {menuOpenId === item.id && (
                <div
                  ref={menuRef}
                  style={{
                    position: "absolute",
                    top: "36px",
                    right: "8px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    zIndex: 10
                  }}
                >
                  <div onClick={() => { window.open(item.url, "_blank"); setMenuOpenId(null); }} style={{ padding: "8px 12px", cursor: "pointer" }}>预览（新窗口）</div>
                  <div onClick={() => { handleSetCover(item.id); setMenuOpenId(null); }} style={{ padding: "8px 12px", cursor: "pointer" }}>设为封面</div>
                  <div onClick={() => { handleDelete(item.id, item.url); setMenuOpenId(null); }} style={{ padding: "8px 12px", color: "red", cursor: "pointer" }}>删除</div>
                </div>
              )}
            </div>
          ))}
        </div>
        {previewItem && (
  <WorkDetailModal
    item={previewItem}
    onClose={() => setPreviewItem(null)}
    refresh={fetchMedia}
  />
)}
      </div>
    );
    
}

export default MyWorksTab;