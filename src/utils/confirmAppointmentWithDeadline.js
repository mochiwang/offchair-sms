// src/utils/confirmAppointmentWithDeadline.js
import {
    getFirestore,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp,
  } from "firebase/firestore";
  import app from "../firebase";
  
  const db = getFirestore(app);
  
  export async function confirmAppointmentWithDeadline(appointmentId) {
    try {
      const deadline = Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)); // 一小时后
  
      await updateDoc(doc(db, "appointments", appointmentId), {
        status: "confirmed",
        paymentDeadline: deadline,
        confirmedAt: serverTimestamp(),
      });
  
      return { success: true };
    } catch (err) {
      console.error("❌ 确认预约失败", err);
      return { success: false, message: "确认失败，请稍后再试" };
    }
  }
  