"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProviderPage() {
  const router = useRouter();

  useEffect(() => {
    const role = window.localStorage.getItem("role");
    if (role !== "provider") {
      router.replace("/");
    }
  }, [router]);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">Provider</h1>
      <p className="mt-2 text-base text-neutral-700">
        Provider view scaffold.
      </p>
    </main>
  );
}
