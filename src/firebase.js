// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth,GoogleAuthProvider } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYCBzG6ZzRuBNgV6cTYiQ73y5m4t1e5gc",
  authDomain: "test-c1a50.firebaseapp.com",
  projectId: "test-c1a50",
  storageBucket: "test-c1a50.firebasestorage.app",
  messagingSenderId: "906897260332",
  appId: "1:906897260332:web:6212eb0e30c4c314b6f689",
  measurementId: "G-5XT1BH38VT"
};

// Initialize Firebase



const app = initializeApp(firebaseConfig);


export const googleProvider = new GoogleAuthProvider();


export const auth = getAuth(app);
export const db = getFirestore(app)

