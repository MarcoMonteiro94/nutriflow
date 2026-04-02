import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserRole } from "@/lib/auth/authorization";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock the supabase server client
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockLimit = vi.fn();
const mockIs = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// Set up chainable query builder
function setupChain(returnValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

describe("authorization - isSuperAdmin", () => {
  it("returns true for super admin user role", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/authorization");
    const role: UserRole = {
      userId: "user-1",
      organizationId: "org-1",
      role: "admin",
      isOwner: false,
      isSuperAdmin: true,
    };
    expect(isSuperAdmin(role)).toBe(true);
  });

  it("returns false for non-super admin user role", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/authorization");
    const role: UserRole = {
      userId: "user-1",
      organizationId: "org-1",
      role: "admin",
      isOwner: true,
      isSuperAdmin: false,
    };
    expect(isSuperAdmin(role)).toBe(false);
  });

  it("returns false for null user role", async () => {
    const { isSuperAdmin } = await import("@/lib/auth/authorization");
    expect(isSuperAdmin(null)).toBe(false);
  });
});

describe("authorization - requireSuperAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects non-super-admin users", async () => {
    const { requireSuperAdmin } = await import("@/lib/auth/authorization");

    // Mock: authenticated user who is NOT a super admin
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    // profiles query returns is_super_admin = false
    const profileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { is_super_admin: false },
        error: null,
      }),
    };

    // membership query returns a valid membership
    const membershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: "org-1", role: "admin" },
        error: null,
      }),
    };

    // org query for owner check
    const orgChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { owner_id: "user-1" },
        error: null,
      }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return profileChain; // profiles
      if (callCount === 2) return membershipChain; // organization_members
      return orgChain; // organizations
    });

    await expect(requireSuperAdmin()).rejects.toThrow("REDIRECT:/auth/login");
  });

  it("returns UserRole for super admin", async () => {
    const { requireSuperAdmin } = await import("@/lib/auth/authorization");

    mockGetUser.mockResolvedValue({
      data: { user: { id: "super-admin-1" } },
    });

    const profileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { is_super_admin: true },
        error: null,
      }),
    };

    const membershipChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: "org-1", role: "admin" },
        error: null,
      }),
    };

    const orgChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { owner_id: "other-user" },
        error: null,
      }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return profileChain;
      if (callCount === 2) return membershipChain;
      return orgChain;
    });

    const result = await requireSuperAdmin();
    expect(result.isSuperAdmin).toBe(true);
    expect(result.userId).toBe("super-admin-1");
  });

  it("redirects unauthenticated users", async () => {
    const { requireSuperAdmin } = await import("@/lib/auth/authorization");

    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    await expect(requireSuperAdmin()).rejects.toThrow("REDIRECT:/auth/login");
  });
});
