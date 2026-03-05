import { getAllExamplesAction } from "@/actions/example-actions";
import { SelectExample } from "@/db/schema/example-schema";
import ExampleForm from "./example-form";
import ExampleDeleteButtonClient from "./example-delete-button";

export default async function ExamplesPage() {
  const result = await getAllExamplesAction();

  const examples: SelectExample[] =
    result.status === "success" ? (result.data as SelectExample[]) : [];

  return (
    <div>
      <h1>Examples (Drizzle CRUD Playground)</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        This page talks directly to Supabase via Drizzle ORM &mdash; it does NOT
        call Fastify. Use it to verify the Drizzle + Server Actions pipeline.
      </p>

      {result.status === "error" && (
        <p style={{ color: "red" }}>
          {result.message} &mdash; make sure DATABASE_URL is set in .env.local
        </p>
      )}

      <ExampleForm />

      <h2 style={{ marginTop: 32 }}>All Examples ({examples.length})</h2>
      {examples.length === 0 ? (
        <p>No examples yet. Create one above.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 8 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Age</th>
              <th style={{ padding: 8 }}>Email</th>
              <th style={{ padding: 8 }}>Created</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {examples.map((ex) => (
              <tr key={ex.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8, fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>
                  {ex.id.slice(0, 8)}...
                </td>
                <td style={{ padding: 8 }}>{ex.name}</td>
                <td style={{ padding: 8 }}>{ex.age}</td>
                <td style={{ padding: 8 }}>{ex.email}</td>
                <td style={{ padding: 8 }}>{ex.createdAt.toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>
                  <ExampleDeleteButtonClient id={ex.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
