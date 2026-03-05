"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth-actions";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction({
        email: fd.get("email") as string,
        password: fd.get("password") as string,
      });
      if (result.status === "error") {
        setError(result.message);
      } else {
        router.push("/cases");
      }
    });
  }

  return (
    <div style={{ maxWidth: 360, margin: "40px auto" }}>
      <h1>Login</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Authenticates against the Fastify backend and stores a JWT cookie.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            Email
            <input name="email" type="email" required style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <label>
            Password
            <input name="password" type="password" required style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
          </label>
          <button type="submit" disabled={isPending} style={{ padding: "8px 16px" }}>
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}
