import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>HCM Minister Portal &mdash; Next.js BFF</h1>
      <p style={{ maxWidth: 600, lineHeight: 1.6 }}>
        This app acts as a Backend-for-Frontend layer. Server Actions call the
        existing Fastify API for all case/triage/assignment workflows. Drizzle is
        used only for auxiliary tables (see the Examples page).
      </p>
      <ul style={{ marginTop: 16, lineHeight: 2 }}>
        <li><Link href="/cases">Cases</Link> &mdash; list, view, triage, assign (calls Fastify)</li>
        <li><Link href="/examples">Examples</Link> &mdash; Drizzle CRUD playground (direct DB)</li>
      </ul>
    </div>
  );
}
