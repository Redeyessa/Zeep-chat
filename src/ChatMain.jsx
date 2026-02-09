import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  serverTimestamp,
  onSnapshot,
  doc,
  setDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./chatmain.css";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  "https://nttlpvtfykvndxyhgvhx.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dGxwdnRmeWt2bmR4eWhndmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NzE2MDAsImV4cCI6MjA4NTM0NzYwMH0.UG12Fo1sxsYf4NgLmKMuAELDi0DkxYkrRMQACMCAVbo" 
  
);

function ChatMain() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [messagesearch, setmessagesearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatUsers, setChatUsers] = useState([]);
  const [profile, setProfile] = useState(false);
  const [show,setshow] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);


  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);
      


      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || "",
          email: currentUser.email || "",
          photoURL: currentUser.photoURL || ""
        },
       
      );

    });

    return () => unsub();
  }, [navigate]);


  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, "chats");

    const unsub = onSnapshot(chatsRef, async (snapshot) => {
      const otherUserIds = new Set();

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data?.users?.includes(user.uid)) {
          const otherId = data.users.find(id => id !== user.uid);
          if (otherId) otherUserIds.add(otherId);
        }
      });

      if (otherUserIds.size === 0) {
        setChatUsers([]);
        return;
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "in", [...otherUserIds]));
      const usersSnap = await getDocs(q);

      setChatUsers(usersSnap.docs.map(d => d.data()));
    });

    return () => unsub();
  }, [user]);


  useEffect(() => {
    if (!user || !selectedUser) return;

    const chatId = getChatId(user.uid, selectedUser.uid);
    const msgsRef = collection(db, "chats", chatId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user, selectedUser]);

  const handleSearch = async () => {
    if (!search.trim()) return;

    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("displayName", ">=", search.trim()),
      where("displayName", "<=", search.trim() + "\uf8ff")
    );

    const snap = await getDocs(q);
    setSearchResults(
      snap.docs.map(d => d.data()).filter(u => u.uid !== user.uid)
    );

   

  };
  


  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const chatId = getChatId(user.uid, selectedUser.uid);
    

    await setDoc(
      doc(db, "chats", chatId),
      {
        users: [user.uid, selectedUser.uid],
        lastUpdated: serverTimestamp()
      },
      { merge: true }
    );

    const massagewithlinks = (newMessage)=>{
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return newMessage.replace(urlRegex, function(url) {
          return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      });
    } 
    await addDoc(collection(db, "chats", chatId, "messages"), {

      sender: user.uid,
      receiver: selectedUser.uid,
      text: massagewithlinks(newMessage),
      timestamp: serverTimestamp()
    });

    setNewMessage("");
  };

  const getChatId = (a, b) => [a, b].sort().join("_");

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

 const handleProfilePictureChange = async (event) => {
  const file = event.target.files[0];
  if (!file || !user) return;

  const ext = file.name.split(".").pop();
  const fileName = `${user.uid}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return;
  }

  const { data } = supabase.storage
    .from("profile-pictures")
    .getPublicUrl(fileName);

  if (!data?.publicUrl) {
    console.error("Error getting public URL");
    return;
  }

  await setDoc(
    doc(db, "users", user.uid),
    { photoURL: data.publicUrl },
    { merge: true }
  );

  setUser(prev => ({
    ...prev,
    photoURL: data.publicUrl
  }));

  console.log("Profile image updated:", data.publicUrl);
};



const sendImage = async (event) => {
  const file = event.target.files[0];
  if (!file || !selectedUser) return;

  const chatId = getChatId(user.uid, selectedUser.uid);
  const fileName = `${user.uid}-${Date.now()}-${file.name}`;

  let bucketName = "chat-images";

  const uploadImage = async (bucket) => {
    return await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
  };

  let uploadResponse = await uploadImage(bucketName);

  if (uploadResponse.error && uploadResponse.error.message.includes("bucket is full")) {

    bucketName = `chat-images-${Date.now()}`;
    const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
      public: true,
    });

    if (bucketError) {
      console.error("Error creating new bucket:", bucketError);
      return;
    }

    uploadResponse = await uploadImage(bucketName);
  }

  if (uploadResponse.error) {
    console.error("Image upload error:", uploadResponse.error);
    return;
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);

  if (!data?.publicUrl) {
    console.error("Error getting image URL");
    return;
  }

  await addDoc(collection(db, "chats", chatId, "messages"), {
    sender: user.uid,
    receiver: selectedUser.uid,
    text: `<img src='${data.publicUrl}' alt='sent image' style='max-width: 100%;' />`,
    timestamp: serverTimestamp(),
  });

  console.log("Image sent:", data.publicUrl);
};

  const handleImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  if (!user) return null;
  let photo = user.photoURL;
  
  user.photoURL
    ? (photo = user.photoURL)
    : (photo =
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y");
  return (
   <div className={`chat-app-root ${selectedUser ? "chat-active" : ""}`}>
    {profile && (
  <div
    className="profile-overlay"
    onClick={() => setProfile(false)}
  />
)}

{previewImage && (
  <div className="image-preview-overlay" onClick={closeImagePreview}>
    <div className="image-preview-container">
      <img src={previewImage} alt="Preview" className="image-preview" />
      <button className="close-preview-btn" onClick={closeImagePreview}>X</button>
    </div>
  </div>
)}

     
      <div className="chat-sidebar">
      <div className="chat-sidebar-header" onClick={() => setProfile(true)}>
  
    <img style={{ borderRadius: "50%" ,width: "40px", height: "40px", marginRight: "8px" }}
      src={photo}
      className="user-avatar"
    />

  <span>{user.displayName}</span>
</div>



<div className={`chat-profile-section ${profile ? "visible" : ""}`}>
  <h3>User Profile</h3>

  {user.photoURL && (
    <img src={user.photoURL} alt="profile" />
  )}

  <p><strong>Name:</strong> {user.displayName}</p>
  <p><strong>Email:</strong> {user.email}</p>

  <input
    type="file"
    accept="image/*"
    onChange={handleProfilePictureChange}
  />

  <button onClick={logout}>Logout</button>
  <button onClick={() => setProfile(false)}>Close</button>
</div>


              <div className="chat-sidebar-search">
                  <input
                    type="text"
                    className="chat-search-input"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    name="user-search"
                    id="su"
                  />
              
              </div>

        <ul className="chat-user-list">
          {(search.trim() ? searchResults : chatUsers).map(u => (
            <li
              key={u.uid}
              className={`chat-user-item ${
                selectedUser?.uid === u.uid ? "selected" : ""
              }`}
              onClick={() => {
                setSelectedUser(u);
                setSearch("");
              }}
            >
              <span className="chat-user-name">
                {
                 <img style={{ borderRadius: "50%" ,width: "35px", height: "35px", marginRight: "8px" }}
                    src={u.photoURL}
                    className="chat-user-avatar"
                  />
                }
                {u.displayName || u.email}
              </span>
            </li>
          ))}

          {!search && chatUsers.length === 0 && (
            <div className="chat-empty-list">No chats yet</div>
          )}
        </ul>
      </div>

      <div className="chat-main">

        {selectedUser ? (
          <>
            <div className="chat-header">
              {selectedUser && (
              <button
                className="chat-back-btn"
                onClick={() => setSelectedUser(null)}
              >
                Back
              </button>
            
            )}
            {selectedUser.photoURL && (
              <img
                src={selectedUser.photoURL}
                style={{ width: "30px", height: "30px", borderRadius: "50%", marginRight: "8px" }}
              />
            )}
            {selectedUser?.displayName || selectedUser?.email}
            <span className="message-search-icon" onClick={() => setshow(!show)}>
              🔍
            </span>
            <div className={`message-search-wrapper${show ? "":"show"}`}>
              <input
                type="search"
                placeholder="Search messages..."
                className={`message-search-input`}
                value={messagesearch}
                id="sm"
                name="search"
                onChange={(e) => setmessagesearch(e.target.value)}
              />
             
            </div>

            </div>

            <div className="chat-messages">
              
              <ul>
    {messages.filter(m => {
      const text = typeof m.text === "string" ? m.text : "";
      return text.toLowerCase().includes(messagesearch.toLowerCase());
    }).map(m => (
        <li key={m.id}>
          <div
            className={`chat-message-row ${
              m.sender === user.uid ? "sent" : "received"
            }`}
          >
            <div className="chat-message-bubble">
              {m.text.includes("<img") ?  (
                <span
                  dangerouslySetInnerHTML={{ __html: m.text }}
                  onClick={() => {
                    const match = m.text.match(/src='(.*?)'/);
                    if (match) handleImagePreview(match[1]);
                  }}
                  style={{ cursor: "pointer" }}
                ></span>
              ) : (
                <span dangerouslySetInnerHTML={{ __html: m.text }}></span>
              )}
              <div className="chat-message-timestamp">
                {m.timestamp
                  ? new Date(m.timestamp.toDate()).toLocaleTimeString([], {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : ""}
              </div>

            </div>
          </div>
        </li>
      ))}
  </ul>
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-row">
              <input
                type="text"
                className="chat-input"
                placeholder="Type a message"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <input
                type="file"
                accept="application, image/*"
                className="chat-image-upload"
                onChange={sendImage}
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="chat-select-user">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMain;
