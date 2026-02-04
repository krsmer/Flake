import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if (getApps().length === 0) {
    initializeApp();
}
export const db = getFirestore();
export const collections = {
    bookings: () => db.collection("bookings"),
    providers: () => db.collection("providers"),
    services: () => db.collection("services"),
    slots: () => db.collection("slots")
};
