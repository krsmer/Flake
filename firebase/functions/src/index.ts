import { onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { createBooking, cancelBooking, completeBooking } from "./bookings.js";
import { resolveExpiredBookings } from "./jobs.js";
import { createSlot } from "./slots.js";
import { createService } from "./services.js";

export const create_booking = onCall(createBooking);
export const cancel_booking = onCall(cancelBooking);
export const complete_booking = onCall(completeBooking);
export const create_slot = onCall(createSlot);
export const create_service = onCall(createService);
// Cron job: auto-resolve bookings after decisionDeadline.
export const resolve_expired_bookings = onSchedule("every 5 minutes", async (event) => {
  const res = await resolveExpiredBookings(event);
  console.log("resolve_expired_bookings:", res);
});

// Manual trigger (optional): useful for testing from a client.
export const resolve_expired_bookings_call = onCall(resolveExpiredBookings);
