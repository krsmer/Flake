import { getFirestore } from "firebase-admin/firestore";

export const db = getFirestore();

export const collections = {
  bookings: () => db.collection("bookings"),
  providers: () => db.collection("providers"),
  services: () => db.collection("services")
};

