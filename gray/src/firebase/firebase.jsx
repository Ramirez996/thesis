// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7TVapuGFnwoRvqRyxZbMVL6M5_rPlwTY",
  authDomain: "gray-a6b9d.firebaseapp.com",
  projectId: "gray-a6b9d",
  storageBucket: "gray-a6b9d.firebasestorage.app",
  messagingSenderId: "177629642747",
  appId: "1:177629642747:web:c5754ce66435edd2f9d55e",
  measurementId: "G-Z6FV0F4C0G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };