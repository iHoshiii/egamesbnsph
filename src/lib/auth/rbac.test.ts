import { describe, expect, it } from "vitest";
import {
  canAccessTransaction,
  canResolveDispute,
  hasRole,
  isAdmin,
  isVerifiedMidman,
  type RoleSubject,
} from "./rbac";

const buyer: RoleSubject = { id: "u-buyer", roles: ["BUYER", "SELLER"] };
const seller: RoleSubject = { id: "u-seller", roles: ["BUYER", "SELLER"] };
const pendingMidman: RoleSubject = { id: "u-mid-p", roles: ["BUYER", "MIDMAN"], midmanStatus: "PENDING" };
const verifiedMidman: RoleSubject = { id: "u-mid", roles: ["BUYER", "MIDMAN"], midmanStatus: "VERIFIED" };
const admin: RoleSubject = { id: "u-admin", roles: ["BUYER", "ADMIN"] };
const outsider: RoleSubject = { id: "u-other", roles: ["BUYER"] };

describe("RBAC role helpers", () => {
  it("checks individual roles accurately", () => {
    expect(hasRole(buyer, "BUYER")).toBe(true);
    expect(hasRole(buyer, "ADMIN")).toBe(false);
    expect(hasRole(null, "BUYER")).toBe(false);
  });

  it("restricts verified midman capability to VERIFIED status", () => {
    expect(isVerifiedMidman(pendingMidman)).toBe(false);
    expect(isVerifiedMidman(verifiedMidman)).toBe(true);
    expect(isVerifiedMidman(buyer)).toBe(false);
  });

  it("restricts admin and dispute resolution to ADMIN role", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(verifiedMidman)).toBe(false);
    expect(canResolveDispute(admin)).toBe(true);
    expect(canResolveDispute(seller)).toBe(false);
    expect(canResolveDispute(verifiedMidman)).toBe(false);
  });

  it("enforces transaction participant and admin access boundaries", () => {
    const tx = { buyerId: buyer.id, sellerId: seller.id, midmanId: verifiedMidman.id };
    expect(canAccessTransaction(buyer.id, tx, buyer)).toBe(true);
    expect(canAccessTransaction(seller.id, tx, seller)).toBe(true);
    expect(canAccessTransaction(verifiedMidman.id, tx, verifiedMidman)).toBe(true);
    expect(canAccessTransaction(admin.id, tx, admin)).toBe(true);
    expect(canAccessTransaction(outsider.id, tx, outsider)).toBe(false);
  });
});
