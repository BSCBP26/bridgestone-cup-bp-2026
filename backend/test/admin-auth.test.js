import assert from "node:assert/strict";
import test from "node:test";
import { createAuthenticateAdmin, requireAdminRole } from "../src/middleware/admin-auth.js";

function fakeClient({ user, userError = null, profile, profileError = null }) {
  const query = {
    select() { return this; },
    eq() { return this; },
    async single() { return { data: profile, error: profileError }; },
  };
  return {
    auth: { async getUser() { return { data: { user }, error: userError }; } },
    from() { return query; },
  };
}

function invoke(middleware, request) {
  return new Promise(resolve => middleware(request, {}, error => resolve(error)));
}

test("admin authentication verifies the token and attaches an active profile", async () => {
  const request = { headers: { authorization: "Bearer valid-token" } };
  const profile = {
    id: "user-1",
    display_name: "Admin Test",
    role: "super_admin",
    sport_id: null,
    is_active: true,
  };
  const middleware = createAuthenticateAdmin(() => fakeClient({
    user: { id: "user-1", email: "admin@example.test" },
    profile,
  }));

  const error = await invoke(middleware, request);

  assert.equal(error, undefined);
  assert.equal(request.authUser.id, "user-1");
  assert.deepEqual(request.admin, profile);
});

test("admin authentication rejects invalid tokens and inactive profiles", async () => {
  const invalidMiddleware = createAuthenticateAdmin(() => fakeClient({
    user: null,
    userError: new Error("invalid"),
    profile: null,
  }));
  const invalidError = await invoke(invalidMiddleware, {
    headers: { authorization: "Bearer invalid-token" },
  });

  const inactiveMiddleware = createAuthenticateAdmin(() => fakeClient({
    user: { id: "user-2" },
    profile: { id: "user-2", role: "sport_admin", sport_id: "sport-futsal", is_active: false },
  }));
  const inactiveError = await invoke(inactiveMiddleware, {
    headers: { authorization: "Bearer valid-token" },
  });

  assert.equal(invalidError.statusCode, 401);
  assert.equal(inactiveError.statusCode, 403);
});

test("role middleware allows only configured admin roles", async () => {
  const middleware = requireAdminRole("super_admin");
  const allowed = await invoke(middleware, { admin: { role: "super_admin" } });
  const denied = await invoke(middleware, { admin: { role: "sport_admin" } });

  assert.equal(allowed, undefined);
  assert.equal(denied.statusCode, 403);
  assert.equal(denied.message, "Insufficient admin permission");
});
