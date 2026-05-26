const { createClient } = require("@supabase/supabase-js");
const { getRequired } = require("../config/env");

let supabase = null;

function getSupabase() {
  if (supabase) return supabase;

  const url = getRequired("SUPABASE_URL");
  const key = getRequired("SUPABASE_ANON_KEY");

  supabase = createClient(url, key);
  return supabase;
}

async function saveAnalysis(record) {
  const client = getSupabase();
  const { data, error } = await client
    .from("stock_analyses")
    .insert(record)
    .select()
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data;
}

async function getAnalysisHistory(limit = 20) {
  const client = getSupabase();
  const { data, error } = await client
    .from("stock_analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data;
}

module.exports = { saveAnalysis, getAnalysisHistory };
