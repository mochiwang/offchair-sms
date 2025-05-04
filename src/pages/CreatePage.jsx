// ✅ Updated CreatePage.jsx with realAddress field
import { useState, useEffect } from 'react';
import app from '../firebase';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

const db = getFirestore(app);
const auth = getAuth(app);

function CreatePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    zipCode: '',
    realAddress: '', // ✅ new field
    images: [],
    tagInput: '',
    tags: [],
    slotDate: '',
    slotStartTime: '',
    slotEndTime: '',
    slotDuration: 60,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setTimeout(() => {
          alert('Please login first!');
          navigate('/login');
        }, 800);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const storage = getStorage(app);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > 5) {
      alert('Max 5 images allowed');
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
      console.error('Upload failed:', err);
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addTag = () => {
    const tag = form.tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag], tagInput: '' });
    }
  };

  const removeTag = (tagToRemove) => {
    setForm({ ...form, tags: form.tags.filter((tag) => tag !== tagToRemove) });
  };

  const fetchCoordinates = async (zip) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${zip}&country=us`);
      const data = await response.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.error('Fetch coordinates error:', error);
    }
    return { lat: null, lon: null };
  };

  const generateKeywords = (title, description, tags, zipCode) => {
    const allText = `${title} ${description} ${tags.join(' ')} ${zipCode}`.toLowerCase();
    const words = allText.match(/\b\w{2,}\b/g);
    return Array.from(new Set(words));
  };

  const generateTimeSlots = (date, startTime, endTime, duration, serviceId) => {
    const slots = [];
    let start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    while (start < end) {
      const slotEnd = new Date(start.getTime() + duration * 60000);
      slots.push({ serviceId, startTime: start, endTime: slotEnd, available: true, userId: null });
      start = slotEnd;
    }
    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login first!');
      return;
    }
    const geo = await fetchCoordinates(form.zipCode);
    const keywords = generateKeywords(form.title, form.description, form.tags, form.zipCode);
    const newService = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      zipCode: form.zipCode,
      realAddress: form.realAddress.trim(), // ✅ added
      latitude: geo.lat,
      longitude: geo.lon,
      images: form.images,
      tags: form.tags,
      keywords: keywords,
      createdAt: serverTimestamp(),
      userId: user.uid,
    };

    try {
      const docRef = await addDoc(collection(db, 'services'), newService);
      const slots = generateTimeSlots(form.slotDate, form.slotStartTime, form.slotEndTime, Number(form.slotDuration), docRef.id);
      for (const slot of slots) {
        await addDoc(collection(db, 'slots'), slot);
      }
      alert('Service published successfully!');
      navigate('/');
    } catch (error) {
      console.error('Publish failed:', error);
      alert('Failed to publish');
    }
  };

  if (isLoading) return <div style={{ padding: '6rem', textAlign: 'center' }}>Verifying login...</div>;

  return (
    <div style={{ padding: '7rem 1rem 3rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>Create a Service</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="input-box" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={4} className="input-box" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price" className="input-box" required />
        <input name="zipCode" value={form.zipCode} onChange={handleChange} placeholder="Zip Code" className="input-box" required />

        {/* ✅ New field */}
        <input
          name="realAddress"
          value={form.realAddress}
          onChange={handleChange}
          placeholder="Full address (shown after payment)"
          className="input-box"
          required
        />
        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '-1rem' }}>
          Your address is only shown after payment, and only to the guest who booked this service.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {form.images.map((url, idx) => (
            <img key={idx} src={url} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
          ))}
          <label className="image-upload-box">
            + Add Image
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
          {uploading && <p style={{ fontSize: '0.9rem', color: '#999' }}>Uploading...</p>}
        </div>

        <input name="slotDate" type="date" value={form.slotDate} onChange={handleChange} className="input-box" required />
        <input name="slotStartTime" type="time" value={form.slotStartTime} onChange={handleChange} className="input-box" required />
        <input name="slotEndTime" type="time" value={form.slotEndTime} onChange={handleChange} className="input-box" required />
        <input name="slotDuration" type="number" value={form.slotDuration} onChange={handleChange} placeholder="Slot Duration (minutes)" className="input-box" required />

        <input name="tagInput" value={form.tagInput} onChange={handleChange} placeholder="Add tags" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="input-box" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {form.tags.map((tag, idx) => (
            <span key={idx} className="tag-chip">#{tag} <span onClick={() => removeTag(tag)} style={{ cursor: 'pointer', marginLeft: '4px' }}>×</span></span>
          ))}
        </div>

        <button type="submit" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#ff5858', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
          Publish
        </button>
      </form>
    </div>
  );
}

export default CreatePage;