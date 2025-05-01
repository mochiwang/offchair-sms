import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../firebase";

const db = getFirestore(app);
const auth = getAuth(app);

export async function cancelExpiredUnpaidAppointments() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return { success: false, message: "Not logged in" };

    const guestQ = query(
      collection(db, "appointments"),
      where("userId", "==", currentUser.uid)
    );

    const merchantQ = query(
      collection(db, "appointments"),
      where("serviceOwnerId", "==", currentUser.uid)
    );

    const [guestSnap, merchantSnap] = await Promise.all([
      getDocs(guestQ),
      getDocs(merchantQ),
    ]);

    const snapDocs = [...guestSnap.docs, ...merchantSnap.docs];
    const seen = new Set();
    const deduped = snapDocs.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    const now = Date.now();
    const expired = [];

    for (const d of deduped) {
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
