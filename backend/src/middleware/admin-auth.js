import { getSupabaseAdminClient } from "../config/supabase.js";
import { AppError } from "../shared/app-error.js";

function bearerToken(header) {
  if (typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function createAuthenticateAdmin(clientProvider = getSupabaseAdminClient) {
  return async function authenticateAdmin(request, _response, next) {
    try {
      const token = bearerToken(request.headers.authorization);
      if (!token) throw new AppError(401, "A valid Bearer token is required");

      const client = clientProvider();
      const { data: userData, error: userError } = await client.auth.getUser(token);
      if (userError || !userData?.user) throw new AppError(401, "Invalid or expired access token");

      const { data: profile, error: profileError } = await client
        .from("admin_profiles")
        .select("id, display_name, role, sport_id, is_active")
        .eq("id", userData.user.id)
        .single();

      if (profileError || !profile) throw new AppError(403, "Admin access is not assigned");
      if (!profile.is_active) throw new AppError(403, "Admin account is inactive");

      request.authUser = userData.user;
      request.admin = profile;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const authenticateAdmin = createAuthenticateAdmin();

export function requireAdminRole(...allowedRoles) {
  return function authorizeRole(request, _response, next) {
    if (!request.admin || !allowedRoles.includes(request.admin.role)) {
      next(new AppError(403, "Insufficient admin permission"));
      return;
    }
    next();
  };
}
