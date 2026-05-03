import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Singleton pattern — safe for Next.js hot-reloads
let adminApp: App;
let adminDb: Firestore;

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    return initializeApp({
        credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replace escaped newlines that env files sometimes introduce
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export function getAdminDb(): Firestore {
    if (!adminDb) {
        adminApp = getAdminApp();
        adminDb = getFirestore(adminApp);
    }
    return adminDb;
}
