import { env } from "../../config/env.js";

export function getPublicConfig(_request, response) {
  response.status(200).json({ success: true, data: {
    supabaseUrl: env.supabaseUrl || null,
    supabasePublishableKey: env.supabasePublishableKey || null,
  }});
}
