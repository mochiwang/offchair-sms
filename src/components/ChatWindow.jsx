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
  deleteDoc,
  getDocs,
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

  useEffect(() => {
    if (!chatId || !currentUser) return;

    const chatDocRef = doc(db, "chats", chatId);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt"));

    const initChatAndLoad = async () => {
      let chatSnap = await getDoc(chatDocRef);

      if (!chatSnap.exists()) {
        const [uid1, uid2] = chatId.split("_");
        const fallbackOther = uid1 === currentUser.uid ? uid2 : uid1;
        await setDoc(chatDocRef, {
          users: [currentUser.uid, fallbackOther],
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastMessageTimestamp: serverTimestamp(),
          readTimestamps: {
            [currentUser.uid]: serverTimestamp(),
            [fallbackOther]: serverTimestamp(),
          },
        });
        chatSnap = await getDoc(chatDocRef); // 重新获取
      }

      const other = chatSnap.data().users.find((uid) => uid !== currentUser.uid);
      setOtherUID(other);

      const userSnap = await getDoc(doc(db, "users", other));
      const email = userSnap.exists() ? userSnap.data().email || other : other;
      setOtherUserEmail(email);

      const friendSnap = await getDoc(doc(db, "users", currentUser.uid, "friends", other));
      setIsFriend(friendSnap.exists());

      // ✅ 安全地更新阅读时间戳
      await updateDoc(chatDocRef, {
        [`readTimestamps.${currentUser.uid}`]: serverTimestamp(),
      });

      // 👂 监听消息
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMessages(data);
      });

      return unsubscribe;
    };

    const unsubscribePromise = initChatAndLoad();
    return () => {
      unsubscribePromise.then((unsub) => unsub && unsub());
    };
  }, [chatId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      text: newMessage,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
    };

    const chatRef = doc(db, "chats", chatId);
    await addDoc(collection(chatRef, "messages"), messageData);
    await updateDoc(chatRef, {
      lastMessage: newMessage,
      lastMessageTimestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  const handleAddFriend = async () => {
    if (!currentUser || !otherUID) return;
    await setDoc(doc(db, "users", currentUser.uid, "friends", otherUID), {
      addedAt: serverTimestamp(),
    });
    setIsFriend(true);
  };

  const handleDeleteChat = async () => {
    if (!chatId || !currentUser) return;

    const confirmDelete = window.confirm("确定要删除该聊天记录吗？删除后无法恢复。");
    if (!confirmDelete) return;

    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const messagesSnap = await getDocs(messagesRef);
      const deletePromises = messagesSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      await deleteDoc(doc(db, "chats", chatId));
      alert("聊天已删除！");
      onClose();
    } catch (err) {
      console.error("删除失败", err);
      alert("删除失败，请稍后再试！");
    }
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
      <div style={{
        padding: "0.5rem 1rem",
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px"
      }}>
        <span style={{
          fontWeight: 600,
          fontSize: "0.95rem",
          color: "#333",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "120px"
        }}>{otherUserEmail}</span>

        {!isFriend && (
          <button
            onClick={handleAddFriend}
            style={{
              padding: "4px 10px",
              fontSize: "0.8rem",
              borderRadius: "12px",
              border: "1px solid #e74c3c",
              color: "#e74c3c",
              backgroundColor: "#fff",
              cursor: "pointer"
            }}
          >
            加为好友
          </button>
        )}

        <button
          onClick={handleDeleteChat}
          style={{
            padding: "4px 10px",
            fontSize: "0.8rem",
            borderRadius: "12px",
            border: "1px solid #f0f0f0",
            color: "#888",
            backgroundColor: "#fff",
            cursor: "pointer"
          }}
        >
          删除聊天
        </button>

        <button onClick={onClose} style={{
          border: "none",
          background: "none",
          fontSize: "1.2rem",
          cursor: "pointer",
          color: "#999"
        }}>×</button>
      </div>

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