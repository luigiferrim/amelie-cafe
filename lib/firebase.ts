// Importa as funções necessárias do SDK do Firebase
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Importa o Storage

// !! IMPORTANTE !!
// Substitua o objeto abaixo pelas chaves que você copiou do site do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC4NdhUIYF0wisLoQN11ZyUEhkg5gyNUdU",
  authDomain: "amelie-cafe-site.firebaseapp.com",
  projectId: "amelie-cafe-site",
  storageBucket: "amelie-cafe-site.firebasestorage.app",
  messagingSenderId: "761903129408",
  appId: "1:761903129408:web:f00341d873027b1932d0a5",
  measurementId: "G-M8ZYR466ZK",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Exporta os serviços do Firebase que usaremos no site
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Exporta o serviço de Storage

export { app, auth, db, storage };
