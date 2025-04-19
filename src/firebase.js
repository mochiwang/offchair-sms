// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDigu0REIsxfgaPUsfWYhcgv7Qh4ZkizE",
  authDomain: "offchair-platform.firebaseapp.com",
  projectId: "offchair-platform",
  storageBucket: "offchair-platform.firebasestorage.app",
  messagingSenderId: "823271467002",
  appId: "1:823271467002:web:918cc86240fd6e5a402643"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;