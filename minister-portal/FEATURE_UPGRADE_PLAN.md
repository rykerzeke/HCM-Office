# Minister Portal – Feature Upgrade Plan

This document maps the **current implementation** to your **target architecture** and lists required changes: what exists, what to upgrade, and what to build.

---

## 1. User Roles & Access Levels

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Public: Register/login via OTP/mobile/email** | Email+password only; no public “register”; `/book` is anonymous | **Add:** OTP/mobile/email auth for citizens; optional citizen account for tracking |
| **Public: Submit meeting request** | ✅ Public `/book` and staff “New Case” | Keep; extend forms (see below) |
| **Public: Category, details, documents, urgency, track, SMS/email** | Partial (see Sections 2–4) | Upgrade forms + add notifications |
| **Admin: PS / APS / Additional PS / Staff** | Roles: ADMIN, STAFF, OFFICIAL; no PS/APS distinction | **Add:** Role granularity (e.g. PS, APS) and route-level RBAC |

---

## 2. Workflow Logic

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Step 1: Request + documents** | Request + purpose; file upload on case detail after create | **Upgrade:** Allow document upload at submission (public + admin); add category & urgency to form |
| **Step 2: Office review (Approve / More info / Reject / Resolve without meeting)** | ✅ Approve, Reject, Request clarification | **Add:** “Resolve without meeting” path (new status or flag + closure) |
| **Step 3: Schedule + notify** | ✅ Schedule date/time/slot/type/venue; close workflow | **Add:** SMS/email on schedule (and other events) |
| **Step 4: Post-meeting (summary, action, priority, responsible authority)** | ✅ Closure status + notes; assignments exist | **Upgrade:** Structured “meeting summary”, “action required”, “responsible authority” fields; link to task/assignment |

---

## 3. Task Assignment & Resolution System

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Create tasks from meeting** | Case-level assignments (user + notes); no separate Task entity | **Add:** Optional `Task` model (or formalize Assignment with dueDate, status) |
| **Assign to officer/department** | ✅ Assign case to user; stakeholders = officials | **Upgrade:** Assignment UI in case detail (assign user, set priority, due date); optional “department” |
| **Tag authority to contact** | ✅ Stakeholders = officials linked to case | Keep; add “suggested authority” (see Section 4) |
| **Follow-up deadlines** | Not in schema | **Add:** `dueDate` on Assignment (or Task) |
| **Task status (Pending / In progress / Awaiting response / Resolved / Closed)** | Case status covers lifecycle; assignment has no status | **Add:** Assignment/Task status enum and transitions |
| **Notes and updates** | ✅ Comments on case | Keep; optionally allow “assignment-level” notes |

---

## 4. Authority & Contact Mapping

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Database of officials & departments** | ✅ Officials (name, designation, department, contact, etc.); State/District | Keep |
| **Contact details** | ✅ Stored on Official | Keep |
| **Link issue types to departments** | Not present | **Add:** Category/issue-type → department mapping (config or DB) |
| **Suggested authority by category** | Not present | **Add:** Recommend officials by category + district/state (e.g. Road → Municipal; Pension → Social Welfare) |

---

## 5. Document Upload & OCR

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Images, PDF, Word, Excel** | ✅ Multipart upload; stored in `uploads/`; File model | **Upgrade:** Enforce allowed types; optional size limits |
| **OCR and extract (names, addresses, file numbers, etc.)** | Not implemented | **Add:** Server-side OCR (e.g. Tesseract or cloud API); store extracted text/metadata on File or new DocumentExtract model |
| **Highlight extracted entities / search inside files** | Not implemented | **Add:** Document viewer UI that shows OCR text and highlights; search over extracted text |

---

## 6. Meeting & Task Dashboard

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Upcoming meetings** | Not on dashboard | **Add:** Widget listing cases with `status=SCHEDULED` and `scheduledDate` ≥ today, ordered by date |
| **Pending requests** | Aggregated in “Pending Tasks” only | **Upgrade:** Widget for PENDING_APPROVAL / ON_HOLD; align dashboard stats with current workflow statuses |
| **Tasks needing follow-up** | Not on dashboard | **Add:** Widget for FOLLOW_UP_REQUIRED / RESCHEDULE_REQUIRED or assignments with due date |
| **High priority cases** | Not on dashboard | **Add:** Widget for priority HIGH/URGENT |
| **Recently resolved** | “Recent Activity” list exists | **Upgrade:** Ensure it includes CLOSED/COMPLETED with current schema |
| **Task view (citizen, meeting notes, docs, authority, call/letter history, timeline)** | Case detail has tabs (Overview, Stakeholders, Comments, Documents, Audit) | **Upgrade:** Add “Calls/letters” log; ensure document list has open/download link; timeline from audit + status |

---

## 7. Communication & Follow-up Tools

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Log calls, letters, emails, meeting notes, response** | Comments only; no type (call/letter/email) | **Add:** Communication log model (type, direction, summary, date, userId) and UI to add/list |
| **Official letters / reminders** | Not implemented | **Add:** Templates + generation (e.g. PDF); optional queue for reminders |
| **SMS/email alerts** | None | **Add:** Notification service (e.g. Twilio/SendGrid) and event hooks (status change, scheduled, reminder, resolved) |

---

## 8. Notifications & Alerts

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Citizen: request received, approved/rejected, reminder, resolved** | None | **Add:** Notification service + templates; trigger on case events |
| **Admin: pending follow-ups, overdue tasks, urgent grievances** | None | **Add:** In-app alerts or email digest; base on due dates and priority |

---

## 9. Security & Compliance

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Role-based access** | JWT; roles in DB; no route-level checks (e.g. PS-only) | **Add:** Middleware or per-route checks by role (ADMIN/PS/APS/STAFF) |
| **Data encryption** | ✅ Aadhaar encrypted at rest | Keep |
| **Audit trail** | ✅ AuditLog for key actions | **Upgrade:** Ensure all state-changing actions logged; optional export |
| **Aadhaar masking** | Stored encrypted; no masking in API response | **Add:** Mask in API (e.g. show last 4 only) and in UI |
| **Secure document storage** | Files on disk under `uploads/` | **Review:** Access control (auth), path traversal, and optional encryption for sensitive docs |

---

## 10. UI Modules – Citizen Portal

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Meeting request form** | ✅ `/book` and staff New Case | **Upgrade:** Add category, urgency, document upload at submit |
| **Upload documents** | Only after case exists (admin) | **Add:** Public upload at submission (multipart with case create or temp upload) |
| **Status tracking** | ✅ Track by Case ID/phone on `/book` | Keep; add SMS/email with link |

---

## 11. UI Modules – Admin Portal

| Requirement | Current State | Action |
|-------------|----------------|--------|
| **Request management** | ✅ Case list + detail + workflow | Keep; add filters for “pending approval”, “follow-up” |
| **Meeting scheduler** | ✅ Schedule step on case detail | Keep |
| **Task assignment** | Backend only; no “Assign” form | **Add:** Assign user + due date + priority from case detail |
| **Document viewer & OCR panel** | Documents list; no viewer/OCR | **Add:** View/download link; OCR result panel and search |
| **Authority contact manager** | Stakeholders tab + officials | **Add:** Dedicated screen to manage officials/departments and category→authority mapping |
| **Follow-up tracker** | No dedicated view | **Add:** Page or widget listing follow-up/reschedule cases and overdue assignments |
| **Reports & analytics** | Cases by status, officer workload; export placeholders | **Upgrade:** Implement PDF/Excel export; add charts (e.g. by category, by time, SLA) |

---

## 12. Schema & API Changes (Summary)

| Area | Suggested schema/API changes |
|------|-----------------------------|
| **Case** | Add `category` (e.g. grievance/policy/personal), `resolvedWithoutMeeting` (boolean or status); optional `meetingSummary`, `actionRequired`, `responsibleAuthorityId`. |
| **Citizen** | Optional `email`; consider OTP/verification fields if citizen login added. |
| **Assignment / Task** | Add `dueDate`, `status` (e.g. PENDING, IN_PROGRESS, AWAITING_RESPONSE, RESOLVED, CLOSED). |
| **File / Document** | Optional `extractedText` or new table for OCR results; `category` or tags for search. |
| **Communication** | New model: e.g. `CommunicationLog` (caseId, type=CALL|LETTER|EMAIL, direction, summary, date, userId). |
| **User** | Optional `roleDetail` (PS/APS/Additional PS) or new enum. |
| **Config** | Category → department/official mapping (table or config). |

---

## 13. Recommended Implementation Order

**Phase 1 – Align with current workflow and UX**  
1. Add **category** and **urgency** to case (schema + public + admin forms).  
2. Add **“Resolve without meeting”** in office review.  
3. **Dashboard:** Upcoming meetings, pending requests, follow-up/overdue widgets; align stats with workflow statuses.  
4. **Case detail:** Assignment UI (assign user, priority, due date); document download link; optional communication log (calls/letters).

**Phase 2 – Tasks and authority**  
5. **Assignment:** Add `dueDate` and status; follow-up/overdue list.  
6. **Authority:** Category → department mapping and “suggested authority” on case.

**Phase 3 – Documents and notifications**  
7. **Documents:** Allowed types and size; upload at submission (public + admin).  
8. **OCR:** Backend pipeline + stored extracted text; simple viewer/search.  
9. **Notifications:** SMS/email service and triggers (request received, approved/rejected, scheduled, reminder, resolved).

**Phase 4 – Auth and compliance**  
10. **Citizen auth:** OTP/mobile or email login; optional.  
11. **RBAC:** Route-level checks for PS/APS/Staff.  
12. **Aadhaar masking** in API and UI; audit export.

**Phase 5 – Advanced**  
13. Letter generation and reminders.  
14. Reports: real PDF/Excel export and analytics.  
15. Full document search and entity highlighting.

---

## 14. What Is Already in Place (No Change Required)

- Meeting request submission (public and staff).  
- Approval workflow (approve / reject / request clarification).  
- Meeting scheduling (date, time, type, venue/link).  
- Visit check-in (Arrived / No-show / Rescheduled).  
- Post-meeting closure (Completed / Follow-up / Reschedule).  
- States and districts (full lists for major states).  
- Referring officer and reference mode.  
- Citizens with encrypted Aadhaar.  
- Officials and stakeholders linked to cases.  
- Assignments (backend); comments; file upload; audit log.  
- Case list with search and filters; case detail with tabs.  
- Reports (in-memory); dashboard stats and recent activity.  
- Public tracking by Case ID/phone.

Use this plan to prioritise features and estimate effort for each phase.
