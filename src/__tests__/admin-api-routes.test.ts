import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ============================================
// Mocks
// ============================================

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn(() => "127.0.0.1"),
  })),
}));

// Authorization mock
const mockRequireSuperAdminApi = vi.fn();
vi.mock("@/lib/auth/authorization", () => ({
  requireSuperAdminApi: (...args: unknown[]) => mockRequireSuperAdminApi(...args),
  requireSuperAdmin: vi.fn(),
  getUserRole: vi.fn(),
  canInviteRole: vi.fn(() => true),
}));

// Admin queries mock
const mockGetPlatformStats = vi.fn();
const mockGetAllOrganizations = vi.fn();
const mockGetAllUsers = vi.fn();
const mockGetAuditLogs = vi.fn();
const mockDeactivateOrganization = vi.fn();
const mockReactivateOrganization = vi.fn();
const mockDeactivateUser = vi.fn();

vi.mock("@/lib/queries/admin", () => ({
  getPlatformStats: (...args: unknown[]) => mockGetPlatformStats(...args),
  getAllOrganizations: (...args: unknown[]) => mockGetAllOrganizations(...args),
  getAllUsers: (...args: unknown[]) => mockGetAllUsers(...args),
  getAuditLogs: (...args: unknown[]) => mockGetAuditLogs(...args),
  deactivateOrganization: (...args: unknown[]) => mockDeactivateOrganization(...args),
  reactivateOrganization: (...args: unknown[]) => mockReactivateOrganization(...args),
  deactivateUser: (...args: unknown[]) => mockDeactivateUser(...args),
}));

// Audit mock
const mockLogAuditEvent = vi.fn();
vi.mock("@/lib/audit", () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
}));

// Service client mock
const mockServiceFrom = vi.fn();
const mockServiceInsert = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: (...args: unknown[]) => mockServiceFrom(...args),
  }),
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "sa-1", email: "admin@test.com" } },
      }),
    },
    from: (...args: unknown[]) => mockServiceFrom(...args),
  })),
}));

// Organization queries mock
const mockCreateInvite = vi.fn();
vi.mock("@/lib/queries/organization", () => ({
  createInvite: (...args: unknown[]) => mockCreateInvite(...args),
}));

// ============================================
// Helpers
// ============================================

const superAdminRole = {
  userId: "sa-1",
  organizationId: null,
  role: "admin" as const,
  isOwner: false,
  isSuperAdmin: true,
};

function createRequest(
  url: string,
  options?: { method?: string; body?: unknown }
): NextRequest {
  const init: { method: string; body?: string; headers?: Record<string, string> } = {
    method: options?.method ?? "GET",
  };
  if (options?.body) {
    init.body = JSON.stringify(options.body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

function createForbiddenError() {
  const err = new Error("Forbidden");
  (err as any).status = 403;
  return err;
}

function createUnauthorizedError() {
  const err = new Error("Unauthorized");
  (err as any).status = 401;
  return err;
}

// Helper for chainable Supabase queries
function createQueryChain(resolvedValue: unknown) {
  const chain: Record<string, any> = {};
  const methods = [
    "select", "eq", "neq", "in", "is", "or", "gte", "lte",
    "order", "limit", "update", "insert", "upsert", "not",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  // Make chain thenable
  chain.then = (resolve: any) => resolve(resolvedValue);
  return chain;
}

// ============================================
// Setup
// ============================================

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSuperAdminApi.mockResolvedValue(superAdminRole);
  mockLogAuditEvent.mockResolvedValue(undefined);
});

// ============================================
// GET /api/admin/stats
// ============================================

describe("GET /api/admin/stats", () => {
  it("returns platform stats", async () => {
    const stats = {
      totalOrganizations: 10,
      activeOrganizations: 8,
      totalUsers: 50,
      usersByRole: { admin: 5, nutri: 20, receptionist: 5, patient: 20 },
      totalPatients: 20,
      pendingInvites: 3,
    };
    mockGetPlatformStats.mockResolvedValue(stats);

    const { GET } = await import("@/app/api/admin/stats/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(stats);
    expect(mockRequireSuperAdminApi).toHaveBeenCalled();
  });

  it("returns 403 for non-super-admin", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createForbiddenError());

    const { GET } = await import("@/app/api/admin/stats/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Forbidden");
  });

  it("returns 401 for unauthenticated user", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createUnauthorizedError());

    const { GET } = await import("@/app/api/admin/stats/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });
});

// ============================================
// GET /api/admin/organizations
// ============================================

describe("GET /api/admin/organizations", () => {
  it("returns organizations list with meta", async () => {
    const orgs = [
      {
        id: "org-1",
        name: "Clinic A",
        slug: "clinic-a",
        is_active: true,
        owner: { full_name: "Dr. Smith", email: "smith@test.com" },
        memberCount: 5,
        patientCount: 3,
        created_at: "2024-01-01",
      },
    ];
    mockGetAllOrganizations.mockResolvedValue(orgs);

    const { GET } = await import("@/app/api/admin/organizations/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.meta.total).toBe(1);
    expect(json.data[0].name).toBe("Clinic A");
  });

  it("passes status and search filters", async () => {
    mockGetAllOrganizations.mockResolvedValue([]);

    const { GET } = await import("@/app/api/admin/organizations/route");
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations?status=active&search=clinic"
    );
    await GET(request);

    expect(mockGetAllOrganizations).toHaveBeenCalledWith({
      isActive: true,
      search: "clinic",
    });
  });

  it("returns 403 for non-super-admin", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createForbiddenError());

    const { GET } = await import("@/app/api/admin/organizations/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations");
    const response = await GET(request);

    expect(response.status).toBe(403);
  });
});

// ============================================
// POST /api/admin/organizations
// ============================================

describe("POST /api/admin/organizations", () => {
  it("creates organization and returns it", async () => {
    const orgData = {
      id: "org-new",
      name: "New Clinic",
      slug: "new-clinic",
      owner_id: "sa-1",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    };

    // First call: check slug uniqueness (not found)
    const slugCheckChain = createQueryChain({ data: null, error: { code: "PGRST116" } });
    // Second call: insert org
    const insertChain = createQueryChain({ data: orgData, error: null });
    // Third call: insert member
    const memberChain = createQueryChain({ data: null, error: null });

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return slugCheckChain;
      if (callCount === 2) return insertChain;
      return memberChain;
    });

    const { POST } = await import("@/app/api/admin/organizations/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations", {
      method: "POST",
      body: { name: "New Clinic", slug: "new-clinic" },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data.name).toBe("New Clinic");
    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "org.create",
        resourceType: "organization",
        userId: "sa-1",
      })
    );
  });

  it("rejects duplicate slug with 409", async () => {
    const slugCheckChain = createQueryChain({
      data: { id: "existing-org" },
      error: null,
    });

    mockServiceFrom.mockReturnValue(slugCheckChain);

    const { POST } = await import("@/app/api/admin/organizations/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations", {
      method: "POST",
      body: { name: "Dup Clinic", slug: "existing-slug" },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toContain("slug");
  });

  it("rejects missing name/slug with 400", async () => {
    const { POST } = await import("@/app/api/admin/organizations/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations", {
      method: "POST",
      body: { name: "Only Name" },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("rejects invalid slug format with 400", async () => {
    const { POST } = await import("@/app/api/admin/organizations/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations", {
      method: "POST",
      body: { name: "Test", slug: "Invalid Slug!" },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("Slug");
  });

  it("returns 403 for non-super-admin", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createForbiddenError());

    const { POST } = await import("@/app/api/admin/organizations/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations", {
      method: "POST",
      body: { name: "Test", slug: "test" },
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });
});

// ============================================
// PATCH /api/admin/organizations/[id]
// ============================================

describe("PATCH /api/admin/organizations/[id]", () => {
  it("deactivates organization", async () => {
    const orgChain = createQueryChain({
      data: {
        id: "org-1",
        name: "Clinic A",
        slug: "clinic-a",
        is_active: true,
        owner_id: "owner-1",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
      error: null,
    });
    mockServiceFrom.mockReturnValue(orgChain);
    mockDeactivateOrganization.mockResolvedValue(undefined);

    const { PATCH } = await import("@/app/api/admin/organizations/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations/org-1", {
      method: "PATCH",
      body: { is_active: false },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "org-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.is_active).toBe(false);
    expect(mockDeactivateOrganization).toHaveBeenCalledWith("org-1");
  });

  it("reactivates organization", async () => {
    const orgChain = createQueryChain({
      data: {
        id: "org-1",
        name: "Clinic A",
        slug: "clinic-a",
        is_active: false,
        owner_id: "owner-1",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
      error: null,
    });
    mockServiceFrom.mockReturnValue(orgChain);
    mockReactivateOrganization.mockResolvedValue(undefined);

    const { PATCH } = await import("@/app/api/admin/organizations/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations/org-1", {
      method: "PATCH",
      body: { is_active: true },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "org-1" }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.is_active).toBe(true);
    expect(mockReactivateOrganization).toHaveBeenCalledWith("org-1");
  });

  it("returns 404 for non-existent organization", async () => {
    const orgChain = createQueryChain({
      data: null,
      error: { code: "PGRST116" },
    });
    mockServiceFrom.mockReturnValue(orgChain);

    const { PATCH } = await import("@/app/api/admin/organizations/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations/bad-id", {
      method: "PATCH",
      body: { is_active: false },
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "bad-id" }) });

    expect(response.status).toBe(404);
  });

  it("returns 400 for missing is_active", async () => {
    const { PATCH } = await import("@/app/api/admin/organizations/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/organizations/org-1", {
      method: "PATCH",
      body: {},
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "org-1" }) });

    expect(response.status).toBe(400);
  });
});

// ============================================
// GET /api/admin/organizations/[id]/members
// ============================================

describe("GET /api/admin/organizations/[id]/members", () => {
  it("returns member list with profiles", async () => {
    // First call: org exists
    const orgChain = createQueryChain({ data: { id: "org-1" }, error: null });
    // Second call: members with profiles
    const membersChain = createQueryChain({
      data: [
        {
          id: "member-1",
          role: "admin",
          status: "active",
          accepted_at: "2024-01-01",
          created_at: "2024-01-01",
          profiles: {
            id: "user-1",
            full_name: "Dr. Smith",
            email: "smith@test.com",
            is_active: true,
          },
        },
      ],
      error: null,
    });

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return orgChain;
      return membersChain;
    });

    const { GET } = await import(
      "@/app/api/admin/organizations/[id]/members/route"
    );
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations/org-1/members"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "org-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].user.full_name).toBe("Dr. Smith");
    expect(json.meta.total).toBe(1);
  });

  it("returns 404 for non-existent organization", async () => {
    const orgChain = createQueryChain({
      data: null,
      error: { code: "PGRST116" },
    });
    mockServiceFrom.mockReturnValue(orgChain);

    const { GET } = await import(
      "@/app/api/admin/organizations/[id]/members/route"
    );
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations/bad-id/members"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "bad-id" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 403 for non-super-admin", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createForbiddenError());

    const { GET } = await import(
      "@/app/api/admin/organizations/[id]/members/route"
    );
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations/org-1/members"
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: "org-1" }),
    });

    expect(response.status).toBe(403);
  });
});

// ============================================
// POST /api/admin/organizations/[id]/invite
// ============================================

describe("POST /api/admin/organizations/[id]/invite", () => {
  it("creates invite and returns URL", async () => {
    const orgChain = createQueryChain({ data: { id: "org-1" }, error: null });
    mockServiceFrom.mockReturnValue(orgChain);

    mockCreateInvite.mockResolvedValue({
      data: { id: "inv-1", token: "test-token-123", email: "new@test.com", role: "admin" },
      error: null,
    });

    const { POST } = await import(
      "@/app/api/admin/organizations/[id]/invite/route"
    );
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations/org-1/invite",
      {
        method: "POST",
        body: { email: "new@test.com", role: "admin" },
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "org-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data.inviteUrl).toContain("test-token-123");
    expect(json.data.invite_id).toBe("inv-1");
    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "invite.create",
        resourceType: "organization",
        resourceId: "org-1",
      })
    );
  });

  it("rejects missing email/role with 400", async () => {
    const { POST } = await import(
      "@/app/api/admin/organizations/[id]/invite/route"
    );
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations/org-1/invite",
      {
        method: "POST",
        body: { email: "new@test.com" },
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "org-1" }),
    });

    expect(response.status).toBe(400);
  });

  it("rejects invalid role with 400", async () => {
    const { POST } = await import(
      "@/app/api/admin/organizations/[id]/invite/route"
    );
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations/org-1/invite",
      {
        method: "POST",
        body: { email: "new@test.com", role: "superadmin" },
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "org-1" }),
    });

    expect(response.status).toBe(400);
  });

  it("rejects invalid email format with 400", async () => {
    const { POST } = await import(
      "@/app/api/admin/organizations/[id]/invite/route"
    );
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations/org-1/invite",
      {
        method: "POST",
        body: { email: "not-an-email", role: "admin" },
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "org-1" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 for non-existent organization", async () => {
    const orgChain = createQueryChain({
      data: null,
      error: { code: "PGRST116" },
    });
    mockServiceFrom.mockReturnValue(orgChain);

    const { POST } = await import(
      "@/app/api/admin/organizations/[id]/invite/route"
    );
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations/bad-id/invite",
      {
        method: "POST",
        body: { email: "new@test.com", role: "admin" },
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "bad-id" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 403 for non-super-admin", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createForbiddenError());

    const { POST } = await import(
      "@/app/api/admin/organizations/[id]/invite/route"
    );
    const request = createRequest(
      "http://localhost:3000/api/admin/organizations/org-1/invite",
      {
        method: "POST",
        body: { email: "new@test.com", role: "admin" },
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "org-1" }),
    });

    expect(response.status).toBe(403);
  });
});

// ============================================
// GET /api/admin/users
// ============================================

describe("GET /api/admin/users", () => {
  it("returns users list with meta", async () => {
    const users = [
      {
        id: "user-1",
        full_name: "John Doe",
        email: "john@test.com",
        is_active: true,
        is_super_admin: false,
        role: "nutri",
        organization: { id: "org-1", name: "Clinic A" },
        orgRole: "nutri",
        created_at: "2024-01-01",
      },
    ];
    mockGetAllUsers.mockResolvedValue(users);

    const { GET } = await import("@/app/api/admin/users/route");
    const request = createRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.meta.total).toBe(1);
  });

  it("passes role, orgId, and search filters", async () => {
    mockGetAllUsers.mockResolvedValue([]);

    const { GET } = await import("@/app/api/admin/users/route");
    const request = createRequest(
      "http://localhost:3000/api/admin/users?role=nutri&orgId=org-1&search=john"
    );
    await GET(request);

    expect(mockGetAllUsers).toHaveBeenCalledWith({
      role: "nutri",
      orgId: "org-1",
      search: "john",
    });
  });

  it("ignores invalid role filter", async () => {
    mockGetAllUsers.mockResolvedValue([]);

    const { GET } = await import("@/app/api/admin/users/route");
    const request = createRequest(
      "http://localhost:3000/api/admin/users?role=invalid_role"
    );
    await GET(request);

    expect(mockGetAllUsers).toHaveBeenCalledWith({});
  });

  it("returns 403 for non-super-admin", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createForbiddenError());

    const { GET } = await import("@/app/api/admin/users/route");
    const request = createRequest("http://localhost:3000/api/admin/users");
    const response = await GET(request);

    expect(response.status).toBe(403);
  });
});

// ============================================
// PATCH /api/admin/users/[id]
// ============================================

describe("PATCH /api/admin/users/[id]", () => {
  it("deactivates user", async () => {
    const profileChain = createQueryChain({
      data: {
        id: "user-99",
        full_name: "Jane Doe",
        email: "jane@test.com",
        is_active: true,
        role: "nutri",
        created_at: "2024-01-01",
      },
      error: null,
    });
    mockServiceFrom.mockReturnValue(profileChain);
    mockDeactivateUser.mockResolvedValue(undefined);

    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/users/user-99", {
      method: "PATCH",
      body: { is_active: false },
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-99" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.is_active).toBe(false);
    expect(mockDeactivateUser).toHaveBeenCalledWith("user-99");
  });

  it("reactivates user", async () => {
    const profileChain = createQueryChain({
      data: {
        id: "user-99",
        full_name: "Jane Doe",
        email: "jane@test.com",
        is_active: false,
        role: "nutri",
        created_at: "2024-01-01",
      },
      error: null,
    });
    // For reactivation: first call is profile fetch, second is update
    const updateChain = createQueryChain({ data: null, error: null });
    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return profileChain;
      return updateChain;
    });

    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/users/user-99", {
      method: "PATCH",
      body: { is_active: true },
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-99" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.is_active).toBe(true);
    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "user.reactivate",
        resourceType: "user",
        resourceId: "user-99",
      })
    );
  });

  it("prevents self-deactivation", async () => {
    const profileChain = createQueryChain({
      data: {
        id: "sa-1",
        full_name: "Admin",
        email: "admin@test.com",
        is_active: true,
        role: "admin",
        created_at: "2024-01-01",
      },
      error: null,
    });
    mockServiceFrom.mockReturnValue(profileChain);

    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/users/sa-1", {
      method: "PATCH",
      body: { is_active: false },
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "sa-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("própria conta");
  });

  it("returns 404 for non-existent user", async () => {
    const profileChain = createQueryChain({
      data: null,
      error: { code: "PGRST116" },
    });
    mockServiceFrom.mockReturnValue(profileChain);

    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/users/bad-id", {
      method: "PATCH",
      body: { is_active: false },
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "bad-id" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 for missing is_active", async () => {
    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/users/user-99", {
      method: "PATCH",
      body: {},
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-99" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 403 for non-super-admin", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createForbiddenError());

    const { PATCH } = await import("@/app/api/admin/users/[id]/route");
    const request = createRequest("http://localhost:3000/api/admin/users/user-99", {
      method: "PATCH",
      body: { is_active: false },
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-99" }),
    });

    expect(response.status).toBe(403);
  });
});

// ============================================
// GET /api/admin/audit-logs
// ============================================

describe("GET /api/admin/audit-logs", () => {
  it("returns audit logs with meta", async () => {
    const logs = [
      {
        id: "log-1",
        user_id: "sa-1",
        action: "org.create",
        resource_type: "organization",
        resource_id: "org-1",
        metadata: { name: "Clinic A" },
        ip_address: "127.0.0.1",
        created_at: "2024-01-01",
        user: { full_name: "Admin", email: "admin@test.com" },
      },
    ];
    mockGetAuditLogs.mockResolvedValue(logs);

    const { GET } = await import("@/app/api/admin/audit-logs/route");
    const request = createRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.meta.total).toBe(1);
    expect(json.data[0].action).toBe("org.create");
  });

  it("passes filter parameters", async () => {
    mockGetAuditLogs.mockResolvedValue([]);

    const { GET } = await import("@/app/api/admin/audit-logs/route");
    const request = createRequest(
      "http://localhost:3000/api/admin/audit-logs?action=org.create&dateFrom=2024-01-01&dateTo=2024-12-31"
    );
    await GET(request);

    expect(mockGetAuditLogs).toHaveBeenCalledWith({
      action: "org.create",
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
    });
  });

  it("returns 403 for non-super-admin", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createForbiddenError());

    const { GET } = await import("@/app/api/admin/audit-logs/route");
    const request = createRequest("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);

    expect(response.status).toBe(403);
  });
});

// ============================================
// Cross-cutting: All endpoints block non-super-admin
// ============================================

describe("Access control - all endpoints return 403", () => {
  it("all admin endpoints reject non-super-admin", async () => {
    mockRequireSuperAdminApi.mockRejectedValue(createForbiddenError());

    const endpoints = [
      async () => {
        const { GET } = await import("@/app/api/admin/stats/route");
        return GET();
      },
      async () => {
        const { GET } = await import("@/app/api/admin/organizations/route");
        return GET(createRequest("http://localhost:3000/api/admin/organizations"));
      },
      async () => {
        const { POST } = await import("@/app/api/admin/organizations/route");
        return POST(
          createRequest("http://localhost:3000/api/admin/organizations", {
            method: "POST",
            body: { name: "x", slug: "x" },
          })
        );
      },
      async () => {
        const { GET } = await import("@/app/api/admin/users/route");
        return GET(createRequest("http://localhost:3000/api/admin/users"));
      },
      async () => {
        const { GET } = await import("@/app/api/admin/audit-logs/route");
        return GET(createRequest("http://localhost:3000/api/admin/audit-logs"));
      },
    ];

    for (const callEndpoint of endpoints) {
      const response = await callEndpoint();
      expect(response.status).toBe(403);
    }
  });
});
