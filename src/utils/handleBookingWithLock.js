import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import app from "../firebase";
  
  const db = getFirestore(app);
  
  export async function handleBookingWithLock({ slotId, serviceId, userId }) {
    try {
      const slotRef = doc(db, "slots", slotId);
      const slotSnap = await getDoc(slotRef);
  
      if (!slotSnap.exists()) {
        return { success: false, message: "该时间段不存在" };
      }
  
      const slotData = slotSnap.data();
  
      if (!slotData.available) {
        return { success: false, message: "该时间段已被预约" };
      }
  
      if (slotData.locked) {
        const lockedAt = slotData.lockedAt?.toDate();
        const expired = lockedAt && (Date.now() - lockedAt.getTime()) > 60 * 60 * 1000;
  
        if (!expired) {
          return { success: false, message: "该时间段正在被他人预约，请稍后再试" };
        }
      }
  
      // ✅ 锁定 slot
      await setDoc(slotRef, {
        locked: true,
        lockedAt: serverTimestamp(),
      }, { merge: true });
  
      // ✅ 获取服务信息
      const serviceSnap = await getDoc(doc(db, "services", serviceId));
      const serviceOwnerId = serviceSnap.exists() ? serviceSnap.data().userId : null;
  
      // ✅ 写入预约草稿（包含时间信息）
      await setDoc(doc(db, "appointments", `${userId}_${slotId}`), {
        userId,
        serviceId,
        slotId,
        createdAt: serverTimestamp(),
        startTime: slotData.startTime, // ✅ 新增
        endTime: slotData.endTime,     // ✅ 新增
        status: "booked",
        paid: false,
        serviceOwnerId,
      });
  
      return { success: true };
    } catch (err) {
      console.error("❌ 预约锁定失败", err);
      return { success: false, message: "预约失败，请稍后重试" };
    }
  }
  