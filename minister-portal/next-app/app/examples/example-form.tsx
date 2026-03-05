"use client";

import { useState, useTransition } from "react";
import { createExampleAction } from "@/actions/example-actions";

export default function ExampleForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const result = await createExampleAction({
        name: fd.get("name") as string,
        age: Number(fd.get("age")),
        email: fd.get("email") as string,
      });
      setMessage({ text: result.message, ok: result.status === "success" });
      if (result.status === "success") form.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <h2>Create Example</h2>
      {message && (
        <p style={{ color: message.ok ? "green" : "red" }}>{message.text}</p>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        <label>Name <input name="name" required /></label>
        <label>Age <input name="age" type="number" required /></label>
        <label>Email <input name="email" type="email" required /></label>
        <button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
