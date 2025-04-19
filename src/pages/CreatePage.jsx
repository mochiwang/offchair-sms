// src/pages/CreatePage.jsx
import { useState, useEffect } from 'react';
import app from '../firebase';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { onAuthStateChanged } from "firebase/auth";


const db = getFirestore(app);
const auth = getAuth(app);


function CreatePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);


  const storage = getStorage(app);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    zipCode: "",
    images: [],
    tagInput: "",
    tags: [],
    slotDate: "",
    slotStartTime: "",
    slotEndTime: "",
    slotDuration: 60,
  });
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("🔥 onAuthStateChanged 被触发了", firebaseUser);
  
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setTimeout(() => {
          alert("请先登录！");
          navigate("/login");
        }, 800);
      }
    });
  
    return () => unsubscribe();
  }, [navigate]);
  
  
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > 5) {
      alert("最多上传 5 张图片");
      return;
    }

    setUploading(true);
    const newImageUrls = [];

    try {
      for (const file of files) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });

        const storageRef = ref(storage, `images/${Date.now()}_${compressed.name}`);
        const snapshot = await uploadBytes(storageRef, compressed);
        const downloadURL = await getDownloadURL(snapshot.ref);
        newImageUrls.push(downloadURL);
      }

      setForm((prevForm) => ({
        ...prevForm,
        images: [...prevForm.images, ...newImageUrls],
      }));
    } catch (err) {
      alert("上传失败！");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };


  

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    body.style.display = "block";
    html.style.display = "block";
    body.style.removeProperty("place-items");
    html.style.removeProperty("place-items");
    body.style.margin = "0";
    html.style.margin = "0";
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addTag = () => {
    const tag = form.tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag], tagInput: "" });
    }
  };

  const removeTag = (tagToRemove) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
  };

  const fetchCoordinates = async (zip) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${zip}&country=us`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error("获取地理坐标失败:", error);
    }
    return { lat: null, lon: null };
  };

  const generateTimeSlots = (date, startTime, endTime, durationInMinutes, serviceId) => {
    const slots = [];
    let start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    while (start < end) {
      const slotEnd = new Date(start.getTime() + durationInMinutes * 60000);
      slots.push({
        serviceId,
        startTime: new Date(start),
        endTime: slotEnd,
        available: true,
        userId: null,
      });
      start = slotEnd;
    }
    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentUser = user;
    if (!currentUser) {
      alert("请先登录再发布服务！");
      return;
    }

    const geo = await fetchCoordinates(form.zipCode);

    const newService = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      zipCode: form.zipCode,
      latitude: geo.lat,
      longitude: geo.lon,
      images: form.images,
      tags: form.tags,
      createdAt: serverTimestamp(),
      userId: currentUser.uid,
    };

    try {
      const docRef = await addDoc(collection(db, "services"), newService);
      const slots = generateTimeSlots(form.slotDate, form.slotStartTime, form.slotEndTime, Number(form.slotDuration), docRef.id);
      for (const slot of slots) {
        await addDoc(collection(db, "slots"), slot);
      }
      alert("发布成功 ✅");
      navigate("/");
    } catch (error) {
      console.error("写入失败:", error);
      alert("发布失败 ❌");
    }
  };
  if (isLoading) {
    return <div style={{ padding: "6rem", textAlign: "center" }}>正在验证身份，请稍候...</div>;
  }
  
  if (!user) {
    // 理论上不需要 return null，React 会因为 navigate 跳转而 unmount
    // 但如果 navigate 跳转失败，至少这里能显示提示
    return <div style={{ padding: "6rem", textAlign: "center" }}>未登录，跳转中...</div>;
  }
  
  
  return (
    <div style={{ width: "40vw", padding: "6rem 2rem 2rem", background: "#fff", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "960px" }}>
        <form onSubmit={handleSubmit} className="create-form" style={{ width: "100%" }}>
          <h2 className="form-title" style={{ textAlign: "center", marginBottom: "1.5rem" }}>Create a Service</h2>

          <div className="form-section">
            <h4 className="form-label">Basic Information</h4>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="input-box" required />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={3} className="input-box" required />
          </div>

          <div className="form-section">
            <h4 className="form-label">Price</h4>
            <input name="price" value={form.price} onChange={handleChange} placeholder="Price" className="input-box" required />
            <div style={{ display: "flex", gap: "12px", marginTop: "0.5rem" }}>
              <label className="image-upload-box" style={{ width: "100px", height: "100px", border: "1px dashed #ccc", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#888", cursor: "pointer" }}>
                + Add image
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
              {uploading && <p style={{ fontSize: "0.9rem", color: "#999" }}>Uploading...</p>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
              {form.images.map((url, idx) => (
                <img key={idx} src={url} alt={`preview-${idx}`} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
              ))}
            </div>
          </div>

          <div className="form-section">
            <h4 className="form-label">Location</h4>
            <input name="zipCode" value={form.zipCode} onChange={handleChange} placeholder="Enter address or ZIP code" className="input-box" required />
          </div>

          <div className="form-section">
            <h4 className="form-label">Reservation Time</h4>
            <label>Date:</label>
            <input type="date" name="slotDate" value={form.slotDate} onChange={handleChange} className="input-box" required />
            <label>Start Time:</label>
            <input type="time" name="slotStartTime" value={form.slotStartTime} onChange={handleChange} className="input-box" required />
            <label>End Time:</label>
            <input type="time" name="slotEndTime" value={form.slotEndTime} onChange={handleChange} className="input-box" required />
            <label>Duration (minutes):</label>
            <input type="number" name="slotDuration" value={form.slotDuration} onChange={handleChange} className="input-box" required />
          </div>

          <div className="form-section">
            <h4 className="form-label">Tags</h4>
            <input name="tagInput" value={form.tagInput} onChange={handleChange} placeholder="Enter tags" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} className="input-box" />
            <div className="tag-container">
              {form.tags.map((tag, index) => (
                <span key={index} className="tag-chip">#{tag} <span onClick={() => removeTag(tag)} className="tag-remove">×</span></span>
              ))}
            </div>
          </div>

          <button type="submit" className="publish-btn" style={{ marginTop: "2rem", width: "100%", padding: "12px", backgroundColor: "#f66", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Publish</button>
        </form>
      </div>
    </div>
  );
}

export default CreatePage;
