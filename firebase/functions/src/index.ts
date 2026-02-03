import { onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";

import { createBooking, cancelBooking, completeBooking } from "./bookings";
import { resolveExpiredBookings } from "./jobs";

initializeApp();

export const create_booking = onCall(createBooking);
export const cancel_booking = onCall(cancelBooking);
export const complete_booking = onCall(completeBooking);
// Cron job: auto-resolve bookings after decisionDeadline.
export const resolve_expired_bookings = onSchedule("every 5 minutes", async (event) => {
  const res = await resolveExpiredBookings(event);
  console.log("resolve_expired_bookings:", res);
});

// Manual trigger (optional): useful for testing from a client.
export const resolve_expired_bookings_call = onCall(resolveExpiredBookings);
