import React, { useEffect, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

function GoogleAuth() {
  const [user, setUser] = useState(null);

 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("User signed in:", result.user);
      setUser(result.user);
    } catch (error) {
      console.error("Error during Google login:", error);
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {user ? (
        <>
          <h3>Welcome, {user.displayName}</h3>
          <img src={user.photoURL} alt="profile" width="50" />
          <p>Email: {user.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={loginWithGoogle}>Sign in with Google</button>
      )}
    </div>
  );
}

export default GoogleAuth;