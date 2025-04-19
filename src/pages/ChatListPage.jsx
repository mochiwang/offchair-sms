import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
  getCountFromServer
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import app from "../firebase";

const db = getFirestore(app);
const auth = getAuth(app);

function ChatListPage() {
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      setCurrentUser(user);

      const q = query(
        collection(db, "chats"),
        where("users", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(q);

      const chatPromises = querySnapshot.docs.map(async (docSnap) => {
        const chatData = docSnap.data();
        const chatId = docSnap.id;
        const otherUserId = chatData.users.find(uid => uid !== user.uid);

        // 获取对方邮箱
        let otherEmail = otherUserId;
        try {
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            otherEmail = userData.email || otherUserId;
          }
        } catch (err) {
          console.error("无法获取对方用户信息", err);
        }

        // 获取最新消息
        const messagesCol = collection(db, "chats", chatId, "messages");
        const latestMsgSnap = await getDocs(query(messagesCol, orderBy("createdAt", "desc"), limit(1)));

        if (latestMsgSnap.empty) return null; // 没有消息不显示

        const latestMsg = latestMsgSnap.docs[0].data();

        return {
          id: chatId,
          lastMessage: latestMsg.text || "(无内容)",
          fromMe: latestMsg.senderId === user.uid,
          otherUserEmail: otherEmail,
          otherUserId: otherUserId
        };
      });

      const chatResults = (await Promise.all(chatPromises)).filter(Boolean);
      setChats(chatResults);
    });

    return () => unsubscribe();
  }, []);

  if (!currentUser) return <p>加载中...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <h2>我的聊天列表 💬</h2>
      {chats.length === 0 && <p>你还没有和任何人聊过哦~</p>}

      {chats.map(chat => (
        <div
          key={chat.id}
          style={{
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "12px",
            marginBottom: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
          onClick={() => navigate(`/chat/${chat.id}`)}
        >
          <img
            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${chat.otherUserId}`}
            alt="avatar"
            style={{ width: "40px", height: "40px", borderRadius: "50%" }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0 }}><strong>与：</strong> {chat.otherUserEmail}</p>
            <p style={{ margin: 0 }}>
              <strong>最近：</strong> {chat.fromMe ? "你：" : "对方："}{chat.lastMessage}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatListPage;
