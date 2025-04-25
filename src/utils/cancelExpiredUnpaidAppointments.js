// src/utils/cancelExpiredUnpaidAppointments.js
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    deleteDoc,
    setDoc,
    Timestamp,
  } from "firebase/firestore";
  import app from "../firebase";
  
  const db = getFirestore(app);
  
  export async function cancelExpiredUnpaidAppointments() {
    try {
      const snap = await getDocs(collection(db, "appointments"));
      const now = Date.now();
      const expired = [];
  
      for (const d of snap.docs) {
        const data = d.data();
  
        if (
          data.status === "confirmed" &&
          data.paid === false &&
          data.paymentDeadline &&
          data.paymentDeadline.toMillis() < now
        ) {
          console.log("🕐 超时未付款，取消预约：", d.id);
          expired.push({ id: d.id, slotId: data.slotId });
        }
      }
  
      for (const item of expired) {
        await deleteDoc(doc(db, "appointments", item.id));
        await setDoc(
          doc(db, "slots", item.slotId),
          { available: true, userId: null, locked: false },
          { merge: true }
        );
      }
  
      return { success: true, cancelled: expired.length };
    } catch (err) {
      console.error("❌ 自动取消失败：", err);
      return { success: false, message: err.message };
    }
  }
  