// src/components/ChatWindow.jsx
import { useEffect, useRef, useState } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../firebase";

const db = getFirestore(app);
const auth = getAuth(app);

function ChatWindow({ chatId, onClose }) {
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserEmail, setOtherUserEmail] = useState("");
  const [isFriend, setIsFriend] = useState(false);
  const [otherUID, setOtherUID] = useState(null);
  const messagesEndRef = useRef(null);

  // ✅ 加载对方信息 + 判断是否好友
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const chatDocRef = doc(db, "chats", chatId);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt"));

    getDoc(chatDocRef).then((chatDoc) => {
      if (chatDoc.exists()) {
        const other = chatDoc.data().users.find(
          (uid) => uid !== currentUser.uid
        );
        setOtherUID(other);

        // 获取对方邮箱或 fallback UID
        getDoc(doc(db, "users", other)).then((userDoc) => {
          const email = userDoc.exists()
            ? userDoc.data().email || other
            : other;
          setOtherUserEmail(email);
        });

        // 判断是否好友
        getDoc(doc(db, "users", currentUser.uid, "friends", other)).then(
          (friendDoc) => {
            setIsFriend(friendDoc.exists());
          }
        );
      }
    });

    // ✅ 更新已读时间戳
    updateDoc(chatDocRef, {
      [`readTimestamps.${currentUser.uid}`]: serverTimestamp(),
    });

    // ✅ 实时监听聊天内容
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    });

    return () => unsubscribe();
  }, [chatId, currentUser]);

  // ✅ 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ 发送消息
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      text: newMessage,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "chats", chatId, "messages"), messageData);
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: newMessage,
      lastMessageTimestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  // ✅ 加为好友
  const handleAddFriend = async () => {
    if (!currentUser || !otherUID) return;
    await setDoc(doc(db, "users", currentUser.uid, "friends", otherUID), {
      addedAt: serverTimestamp(),
    });
    setIsFriend(true);
  };

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "12px",
      width: "300px",
      display: "flex",
      flexDirection: "column",
      height: "400px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      {/* 顶部栏 */}
      <div style={{
        padding: "0.5rem 1rem",
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <strong>{otherUserEmail}</strong>
        {!isFriend && (
          <button onClick={handleAddFriend} style={{
            marginLeft: "0.5rem",
            fontSize: "0.85rem",
            background: "#eee",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
            padding: "4px 8px"
          }}>加为好友</button>
        )}
        <button onClick={onClose} style={{
          border: "none",
          background: "none",
          fontSize: "1.2rem",
          cursor: "pointer"
        }}>×</button>
      </div>

      {/* 消息内容 */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "1rem"
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              textAlign: msg.senderId === currentUser?.uid ? "right" : "left",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "16px",
                backgroundColor: msg.senderId === currentUser?.uid ? "#cce5ff" : "#f0f0f0",
                color: "#333",
                maxWidth: "70%",
                wordWrap: "break-word",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入栏 */}
      <div style={{
        padding: "0.5rem",
        borderTop: "1px solid #eee",
        display: "flex",
        gap: "8px"
      }}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
          placeholder="输入消息..."
        />
        <button onClick={handleSend} style={{
          backgroundColor: "#0073bb",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "0 12px"
        }}>
          发送
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
