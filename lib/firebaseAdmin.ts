// lib/firebaseAdmin.ts
import admin from "firebase-admin";

let app: admin.app.App;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    console.error("ENV CHECK:", {
      projectId,
      clientEmail,
      hasPrivateKey: !!privateKey,
      databaseURL,
    });
    throw new Error(
      "Firebase Admin env vars missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DATABASE_URL."
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL,
  });
} else {
  app = admin.app();
}

export const adminDb = app.database();
