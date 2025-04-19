import { useEffect, useState } from "react";
import app from "../firebase";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const db = getFirestore(app);
const auth = getAuth(app);

function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [strangers, setStrangers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      const friendSnap = await getDocs(collection(db, "users", currentUser.uid, "friends"));
      const friendUIDs = friendSnap.docs.map(doc => doc.id);

      const chatSnap = await getDocs(collection(db, "chats"));
      const strangerCandidates = [];
      for (let doc of chatSnap.docs) {
        const users = doc.data().users;
        if (!users || users.length !== 2) continue;

        const otherUID = users.find(uid => uid !== currentUser.uid);
        const isRelated = users.includes(currentUser.uid);

        if (isRelated && !friendUIDs.includes(otherUID)) {
          strangerCandidates.push(otherUID);
        }
      }

      const friendsList = [];
      for (let uid of friendUIDs) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          friendsList.push({ uid, email: userDoc.data().email || "未知邮箱" });
        }
      }

      const strangersList = [];
      for (let uid of strangerCandidates) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          strangersList.push({ uid, email: userDoc.data().email || "未知用户" });
        }
      }

      setFriends(friendsList);
      setStrangers(strangersList);
      setLoading(false);
    };

    fetchData();
  }, [currentUser]);

  const handleChat = async (otherUid) => {
    const chatId = [currentUser.uid, otherUid].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: [currentUser.uid, otherUid],
        createdAt: serverTimestamp(),
        lastMessage: "",
      });
    }

    window.dispatchEvent(new CustomEvent("open-chat", {
        detail: { uid: otherUid, email: emailOrFallback }
      }));
  };

  const handleAddFriend = async (otherUid) => {
    const friendRef = doc(db, "users", currentUser.uid, "friends", otherUid);
    await setDoc(friendRef, {
      addedAt: serverTimestamp(),
      source: "manual",
    });

    setFriends(prev => [...prev, { uid: otherUid, email: strangers.find(u => u.uid === otherUid)?.email || "未知邮箱" }]);
    setStrangers(prev => prev.filter(u => u.uid !== otherUid));
  };

  const handleRemoveFriend = async (uidToRemove) => {
    const confirmDelete = window.confirm("确定要删除该好友吗？");
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "users", currentUser.uid, "friends", uidToRemove));

    setFriends(prev => prev.filter(f => f.uid !== uidToRemove));

    // 添加到陌生人列表
    const alreadyExists = strangers.find(u => u.uid === uidToRemove);
    if (!alreadyExists) {
      const userDoc = await getDoc(doc(db, "users", uidToRemove));
      const email = userDoc.exists() ? userDoc.data().email || "未知邮箱" : "未知邮箱";
      setStrangers(prev => [...prev, { uid: uidToRemove, email }]);
    }
  };

  if (loading) return <p>加载中...</p>;

  return (
    <div className="page-container">
      <h2>我的好友</h2>

      {friends.length === 0 ? (
        <p style={{ color: "#888", fontStyle: "italic" }}>你还没有添加任何好友。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {friends.map(friend => (
            <div
              key={friend.uid}
              style={{
                padding: "1rem",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <img
                  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${friend.uid}`}
                  alt="avatar"
                  style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                />
                <div>{friend.email}</div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => handleChat(friend.uid)}>💬 聊天</button>
                <button
                  onClick={() => handleRemoveFriend(friend.uid)}
                  style={{
                    backgroundColor: "#ffecec",
                    border: "1px solid #ffaaaa",
                    color: "#cc0000",
                    borderRadius: "6px",
                    cursor: "pointer",
                    padding: "6px 10px"
                  }}
                >
                  ❌ 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {strangers.length > 0 && (
        <>
          <h3 style={{ marginTop: "2rem", color: "#666" }}>🕵️ 陌生人</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {strangers.map(stranger => (
              <div
                key={stranger.uid}
                style={{
                  padding: "1rem",
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <img
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${stranger.uid}`}
                    alt="avatar"
                    style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                  />
                  <div>{stranger.email}</div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => handleChat(stranger.uid)}>💬 聊天</button>
                  <button onClick={() => handleAddFriend(stranger.uid)}>➕ 加为好友</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FriendsPage;
