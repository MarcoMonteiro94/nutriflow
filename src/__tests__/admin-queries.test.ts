import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation (required by authorization.ts)
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock next/headers (required by audit.ts)
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn(() => null),
  })),
}));

// Track requireSuperAdminApi mock
const mockRequireSuperAdmin = vi.fn();
vi.mock("@/lib/auth/authorization", () => ({
  requireSuperAdminApi: (...args: unknown[]) => mockRequireSuperAdmin(...args),
  requireSuperAdmin: (...args: unknown[]) => mockRequireSuperAdmin(...args),
  getUserRole: vi.fn(),
}));

// Track audit mock
const mockLogAuditEvent = vi.fn();
vi.mock("@/lib/audit", () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
}));

// Service client mock
const mockServiceFrom = vi.fn();
const mockServiceClient = {
  from: mockServiceFrom,
};

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => mockServiceClient,
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "sa-1" } } }) },
    from: mockServiceFrom,
  })),
}));

// Helper to create a chainable query builder
function createQueryChain(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "eq",
    "neq",
    "in",
    "is",
    "or",
    "gte",
    "lte",
    "order",
    "limit",
    "update",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Terminal method
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  // For count queries, resolve directly from the chain
  (chain as Record<string, unknown>).__resolvedValue = resolvedValue;
  // Make the chain itself thenable for count queries
  const thenableChain = Object.assign(
    Promise.resolve(resolvedValue),
    chain
  );
  // Ensure chainable methods still work
  for (const m of methods) {
    (thenableChain as Record<string, unknown>)[m] = vi.fn().mockReturnValue(thenableChain);
  }
  (thenableChain as Record<string, unknown>).single = chain.single;
  return thenableChain;
}

const superAdminRole = {
  userId: "sa-1",
  organizationId: null,
  role: "admin" as const,
  isOwner: false,
  isSuperAdmin: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireSuperAdmin.mockResolvedValue(superAdminRole);
  mockLogAuditEvent.mockResolvedValue(undefined);
});

describe("admin queries - getAllOrganizations", () => {
  it("returns orgs with stats", async () => {
    const { getAllOrganizations } = await import("@/lib/queries/admin");

    // Main orgs query
    const orgsChain = createQueryChain({
      data: [
        {
          id: "org-1",
          name: "Clinic A",
          slug: "clinic-a",
          is_active: true,
          created_at: "2024-01-01",
          owner_id: "owner-1",
          profiles: { full_name: "Dr. Smith", email: "smith@test.com" },
        },
      ],
      error: null,
    });

    // Member count chain
    const memberCountChain = createQueryChain({
      count: 5,
      error: null,
    });

    // Patient count chain
    const patientCountChain = createQueryChain({
      count: 3,
      error: null,
    });

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return orgsChain;
      if (callCount === 2) return memberCountChain;
      return patientCountChain;
    });

    const result = await getAllOrganizations();

    // Auth check is done at the route layer, not the query layer
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Clinic A");
    expect(result[0].is_active).toBe(true);
    expect(result[0].owner.full_name).toBe("Dr. Smith");
    expect(result[0].memberCount).toBe(5);
    expect(result[0].patientCount).toBe(3);
  });

  it("filters by isActive and search", async () => {
    const { getAllOrganizations } = await import("@/lib/queries/admin");

    const orgsChain = createQueryChain({
      data: [],
      error: null,
    });

    mockServiceFrom.mockReturnValue(orgsChain);

    await getAllOrganizations({ isActive: true, search: "clinic" });

    // Verify eq and or were called (filter methods)
    expect(orgsChain.eq).toHaveBeenCalled();
    expect(orgsChain.or).toHaveBeenCalled();
  });
});

describe("admin queries - getAllUsers", () => {
  it("returns users with membership info", async () => {
    const { getAllUsers } = await import("@/lib/queries/admin");

    // Profiles query
    const profilesChain = createQueryChain({
      data: [
        {
          id: "user-1",
          full_name: "John Doe",
          email: "john@test.com",
          is_active: true,
          is_super_admin: false,
          role: "nutri",
          created_at: "2024-01-01",
        },
      ],
      error: null,
    });

    // Membership query
    const membershipChain = createQueryChain({
      data: [
        {
          role: "nutri",
          organizations: { id: "org-1", name: "Clinic A" },
        },
      ],
      error: null,
    });

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return profilesChain;
      return membershipChain;
    });

    const result = await getAllUsers();
    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe("John Doe");
    expect(result[0].organization?.name).toBe("Clinic A");
    expect(result[0].orgRole).toBe("nutri");
  });
});

describe("admin queries - getPlatformStats", () => {
  it("returns correct counts", async () => {
    const { getPlatformStats } = await import("@/lib/queries/admin");

    // Create chains for the 5 parallel count queries + role counts
    const countChains = [
      createQueryChain({ count: 10, error: null }), // totalOrganizations
      createQueryChain({ count: 8, error: null }), // activeOrganizations
      createQueryChain({ count: 50, error: null }), // totalUsers
      createQueryChain({ count: 30, error: null }), // totalPatients
      createQueryChain({ count: 5, error: null }), // pendingInvites
      createQueryChain({
        data: [
          { role: "admin" },
          { role: "admin" },
          { role: "nutri" },
          { role: "nutri" },
          { role: "nutri" },
          { role: "receptionist" },
          { role: "patient" },
          { role: "patient" },
        ],
        error: null,
      }), // role counts
    ];

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      const chain = countChains[callCount] ?? countChains[countChains.length - 1];
      callCount++;
      return chain;
    });

    const result = await getPlatformStats();

    expect(result.totalOrganizations).toBe(10);
    expect(result.activeOrganizations).toBe(8);
    expect(result.totalUsers).toBe(50);
    expect(result.totalPatients).toBe(30);
    expect(result.pendingInvites).toBe(5);
    expect(result.usersByRole.admin).toBe(2);
    expect(result.usersByRole.nutri).toBe(3);
    expect(result.usersByRole.receptionist).toBe(1);
    expect(result.usersByRole.patient).toBe(2);
  });
});

describe("admin queries - deactivateOrganization", () => {
  it("sets is_active=false and logs audit event", async () => {
    const { deactivateOrganization } = await import("@/lib/queries/admin");

    const updateChain = createQueryChain({ data: null, error: null });
    mockServiceFrom.mockReturnValue(updateChain);

    await deactivateOrganization("org-1");

    expect(mockRequireSuperAdmin).toHaveBeenCalled();
    expect(mockServiceFrom).toHaveBeenCalledWith("organizations");
    expect(updateChain.update).toHaveBeenCalledWith({ is_active: false });
    expect(updateChain.eq).toHaveBeenCalledWith("id", "org-1");

    expect(mockLogAuditEvent).toHaveBeenCalledWith({
      action: "org.deactivate",
      resourceType: "organization",
      resourceId: "org-1",
      userId: "sa-1",
      metadata: { organization_id: "org-1" },
    });
  });
});

describe("admin queries - reactivateOrganization", () => {
  it("sets is_active=true and logs audit event", async () => {
    const { reactivateOrganization } = await import("@/lib/queries/admin");

    const updateChain = createQueryChain({ data: null, error: null });
    mockServiceFrom.mockReturnValue(updateChain);

    await reactivateOrganization("org-2");

    expect(mockRequireSuperAdmin).toHaveBeenCalled();
    expect(updateChain.update).toHaveBeenCalledWith({ is_active: true });
    expect(updateChain.eq).toHaveBeenCalledWith("id", "org-2");

    expect(mockLogAuditEvent).toHaveBeenCalledWith({
      action: "org.reactivate",
      resourceType: "organization",
      resourceId: "org-2",
      userId: "sa-1",
      metadata: { organization_id: "org-2" },
    });
  });
});

describe("admin queries - deactivateUser", () => {
  it("sets is_active=false and logs audit event", async () => {
    const { deactivateUser } = await import("@/lib/queries/admin");

    const updateChain = createQueryChain({ data: null, error: null });
    mockServiceFrom.mockReturnValue(updateChain);

    await deactivateUser("user-99");

    expect(mockRequireSuperAdmin).toHaveBeenCalled();
    expect(mockServiceFrom).toHaveBeenCalledWith("profiles");
    expect(updateChain.update).toHaveBeenCalledWith({ is_active: false });
    expect(updateChain.eq).toHaveBeenCalledWith("id", "user-99");

    expect(mockLogAuditEvent).toHaveBeenCalledWith({
      action: "user.deactivate",
      resourceType: "user",
      resourceId: "user-99",
      userId: "sa-1",
      metadata: { target_user_id: "user-99" },
    });
  });
});
