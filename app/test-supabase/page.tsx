import { supabase } from "@/lib/supabase";

export default async function TestSupabasePage() {
  const { data: partidos, error } = await supabase
    .from("partidos")
    .select("*");

  if (error) {
    return (
      <main style={{ padding: "40px", color: "white", background: "#020617" }}>
        <h1>Error conectando con Supabase</h1>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", color: "white", background: "#020617" }}>
      <h1>Test Supabase</h1>

      <pre>{JSON.stringify(partidos, null, 2)}</pre>
    </main>
  );
}