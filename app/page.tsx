"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(window.localStorage.getItem("role"));
  }, []);

  function choose(nextRole: "customer" | "provider") {
    window.localStorage.setItem("role", nextRole);
    setRole(nextRole);
    if (nextRole === "provider") router.push("/provider");
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-semibold">Flake</h1>
      <p className="mt-2 text-base text-neutral-700">
        Project scaffold is ready.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => choose("customer")}
          type="button"
        >
          I am a Customer
        </button>
        <button
          className="rounded bg-white px-4 py-2 text-black ring-1 ring-black/20"
          onClick={() => choose("provider")}
          type="button"
        >
          I am a Provider
        </button>
      </div>

      {role && (
        <p className="mt-4 text-sm text-neutral-600">
          Current role: <span className="font-medium">{role}</span>
        </p>
      )}
    </main>
  );
}
