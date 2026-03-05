import { listCasesAction } from "@/actions/case-actions";
import { PaginatedCases } from "@/types/backend";
import Link from "next/link";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const result = await listCasesAction({
    page: params.page ? Number(params.page) : 1,
    limit: 10,
    status: params.status as PaginatedCases["data"][number]["status"] | undefined,
    search: params.search,
  });

  if (result.status === "error") {
    return (
      <div>
        <h1>Cases</h1>
        <p style={{ color: "red" }}>{result.message}</p>
        <p style={{ color: "#666", fontSize: 14 }}>
          Make sure the Fastify backend is running and BACKEND_API_URL is set in .env.local
        </p>
      </div>
    );
  }

  const { data: cases, meta } = result.data as PaginatedCases;

  return (
    <div>
      <h1>Cases</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Page {meta.page} of {meta.totalPages} &middot; {meta.total} total cases
      </p>

      {cases.length === 0 ? (
        <p>No cases found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: 8 }}>Case ID</th>
              <th style={{ padding: 8 }}>Citizen</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Priority</th>
              <th style={{ padding: 8 }}>Category</th>
              <th style={{ padding: 8 }}>Created</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8, fontFamily: "var(--font-geist-mono)" }}>{c.caseId}</td>
                <td style={{ padding: 8 }}>{c.citizen.name}</td>
                <td style={{ padding: 8 }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    background: c.status === "CLOSED" ? "#e8f5e9" : c.status === "REJECTED" ? "#ffebee" : "#e3f2fd",
                    color: c.status === "CLOSED" ? "#2e7d32" : c.status === "REJECTED" ? "#c62828" : "#1565c0",
                  }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: 8 }}>{c.priority}</td>
                <td style={{ padding: 8 }}>{c.category ?? "—"}</td>
                <td style={{ padding: 8 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>
                  <Link href={`/cases/${c.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        {meta.page > 1 && (
          <Link href={`/cases?page=${meta.page - 1}`}>Previous</Link>
        )}
        {meta.page < meta.totalPages && (
          <Link href={`/cases?page=${meta.page + 1}`}>Next</Link>
        )}
      </div>
    </div>
  );
}
