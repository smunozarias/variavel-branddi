import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx";

/* lê planilha */
export async function parseExcel(file) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets["insights list"] || wb.Sheets[wb.SheetNames[0]];

  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

/* salva no Supabase */
export async function saveDataset(title, dealsRows, activitiesRows) {
  // cria dataset
  const { data: dataset, error } = await supabase
    .from("datasets")
    .insert([{ title }])
    .select()
    .single();

  if (error) throw error;

  // salva deals
  if (dealsRows?.length) {
    const payload = dealsRows.map((r) => ({
      dataset_id: dataset.id,
      owner: r["Negócio - Proprietário"],
      org_name: r["Organização - Nome"],
      deal_value: Number(r["Negócio - Valor do negócio"] || 0),
      sdr: r["Negócio - SDR"],
    }));

    await supabase.from("deals_rows").insert(payload);
  }

  // salva activities
  if (activitiesRows?.length) {
    const payload = activitiesRows.map((r) => ({
      dataset_id: dataset.id,
      sdr: r["Negócio - SDR"],
      org_name: r["Organização - Nome"],
      total: Number(r["Soma TOTAL"] || 0),
    }));

    await supabase.from("activities_rows").insert(payload);
  }

  return dataset.id;
}
