import React, { useState } from "react";

export default function AppSupabase() {
  const [status, setStatus] = useState("Nenhum arquivo enviado ainda.");

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>✅ Upload Supabase Teste</h1>
      <p>Status: {status}</p>
    </div>
  );
}
