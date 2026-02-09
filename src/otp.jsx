import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { updateProfile } from "firebase/auth"; // You need to import this function
import { auth, googleProvider, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import './otp.css';

function GoogleAuth() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setname] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Store user in Firestore
        await setDoc(doc(db, "users", currentUser.uid), {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "",
          photoURL: currentUser.photoURL || "",
        });
        navigate("/");
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  

const createEmailUser = async () => {
    if (!name.trim()) {
      setError("Please enter a user name.");
      return;
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      
      await updateProfile(result.user, {
        displayName: name,
      });

      setUser(result.user);
      setError("");
      
     
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name || "",
        photoURL: result.user.photoURL || "",
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };


  const loginWithEmail = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      setError("");
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name || "",
        photoURL: result.user.photoURL || "",
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const loginWithGoogle = async () => {
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setError("");
   
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || "",
        photoURL: result.user.photoURL || "",
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      {user ? (
        <>
          <h3>Welcome, {user.displayName || user.email}</h3>
          {user.photoURL && <img src={user.photoURL} alt="profile" width="60" />}
          <p>User ID: {user.uid}</p>
      
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
           <input
            type="text"
            placeholder="User name"
            value={name}
            onChange={(e) => setname(e.target.value)}
          />
          <button onClick={createEmailUser}>Sign Up</button>
          <button onClick={loginWithEmail}>Login</button>
          <button onClick={loginWithGoogle}>Sign in with Google</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </div>
  );
}

export default GoogleAuth;