// src/pages/DetailPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import StarRatings from "react-star-ratings";
import { FaHeart } from "react-icons/fa";
import { onSnapshot } from "firebase/firestore";
import CalendarWithSlots from "../components/CalendarWithSlots";


const db = getFirestore(app);
const auth = getAuth(app);

function DetailPage() {
  const [slots, setSlots] = useState([]);
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [userCompletedSlots, setUserCompletedSlots] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [commentText, setCommentText] = useState("");
const [comments, setComments] = useState([]);
const [displayName, setDisplayName] = useState("匿名");
const [visibleComments, setVisibleComments] = useState(5); // 初始显示 5 条



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
      setService({ id: docSnap.id, ...docSnap.data() });
      setLoading(false);
    }
  };
  fetchService();
}, [id]);

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
      // 获取 slot 信息
      const slotRef = doc(db, "slots", slotId);
      const slotSnap = await getDoc(slotRef);
      if (!slotSnap.exists()) {
        alert("预约失败，时间段不存在！");
        return;
      }
      const slotData = slotSnap.data();
  
      // 写入预约记录
      const appointmentRef = doc(db, "appointments", `${currentUser.uid}_${slotId}`);
      await setDoc(appointmentRef, {
        userId: currentUser.uid,
        serviceId: id,
        slotId,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        createdAt: serverTimestamp(),
        status: "booked",
      });
      
  
      // 页面移除该 slot
      await setDoc(
        slotRef,
        {
          available: false,
          userId: currentUser.uid,
          bookedAt: serverTimestamp(),
        },
        { merge: true }
      );
      
  
  
      // 弹窗提示，并引导跳转聊天
      const chatId = [currentUser.uid, service.userId].sort().join("_");
      const goToChat = window.confirm("✅ 预约成功！建议尽快前往聊天页面，与服务商确认见面时间和地点。是否立即前往？");
  
      if (goToChat) {
        localStorage.setItem("chat_after_booking", chatId); // ✅ 提示浮窗打开

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
  
    const ratingRef = doc(db, "ratings", `${currentUser.uid}_${id}`);
    await setDoc(ratingRef, {
      userId: currentUser.uid,
      serviceId: id,
      rating: newRating,
      createdAt: serverTimestamp(),
    });
  
    const q = query(collection(db, "ratings"), where("serviceId", "==", id));
    const snap = await getDocs(q);
    const ratings = snap.docs.map((doc) => doc.data().rating);
    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  
    await setDoc(doc(db, "services", id), { rating: avg }, { merge: true });
    setService((prev) => ({ ...prev, rating: avg }));
  
    alert("感谢评分！");
    setUserRatings([{ rating: newRating }]); // 手动设置为已评分
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
    
  
    const docRef = doc(db, "services", id);
    const updated = [...comments, newComment];
  
    await setDoc(docRef, { comments: updated }, { merge: true });
    setComments(updated);
    setCommentText("");
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
    <div className="page-container" style={{ maxWidth: "1277px", margin: "0 auto", padding: "2rem", paddingTop: "80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>{service.title}</h1>
        <span style={{ fontSize: "2rem", cursor: "pointer", color: isFav ? "#f7b500" : "#aaa", userSelect: "none" }} onClick={toggleFavorite}>
          {isFav ? "★" : "☆"}
        </span>
      </div>

      {service.images?.length > 0 && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "2rem", height: "501px" }}>
          <img src={service.images[0]} alt="main" onClick={() => setPreviewUrl(service.images[0])} style={{ width: "65%", height: "100%", objectFit: "cover", borderRadius: "12px", cursor: "pointer" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "35%" }}>
            {service.images.slice(1, 5).map((url, index) => (
              <img key={index} src={url} alt={`sub-${index}`} onClick={() => setPreviewUrl(url)} style={{ width: "100%", height: "calc(25% - 6px)", objectFit: "cover", borderRadius: "12px", cursor: "pointer" }} />
            ))}
          </div>
        </div>
      )}

      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, cursor: "pointer" }}>
          <img src={previewUrl} alt="preview" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "12px", boxShadow: "0 0 10px rgba(0,0,0,0.3)" }} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: "2rem" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "1.1rem", color: "#555" }}>{service.description}</p>
          <p><strong>价格：</strong> ¥{service.price}</p>
          <p><strong>地址：</strong> {service.location || "请登录后查看"}</p>
          <p><strong>标签：</strong> {service.tags?.map((t) => `#${t}`).join(" ")}</p>

         
          <div style={{ display: "flex", alignItems: "center", margin: "0.5rem 0" }}>
  <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>评分：</span>
  <StarRatings
    rating={service.rating || 0}
    starRatedColor="#facc15"
    starEmptyColor="#d1d5db"
    numberOfStars={5}
    name="display-rating"
    starDimension="28px"
    starSpacing="4px"
  />
  <span style={{ marginLeft: "0.5rem", color: "#555" }}>
    {service.rating ? `${service.rating.toFixed(1)} 分` : "暂无评分"}
  </span>
</div>

          

          {service.createdAt?.toDate && (
            <p style={{ fontSize: "0.9rem", color: "#888" }}>发布时间：{service.createdAt.toDate().toLocaleString()}</p>
          )}

<div style={{ display: "flex", alignItems: "center", marginTop: "2rem", flexWrap: "wrap" }}>
  <span style={{ marginRight: "0.5rem", fontSize: "1rem" }}>为该服务打分：</span>

  {/* 用户未登录 */}
  {!currentUser && (
    <span style={{ color: "#888" }}>请先登录后评分</span>
  )}

  {/* 没有预约或预约未完成 */}
  {currentUser && userCompletedSlots.length === 0 && (
    <span style={{ color: "#888" }}>服务完成后可评分</span>
  )}

  {/* 已评分 */}
  {currentUser && userCompletedSlots.length > 0 && userRatings.length > 0 && (
    <>
      <StarRatings
        rating={userRatings[0].rating}
        starRatedColor="#facc15"
        starEmptyColor="#d1d5db"
        starDimension="28px"
        starSpacing="4px"
      />
      <span style={{ marginLeft: "0.5rem", color: "#888" }}>你已完成评分，感谢你的反馈！</span>
    </>
  )}

  {/* 尚未评分，可以评分 */}
  {currentUser && userCompletedSlots.length > 0 && userRatings.length === 0 && (
    <StarRatings
      rating={0}
      starRatedColor="#facc15"
      starEmptyColor="#d1d5db"
      starHoverColor="#facc15"
      numberOfStars={5}
      name="user-rating"
      starDimension="28px"
      starSpacing="4px"
      changeRating={handleRatingChange}
    />
  )}
</div>


<div style={{ marginTop: "2rem" }}>
  <h4>评论区</h4>
{/* 评论输入框 */}
<form onSubmit={handleCommentSubmit} style={{ marginTop: "0.75rem" }}>
  <input
    type="text"
    value={commentText}
    onChange={(e) => setCommentText(e.target.value)}
    placeholder="写下你的评论..."
    style={{
      width: "100%",
      padding: "8px",
      borderRadius: "6px",
      border: "1px solid #ccc",
    }}
  />
</form>

{/* 评论列表展示 */}
{comments.length > 0 ? (
  <>
    {comments.slice(0, visibleComments).map((cmt) => {
      const liked = cmt.likedBy?.includes(currentUser?.uid);
      return (
        <div
        key={cmt.id}
        style={{
          marginBottom: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* 左侧：昵称 + 内容 */}
        <div>
          <strong
            style={{ color: "#5c4db1", cursor: "pointer" }}
            onClick={() => navigate(`/user/${cmt.uid}`)}
          >
            @{cmt.displayName}
          </strong>
          ：
          {cmt.text.split(/(@\w+)/g).map((part, i) =>
            part.startsWith("@") ? (
              <span
                key={i}
                style={{ color: "#f43f5e", cursor: "pointer" }}
                onClick={() => navigate(`/user/${part.slice(1)}`)}
              >
                {part}
              </span>
            ) : (
              part
            )
          )}
        </div>
  
        {/* 右侧：红心按钮和删除 */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => handleCommentLike(cmt.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: liked ? "#fff0f0" : "#f7f7f7",
              border: liked ? "1px solid #ff4d6d" : "1px solid #ddd",
              color: liked ? "#ff4d6d" : "#888",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.25s ease",
              boxShadow: liked ? "0 2px 8px rgba(255,77,109,0.2)" : "none",
            }}
          >
            <FaHeart
              color={liked ? "#ff4d6d" : "#ccc"}
              size={16}
              style={{
                transition: "color 0.2s ease",
                transform: liked ? "scale(1.1)" : "scale(1)",
              }}
            />
            {cmt.likes || 0}
          </button>
  
          {cmt.uid === currentUser?.uid && (
            <button
              onClick={() => handleCommentDelete(cmt.id)}
              style={{
                marginLeft: "6px",
                fontSize: "0.75rem",
                color: "red",
                border: "none",
                background: "none",
                cursor: "pointer",
              }}
            >
              删除
            </button>
          )}
        </div>
      </div>
    );
  })}

    {/* 🔽 查看更多按钮 */}
    {comments.length > visibleComments && (
      <button
        onClick={() => setVisibleComments((prev) => prev + 5)}
        style={{
          marginTop: "1rem",
          padding: "6px 12px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          backgroundColor: "#f7f7f7",
          cursor: "pointer",
        }}
      >
        查看更多评论
      </button>
    )}
  </>
) : (
  <p style={{ fontSize: "0.9rem", color: "#666" }}>暂无评论</p>
)}



</div>

        </div>

        <div style={{ width: "360px" }}>
          {currentUser?.uid !== service.userId && slots.length > 0 && (
            <div style={{ padding: "1rem", border: "1px solid #eee", borderRadius: "10px" }}>
              <h4 style={{ marginBottom: "1rem" }}>可预约时间</h4>
              <ul style={{ paddingLeft: 0 }}>


              <CalendarWithSlots slots={slots} onBook={handleBooking} />


              {/*
                {slots.map((slot) => (
                  <li key={slot.id} style={{ listStyle: "none", marginBottom: "0.5rem" }}>
                    {new Date(slot.startTime.seconds * 1000).toLocaleString()} - {new Date(slot.endTime.seconds * 1000).toLocaleTimeString()}
                    <button
                      onClick={() => handleBooking(slot.id)}
                      style={{
                        marginLeft: "1rem",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        backgroundColor: "#4caf50",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      预约
                    </button>
                  </li>
                ))}

             */ }


              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailPage;
