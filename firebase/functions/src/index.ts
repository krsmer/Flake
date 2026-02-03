import { onCall } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";

import { createBooking, cancelBooking, completeBooking } from "./bookings";
import { resolveExpiredBookings } from "./jobs";

initializeApp();

export const create_booking = onCall(createBooking);
export const cancel_booking = onCall(cancelBooking);
export const complete_booking = onCall(completeBooking);
export const resolve_expired_bookings = onCall(resolveExpiredBookings);
