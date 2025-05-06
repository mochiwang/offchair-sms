// src/pages/DetailPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { arrayUnion } from "firebase/firestore";
import { deleteDoc, getDoc } from "firebase/firestore";
import ServiceHeader from "../components/ServiceHeader";
import ServiceImages from "../components/ServiceImages";
import BookingPanel from "../components/BookingPanel";
import RatingAndComment from "../components/RatingAndComment";
import ServiceInfo from "../components/ServiceInfo";
import { handleBookingWithLock } from "../utils/handleBookingWithLock";






const db = getFirestore(app);
const auth = getAuth(app);

function DetailPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [slots, setSlots] = useState([]);
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [userCompletedSlots, setUserCompletedSlots] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [commentText, setCommentText] = useState("");
const [comments, setComments] = useState([]);
const [displayName, setDisplayName] = useState("匿名");
const [visibleComments, setVisibleComments] = useState(5); // 初始显示 5 条
const [showBooking, setShowBooking] = useState(false);
const [hasPaid, setHasPaid] = useState(false);







useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);



useEffect(() => {
  const q = query(
    collection(db, "slots"),
    where("serviceId", "==", id),
    where("available", "==", true)
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    const slotList = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSlots(slotList);
  });

  return () => unsubscribe();
}, [id]);



useEffect(() => {
  if (!id) return;

  const fetchService = async () => {
    const docRef = doc(db, "services", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // 🧩 获取商家头像与昵称
      const sellerRef = doc(db, "users", data.userId);
      const sellerSnap = await getDoc(sellerRef);
      const sellerData = sellerSnap.exists() ? sellerSnap.data() : {};

      setService({
        id: docSnap.id,
        ...data,
        sellerName: sellerData.displayName || "商家",
        sellerAvatar: sellerData.avatarUrl?.trim() || "https://via.placeholder.com/48",

      });

      setLoading(false);
    }
  };

  fetchService();
}, [id]);

useEffect(() => {
  if (!currentUser || !id) return;

  const checkIfPaid = async () => {
    const appointmentRef = query(
      collection(db, "appointments"),
      where("userId", "==", currentUser.uid),
      where("serviceId", "==", id),
      where("paid", "==", true)
    );
    const snap = await getDocs(appointmentRef);
    setHasPaid(!snap.empty); // 有记录说明已付款
  };

  checkIfPaid();
}, [currentUser, id]);



  useEffect(() => {
    const fetchUserCompletedSlotsAndRatings = async () => {
      if (!currentUser) return;
  
      // 获取用户已完成的预约
      const slotQuery = query(
        collection(db, "slots"),
        where("userId", "==", currentUser.uid),
        where("serviceId", "==", id),
        where("completed", "==", true)
      );
      const slotSnap = await getDocs(slotQuery);
      setUserCompletedSlots(slotSnap.docs.map((doc) => doc.id));
  
      // 获取该用户对该服务的评分
      const ratingQuery = query(
        collection(db, "ratings"),
        where("userId", "==", currentUser.uid),
        where("serviceId", "==", id)
      );
      const ratingSnap = await getDocs(ratingQuery);
      setUserRatings(ratingSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };
  
    fetchUserCompletedSlotsAndRatings();
  }, [currentUser, id]);
  

  const handleMessage = async () => {
    if (!currentUser) {
      alert("请先登录！");
      navigate("/login");
      return;
    }
  
    const chatId = [currentUser.uid, service.userId].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
  
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: [currentUser.uid, service.userId],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTimestamp: serverTimestamp(),
        readTimestamps: {
          [currentUser.uid]: serverTimestamp(),
          [service.userId]: serverTimestamp(),
        },
      });
    }
  
    alert("✅ 预约成功！请尽快通过聊天与商家确认时间和地址。你可以在‘我的预约’中找到对应聊天入口。");

  

  };
  
  const handleBooking = async (slotId) => {
    if (!currentUser) {
      alert("请先登录后再预约！");
      navigate("/login");
      return;
    }
  
    try {
      const res = await handleBookingWithLock({
        slotId,
        serviceId: id,
        userId: currentUser.uid,
        serviceOwnerId: service.userId,
        serviceTitle: service.title,
        servicePhone: service.phoneNumber,
        isMember: service.isMember, // ⚠️ 如果服务中没有 isMember，可忽略此行
      });
  
      if (res.success) {
        const chatId = [currentUser.uid, service.userId].sort().join("_");
        const goToChat = window.confirm("✅ 预约请求已提交，建议尽快前往聊天页面与服务商沟通。是否立即前往？");
        if (goToChat) {
          localStorage.setItem("chat_after_booking", chatId);
          navigate("/"); // 你可以改成 navigate(`/chat`) 等目标页
        }
      } else {
        alert("❌ " + res.message);
      }
    } catch (err) {
      console.error("预约失败:", err);
      alert("预约失败，请稍后再试！");
    }
  };
  
  




  const toggleFavorite = async () => {
    if (!currentUser) {
      alert("请先登录再收藏！");
      return;
    }

    const favRef = doc(db, "users", currentUser.uid, "favorites", id);
    if (isFav) {
      await setDoc(favRef, {});
      alert("已取消收藏");
    } else {
      await setDoc(favRef, { timestamp: new Date() });
      alert("已收藏！");
    }
    setIsFav(!isFav);
  };

  const handleRatingChange = async (newRating) => {
    if (!currentUser) {
      alert("请先登录！");
      return;
    }
  
    if (userRatings.length > 0) {
      alert("你已经评分过了，不能重复评分！");
      return;
    }
  
    if (userCompletedSlots.length === 0) {
      alert("你还没有完成过服务，不能评分！");
      return;
    }
  
    try {
      // ✅ 写入评分记录（商家对服务评分）
      const ratingRef = doc(db, "ratings", `${currentUser.uid}_${id}`);
      await setDoc(ratingRef, {
        userId: currentUser.uid,
        serviceId: id,
        rating: newRating,
        createdAt: serverTimestamp(),
      });
  
      // ✅ 更新服务平均评分
      const q = query(collection(db, "ratings"), where("serviceId", "==", id));
      const snap = await getDocs(q);
      const ratings = snap.docs.map((doc) => doc.data().rating);
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  
      await setDoc(doc(db, "services", id), { rating: avg }, { merge: true });
      setService((prev) => ({ ...prev, rating: avg }));
      setUserRatings([{ rating: newRating }]);
  
      alert("感谢评分！");
  
      // ✅ 同步写入到客人档案（商家对客人的评价）
      // 我们默认只取第一个完成的 slot
      const completedSlotId = userCompletedSlots[0];
      const slotRef = doc(db, "slots", completedSlotId);
      const slotSnap = await getDoc(slotRef);
  
      if (slotSnap.exists()) {
        const slotData = slotSnap.data();
        const guestUid = slotData.userId;
  
        await setDoc(
          doc(db, "users", guestUid, "receivedFromMerchants", `${id}_${completedSlotId}`),
          {
            serviceOwnerId: currentUser.uid,
            merchantName: displayName || "商家",
            serviceTitle: service.title,
            rating: newRating,
            comment: "", // 如需加输入框填写，可扩展
            createdAt: serverTimestamp(),
          }
        );
      }
    } catch (error) {
      console.error("评分失败", error);
      alert("评分失败，请稍后重试");
    }
  };
  

  useEffect(() => {
    const fetchComments = async () => {
      const ref = doc(db, "services", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setComments(data.comments || []);
      }
    };
    fetchComments();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;
  
    const newComment = {
      id: Date.now(),
      text: commentText.trim(),
      displayName,
      createdAt: new Date().toISOString(),
      uid: currentUser.uid,
      likes: 0,
      likedBy: [],
    };
  
    // ✅ 写入当前 service 的评论列表
    const docRef = doc(db, "services", id);
    const updated = [...comments, newComment];
    await setDoc(docRef, { comments: updated }, { merge: true });
    setComments(updated);
    setCommentText("");
    if (service?.userId) {
      const userReviewRef = doc(
        db,
        "users",
        service.userId,
        "reviews",
        `${id}_${newComment.id}`
      );
      await setDoc(userReviewRef, {

        ...newComment,
        serviceId: id,
        serviceTitle: service.title,
        serviceImage: service.images?.[0] || "",
      });
    }
  
    // ✅ 同步写入商家档案的 allComments（防止服务删除时丢失历史）
    const sellerUid = service.userId;
    const sellerRef = doc(db, "users", sellerUid);
    await setDoc(
      sellerRef,
      {
        allComments: arrayUnion(newComment),
      },
      { merge: true }
    );
  };
  
  const handleCommentDelete = async (commentId) => {
    if (!currentUser) return;
  
    // 找到目标评论对象
    const target = comments.find((c) => c.id === commentId);
    if (!target || target.uid !== currentUser.uid) {
      alert("只能删除自己的评论");
      return;
    }
  
    const docRef = doc(db, "services", id);
    await setDoc(docRef, {
      comments: comments.filter(c => c.id !== commentId)  // 本地更新
    }, { merge: true });
  
    setComments(comments.filter((c) => c.id !== commentId));
  };

  const handleCommentLike = async (commentId) => {
    if (!currentUser) return;
  
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;
  
    const alreadyLiked = comment.likedBy.includes(currentUser.uid);
    const updatedComment = {
      ...comment,
      likes: alreadyLiked ? comment.likes - 1 : comment.likes + 1,
      likedBy: alreadyLiked
        ? comment.likedBy.filter((uid) => uid !== currentUser.uid)
        : [...comment.likedBy, currentUser.uid],
    };
  
    const updatedComments = comments.map((c) =>
      c.id === commentId ? updatedComment : c
    );
  
    const docRef = doc(db, "services", id);
    await setDoc(docRef, { comments: updatedComments }, { merge: true });
    setComments(updatedComments);
  };
  
  

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!currentUser) return;
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setDisplayName(userSnap.data().displayName || "匿名");
      }
    };
    fetchDisplayName();
  }, [currentUser]);
  
  if (loading || !service) return <p>加载中...</p>;

  return (
    <div
    className="page-container"
    style={{
      maxWidth: "1277px",
      margin: "0 auto",
      padding: "2rem",
      paddingTop: "80px",
      paddingBottom: isMobile ? "6rem" : "2rem", // ✅ 给底部按钮留空间
    }}
  >
    <ServiceHeader
      title={service.title}
      isFav={isFav}
      toggleFavorite={toggleFavorite}
      sellerName={service.sellerName}
      sellerAvatar={service.sellerAvatar}
      sellerId={service.userId}
      rating={service.rating}
    />

    <ServiceImages images={service.images} />

    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "2rem",
      }}
    >
      {/* 左侧内容 */}
      <div style={{ flex: 1 }}>
        <ServiceInfo
          description={service.description}
          price={service.price}
          location={service.location}
          tags={service.tags}
          createdAt={service.createdAt}
        />


        <RatingAndComment
          currentUser={currentUser}
          userCompletedSlots={userCompletedSlots}
          userRatings={userRatings}
          handleRatingChange={handleRatingChange}
          commentText={commentText}
          setCommentText={setCommentText}
          comments={comments}
          handleCommentSubmit={handleCommentSubmit}
          handleCommentLike={handleCommentLike}
          handleCommentDelete={handleCommentDelete}
          visibleComments={visibleComments}
          setVisibleComments={setVisibleComments}
          displayName={displayName}
          navigate={navigate}
        />
      </div>

      {/* 右侧预约卡片：仅桌面显示 */}
      {!isMobile && (
        <div style={{ width: "360px" }}>
          <BookingPanel
            currentUser={currentUser}
            service={service}
            slots={slots}
            handleBooking={handleBooking}
          />
        </div>
      )}
    </div>

    {/* 移动端底部预约按钮栏 */}
    {isMobile && (
  <>
    {/* 底部按钮 */}
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "#fff",
        padding: "1rem",
        borderTop: "1px solid #ddd",
        boxShadow: "0 -2px 6px rgba(0,0,0,0.08)",
      }}
    >
      <button
        onClick={() => setShowBooking(true)}
        style={{
          width: "100%",
          padding: "1rem",
          backgroundColor: "#ff5858",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "1.1rem",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Book Now 💬
      </button>
    </div>

    {/* ✅ 只有 showBooking 为 true 时显示浮窗 */}
    {showBooking && (
      <div
  style={{
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100vw",
    height: "90vh",
    backgroundColor: "#fff",
    zIndex: 2000,
    overflowY: "auto",
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px",
    boxShadow: "0 -4px 16px rgba(0,0,0,0.1)",
    padding: "1.5rem",
    boxSizing: "border-box",
  }}
>
  <div style={{ maxWidth: "600px", margin: "0 auto" }}>
    <BookingPanel
      currentUser={currentUser}
      service={service}
      slots={slots}
      handleBooking={handleBooking}
      isCompact
      onBookingSuccess={() => setShowBooking(false)}
      onClose={() => setShowBooking(false)}
    />
  </div>
</div>

    )}
  </>
)}

  </div>
);

}  

export default DetailPage;