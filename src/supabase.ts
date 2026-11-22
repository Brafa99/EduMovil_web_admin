import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jjjvnaczvtmxkpbyivfh.supabase.co";
const supabaseKey = "sb_publishable_rdO-QTako2G2QN_lScggXA_U70AL2mx";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan las variables de entorno de Supabase");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);