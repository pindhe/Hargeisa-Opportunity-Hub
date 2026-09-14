"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";

function Verify() {
  const params = useSearchParams();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setMessage("Missing verification token.");
      return;
    }
    api<{ message: string }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage(err.message));
  }, [params]);

  return <p className="rounded-3xl bg-white p-8 text-navy">{message}</p>;
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense>
        <Verify />
      </Suspense>
    </div>
  );
}
