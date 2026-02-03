import type { Booking, Provider } from "./types";

type Repository = {
  bookings: Map<string, Booking>;
  providers: Map<string, Provider>;
};

const repo: Repository = {
  bookings: new Map(),
  providers: new Map()
};

export function getRepo(): Repository {
  return repo;
}

export function saveProvider(provider: Provider): void {
  repo.providers.set(provider.id, provider);
}

export function saveBooking(booking: Booking): void {
  repo.bookings.set(booking.id, booking);
}

export function getProvider(providerId: string): Provider | undefined {
  return repo.providers.get(providerId);
}

export function listProviders(): Provider[] {
  return Array.from(repo.providers.values());
}

export function getBooking(bookingId: string): Booking | undefined {
  return repo.bookings.get(bookingId);
}

export function listBookings(): Booking[] {
  return Array.from(repo.bookings.values());
}
