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
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../firebase";

const db = getFirestore(app);
const auth = getAuth(app);

// ⚠️ 将函数改为返回一个 Promise，并在 onAuthStateChanged 中执行主逻辑
export async function cancelExpiredUnpaidAppointments() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        resolve({ success: false, message: "未登录，跳过自动取消" });
        return;
      }

      try {
        const guestQ = query(
          collection(db, "appointments"),
          where("userId", "==", user.uid)
        );
        const merchantQ = query(
          collection(db, "appointments"),
          where("serviceOwnerId", "==", user.uid)
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

        console.log(`✅ 自动取消了 ${expired.length} 条超时未付款预约`);
        resolve({ success: true, cancelled: expired.length });
      } catch (err) {
        console.error("❌ 自动取消失败：", err);
        resolve({ success: false, message: err.message });
      }
    });
  });
}
