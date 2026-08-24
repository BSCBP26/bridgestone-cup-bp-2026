import { getSupabaseHealth } from "../../config/supabase.js";

export async function getHealth(_request, response) {
  const database = await getSupabaseHealth();
  response.status(200).json({
    success: true,
    message: "Bridgestone Cup API is running",
    data: {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database,
    },
  });
}
