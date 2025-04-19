// src/components/ChatPopup.jsx
import { useEffect, useState, useRef } from "react";
import { getAuth } from "firebase/auth";
import app from "../firebase";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import ChatWindow from "./ChatWindow";
import { useNavigate } from "react-router-dom";

const auth = getAuth(app);
const db = getFirestore(app);

function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [strangers, setStrangers] = useState([]);
  const [openedChats, setOpenedChats] = useState([]); // { uid, email, chatId, unread }
  const [activeChatId, setActiveChatId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const dragRef = useRef(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const defaultX = window.innerWidth - 400;
    const defaultY = window.innerHeight - 500;
    setPosition({ x: defaultX, y: defaultY });

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setCurrentUser(null);
        setFriends([]);
        setStrangers([]);
        setOpenedChats([]);
        setActiveChatId(null);
        return;
      }

      setCurrentUser(user);

      const friendSnap = await getDocs(collection(db, "users", user.uid, "friends"));
      const friendUIDs = friendSnap.docs.map(doc => doc.id);

      const chatSnap = await getDocs(collection(db, "chats"));
      const relatedUIDs = new Set();

      for (let chatDoc of chatSnap.docs) {
        const users = chatDoc.data().users;
        if (!users || users.length !== 2) continue;
        if (users.includes(user.uid)) {
          const otherUID = users.find(uid => uid !== user.uid);
          relatedUIDs.add(otherUID);
        }
      }

      const fetchUsers = async (uids) => {
        const list = [];
        for (let uid of uids) {
          const userDoc = await getDoc(doc(db, "users", uid)); // ✅ 加上这一行
          const userData = userDoc.data() || {};
          const email = userData.email || uid;
          const avatarUrl = userData.avatarUrl || "https://via.placeholder.com/48";
          list.push({ uid, email, avatarUrl });
        }
        return list;
      };

      const allUsers = await fetchUsers(Array.from(relatedUIDs));
      const friendsList = allUsers.filter(u => friendUIDs.includes(u.uid));
      const strangersList = allUsers.filter(u => !friendUIDs.includes(u.uid));

      setFriends(friendsList);
      setStrangers(strangersList);
    });

    return () => unsubscribe();
  }, []);

  const togglePopup = () => setIsOpen(!isOpen);

  const startChatWith = async (uid, email) => {
    if (!currentUser) return;
    const chatId = [currentUser.uid, uid].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        users: [currentUser.uid, uid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTimestamp: serverTimestamp(),
        readTimestamps: {
          [currentUser.uid]: serverTimestamp(),
          [uid]: serverTimestamp(),
        },
      });
    }

    // ✅ 监听未读状态并加入标签
    onSnapshot(chatRef, async (docSnap) => {
      const data = docSnap.data();
      const lastTime = data.lastMessageTimestamp?.toMillis();
      const readTime = data.readTimestamps?.[currentUser.uid]?.toMillis();
      const unread = !readTime || lastTime > readTime;

      setOpenedChats(prev => {
        const filtered = prev.filter(c => c.chatId !== chatId);
        return [{ uid, email, chatId, unread }, ...filtered];
      });
    });

    setActiveChatId(chatId);
  };

  const closeTab = (chatId) => {
    const newList = openedChats.filter((chat) => chat.chatId !== chatId);
    setOpenedChats(newList);
    if (activeChatId === chatId) {
      setActiveChatId(newList.length > 0 ? newList[0].chatId : null);
    }
  };

  const handleDragStart = (e) => {
    dragging.current = true;
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleDrag = (e) => {
    if (!dragging.current) return;
    setPosition({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };

  const handleDragEnd = () => {
    dragging.current = false;
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
      <button
        onClick={togglePopup}
        style={{
          padding: "10px",
          borderRadius: "8px",
          backgroundColor: "#0073bb",
          color: "white",
          border: "none",
        }}
      >
        {isOpen ? "关闭聊天" : "打开聊天"}
      </button>

      {isOpen && (
        <div
          ref={dragRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          style={{
            position: "fixed",
            left: position.x,
            top: position.y,
            width: "360px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            padding: "1rem",
            cursor: dragging.current ? "grabbing" : "grab",
          }}
        >
          {!activeChatId ? (
            <>
              <h4>好友</h4>
              {friends.map((friend) => (
  <div
    key={friend.uid}
    style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "10px" }}
  >
    <img
      src={friend.avatarUrl || "https://via.placeholder.com/40"}
      alt="头像"
      onClick={() => navigate(`/user/${friend.uid}`)}
      style={{ width: 40, height: 40, borderRadius: "50%", cursor: "pointer", objectFit: "cover" }}
      title="点击查看主页"
    />
    <span
      style={{ cursor: "pointer", fontSize: "0.95rem", flex: 1 }}
      onClick={() => startChatWith(friend.uid, friend.email)}
    >
      {friend.email}
    </span>
  </div>
))}

              <h4 style={{ marginTop: "1rem" }}>陌生人</h4>
              {strangers.map((stranger) => (
                <div key={stranger.uid} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "10px" }}>
                  <img
                    src={stranger.avatarUrl || "https://via.placeholder.com/40"}
                    alt="头像"
                    onClick={() => navigate(`/user/${stranger.uid}`)}
                    style={{ width: 40, height: 40, borderRadius: "50%", cursor: "pointer", objectFit: "cover" }}
                    title="点击查看主页"
                  />
                  <span
                    style={{ cursor: "pointer", fontSize: "0.95rem", flex: 1 }}
                    onClick={() => startChatWith(stranger.uid, stranger.email)}
                  >
                    {stranger.email}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Tab 标签栏 */}
              <div style={{ display: "flex", overflowX: "auto", marginBottom: "10px" }}>
                {openedChats.map((chat) => (
                  <div
                    key={chat.chatId}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: chat.chatId === activeChatId ? "#e6f0fa" : "#f2f2f2",
                      marginRight: "6px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setActiveChatId(chat.chatId)}
                  >
                    <span style={{ fontSize: "0.9rem" }}>{chat.email}</span>
                    {chat.unread && <span style={{ color: "red", marginLeft: 4 }}>•</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(chat.chatId);
                      }}
                      style={{
                        marginLeft: "6px",
                        background: "none",
                        border: "none",
                        fontSize: "1rem",
                        cursor: "pointer",
                        color: "#888",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* 聊天窗口 */}
              <ChatWindow
                chatId={activeChatId}
                onClose={() => closeTab(activeChatId)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatPopup;
