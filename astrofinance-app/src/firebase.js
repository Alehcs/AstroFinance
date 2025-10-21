import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDP79_8mKEDJ_M8l6oPunX1_s2fpHTuDT8",
  authDomain: "astrofinanceapp.firebaseapp.com",
  projectId: "astrofinanceapp",
  storageBucket: "astrofinanceapp.firebasestorage.app",
  messagingSenderId: "139391863241",
  appId: "1:139391863241:web:fe63567db10bfa451f8018",
  measurementId: "G-VW9N0T1C34"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Exportar la app por si se necesita en otros lugares
export default app;
