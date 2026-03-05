"use client";

import { useTransition } from "react";
import { deleteExampleAction } from "@/actions/example-actions";

export default function ExampleDeleteButtonClient({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await deleteExampleAction(id);
        });
      }}
      style={{ color: "red", cursor: "pointer", background: "none", border: "1px solid red", borderRadius: 4, padding: "2px 8px" }}
    >
      {isPending ? "..." : "Delete"}
    </button>
  );
}
