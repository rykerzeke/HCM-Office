import { getCaseDetailAction } from "@/actions/case-actions";
import { CaseDetail } from "@/types/backend";
import Link from "next/link";
import CaseActionsPanel from "./case-actions-panel";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCaseDetailAction(id);

  if (result.status === "error") {
    return (
      <div>
        <Link href="/cases">&larr; Back to cases</Link>
        <h1>Case Detail</h1>
        <p style={{ color: "red" }}>{result.message}</p>
      </div>
    );
  }

  const c = result.data as CaseDetail;

  return (
    <div>
      <Link href="/cases">&larr; Back to cases</Link>
      <h1 style={{ marginTop: 8 }}>Case {c.caseId}</h1>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          <h3>Details</h3>
          <dl style={{ lineHeight: 2 }}>
            <dt style={{ fontWeight: 600 }}>Status</dt>
            <dd>{c.status}</dd>
            <dt style={{ fontWeight: 600 }}>Priority</dt>
            <dd>{c.priority}</dd>
            <dt style={{ fontWeight: 600 }}>Category</dt>
            <dd>{c.category ?? "—"}</dd>
            <dt style={{ fontWeight: 600 }}>Purpose</dt>
            <dd>{c.purpose}</dd>
            <dt style={{ fontWeight: 600 }}>Referring Officer</dt>
            <dd>{c.referringOfficer ?? "—"}</dd>
            <dt style={{ fontWeight: 600 }}>Reference Mode</dt>
            <dd>{c.referenceMode ?? "—"}</dd>
          </dl>
        </div>
        <div>
          <h3>Citizen</h3>
          <dl style={{ lineHeight: 2 }}>
            <dt style={{ fontWeight: 600 }}>Name</dt>
            <dd>{c.citizen.name}</dd>
            <dt style={{ fontWeight: 600 }}>Phone</dt>
            <dd>{c.citizen.phone}</dd>
            <dt style={{ fontWeight: 600 }}>Address</dt>
            <dd>{c.citizen.address ?? "—"}</dd>
          </dl>
        </div>
      </section>

      {c.scheduledDate && (
        <section style={{ marginTop: 24 }}>
          <h3>Schedule</h3>
          <p>Date: {new Date(c.scheduledDate).toLocaleDateString()}</p>
          <p>Time Slot: {c.scheduledTimeSlot ?? "—"}</p>
          <p>Type: {c.meetingType ?? "—"}</p>
          <p>Venue / Link: {c.venueOrLink ?? "—"}</p>
          {c.visitCheckIn && <p>Check-in: {c.visitCheckIn}</p>}
        </section>
      )}

      {c.closureStatus && (
        <section style={{ marginTop: 24 }}>
          <h3>Closure</h3>
          <p>Status: {c.closureStatus}</p>
          <p>Notes: {c.closureNotes ?? "—"}</p>
          <p>Summary: {c.meetingSummary ?? "—"}</p>
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h3>Assignments ({c.assignments.length})</h3>
        {c.assignments.length === 0 ? (
          <p>No assignments yet.</p>
        ) : (
          <ul>
            {c.assignments.map((a) => (
              <li key={a.id}>
                {a.user.name} &mdash; {a.status}
                {a.notes ? ` (${a.notes})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Audit Log ({c.auditLogs.length})</h3>
        {c.auditLogs.length === 0 ? (
          <p>No audit entries.</p>
        ) : (
          <ul style={{ fontSize: 13, lineHeight: 1.8 }}>
            {c.auditLogs.map((log) => (
              <li key={log.id}>
                <strong>{log.action}</strong> by {log.user?.name ?? "system"} on{" "}
                {new Date(log.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <CaseActionsPanel caseId={c.id} currentStatus={c.status} />
    </div>
  );
}
