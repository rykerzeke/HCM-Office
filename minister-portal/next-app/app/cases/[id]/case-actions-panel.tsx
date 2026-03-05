"use client";

import { useState, useTransition } from "react";
import {
  authorizeCaseAction,
  scheduleCaseAction,
  checkinCaseAction,
  closeCaseAction,
} from "@/actions/case-actions";
import {
  createAssignmentAction,
  updateCaseStatusAction,
} from "@/actions/assignment-actions";
import type { CaseStatus, ManualCaseStatus } from "@/types/backend";

export default function CaseActionsPanel({
  caseId,
  currentStatus,
}: {
  caseId: string;
  currentStatus: CaseStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function run(action: () => Promise<{ status: string; message: string }>) {
    setMessage(null);
    startTransition(async () => {
      const res = await action();
      setMessage({ text: res.message, ok: res.status === "success" });
    });
  }

  const sectionStyle: React.CSSProperties = {
    marginTop: 24,
    padding: 16,
    border: "1px solid #ddd",
    borderRadius: 8,
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Actions</h2>

      {message && (
        <p style={{ color: message.ok ? "green" : "red", fontWeight: 600 }}>
          {message.text}
        </p>
      )}

      {/* Authorization */}
      {(currentStatus === "PENDING_APPROVAL" || currentStatus === "ON_HOLD") && (
        <div style={sectionStyle}>
          <h3>Authorization</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button disabled={isPending} onClick={() => run(() => authorizeCaseAction(caseId, { action: "APPROVE" }))}>
              Approve
            </button>
            <button disabled={isPending} onClick={() => run(() => authorizeCaseAction(caseId, { action: "REJECT", rejectionReason: "Rejected via BFF" }))}>
              Reject
            </button>
            <button disabled={isPending} onClick={() => run(() => authorizeCaseAction(caseId, { action: "REQUEST_CLARIFICATION" }))}>
              Request Clarification
            </button>
            <button disabled={isPending} onClick={() => run(() => authorizeCaseAction(caseId, { action: "RESOLVE_WITHOUT_MEETING", resolutionNotes: "Resolved without meeting" }))}>
              Resolve Without Meeting
            </button>
          </div>
        </div>
      )}

      {/* Scheduling */}
      {currentStatus === "APPROVED" && (
        <div style={sectionStyle}>
          <h3>Schedule Meeting</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              run(() =>
                scheduleCaseAction(caseId, {
                  scheduledDate: fd.get("date") as string,
                  scheduledTimeSlot: fd.get("timeSlot") as string,
                  meetingType: fd.get("meetingType") as "IN_PERSON" | "VIRTUAL",
                  venueOrLink: (fd.get("venue") as string) || undefined,
                })
              );
            }}
          >
            <div style={{ display: "grid", gap: 8, maxWidth: 400 }}>
              <label>Date <input name="date" type="date" required /></label>
              <label>Time Slot <input name="timeSlot" placeholder="10:00-10:30" required /></label>
              <label>
                Type{" "}
                <select name="meetingType">
                  <option value="IN_PERSON">In Person</option>
                  <option value="VIRTUAL">Virtual</option>
                </select>
              </label>
              <label>Venue / Link <input name="venue" /></label>
              <button type="submit" disabled={isPending}>Schedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Visit check-in */}
      {currentStatus === "SCHEDULED" && (
        <div style={sectionStyle}>
          <h3>Visit Day Check-In</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button disabled={isPending} onClick={() => run(() => checkinCaseAction(caseId, { checkIn: "ARRIVED" }))}>
              Arrived
            </button>
            <button disabled={isPending} onClick={() => run(() => checkinCaseAction(caseId, { checkIn: "NO_SHOW" }))}>
              No Show
            </button>
            <button disabled={isPending} onClick={() => run(() => checkinCaseAction(caseId, { checkIn: "RESCHEDULED" }))}>
              Rescheduled
            </button>
          </div>
        </div>
      )}

      {/* Closure */}
      {["SCHEDULED", "NO_SHOW", "RESCHEDULED", "APPROVED", "FOLLOW_UP_REQUIRED"].includes(currentStatus) && (
        <div style={sectionStyle}>
          <h3>Close Case</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              run(() =>
                closeCaseAction(caseId, {
                  closureStatus: fd.get("closureStatus") as "COMPLETED" | "FOLLOW_UP_REQUIRED" | "RESCHEDULE_REQUIRED",
                  closureNotes: (fd.get("closureNotes") as string) || undefined,
                  meetingSummary: (fd.get("meetingSummary") as string) || undefined,
                })
              );
            }}
          >
            <div style={{ display: "grid", gap: 8, maxWidth: 400 }}>
              <label>
                Closure Status{" "}
                <select name="closureStatus">
                  <option value="COMPLETED">Completed</option>
                  <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                  <option value="RESCHEDULE_REQUIRED">Reschedule Required</option>
                </select>
              </label>
              <label>Notes <textarea name="closureNotes" rows={2} /></label>
              <label>Meeting Summary <textarea name="meetingSummary" rows={2} /></label>
              <button type="submit" disabled={isPending}>Close Case</button>
            </div>
          </form>
        </div>
      )}

      {/* Assign */}
      <div style={sectionStyle}>
        <h3>Create Assignment</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() =>
              createAssignmentAction(caseId, {
                userId: fd.get("userId") as string,
                notes: (fd.get("notes") as string) || undefined,
              })
            );
          }}
        >
          <div style={{ display: "grid", gap: 8, maxWidth: 400 }}>
            <label>User ID (UUID) <input name="userId" required /></label>
            <label>Notes <input name="notes" /></label>
            <button type="submit" disabled={isPending}>Assign</button>
          </div>
        </form>
      </div>

      {/* Manual status override */}
      <div style={sectionStyle}>
        <h3>Manual Status Override</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(() => updateCaseStatusAction(caseId, fd.get("status") as ManualCaseStatus));
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <select name="status">
              {[
                "PENDING_APPROVAL", "APPROVED", "ON_HOLD", "SCHEDULED",
                "NO_SHOW", "RESCHEDULED", "FOLLOW_UP_REQUIRED", "RESCHEDULE_REQUIRED",
              ].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="submit" disabled={isPending}>Update Status</button>
          </div>
        </form>
      </div>
    </div>
  );
}
