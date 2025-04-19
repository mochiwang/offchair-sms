// src/components/EditProfileModal.jsx
import { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import app from "../firebase";

const db = getFirestore(app);
const storage = getStorage(app);

function EditProfileModal({ isOpen, onClose, currentUser, refreshProfile }) {
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 拉取现有资料
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setNickname(data.displayName || "");
        setBio(data.bio || "");
      }
    };
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen, currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let avatarUrl = null;
      if (avatarFile) {
        const fileRef = ref(storage, `avatars/${currentUser.uid}`);
        await uploadBytes(fileRef, avatarFile);
        avatarUrl = await getDownloadURL(fileRef);
      }

      const updateData = {
        displayName: nickname.trim(),
        bio: bio.trim(),
      };
      if (avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      }

      await updateDoc(doc(db, "users", currentUser.uid), updateData);
      if (refreshProfile) await refreshProfile();
      alert("✅ 资料已更新！");
      onClose();
    } catch (err) {
      console.error("❌ 更新失败", err);
      alert("❌ 更新失败，请稍后再试。");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "500px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>编辑资料</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="昵称"
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="简介"
            rows={3}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
          />
          <div>
            <label>上传新头像：</label>
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: loading ? "#ccc" : "#5c4db1",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "保存中..." : "保存修改"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
