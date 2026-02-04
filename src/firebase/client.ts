import { initializeApp, getApps } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore } from "firebase/firestore";

type FirebaseClient = {
  functions: ReturnType<typeof getFunctions>;
  db: ReturnType<typeof getFirestore>;
};

export function getFirebaseClient(): FirebaseClient {
  const app =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        });

  const functions = getFunctions(app);
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }

  return {
    functions,
    db: getFirestore(app)
  };
}
