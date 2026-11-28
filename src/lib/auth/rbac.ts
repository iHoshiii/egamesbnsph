export type AppRole = "BUYER" | "SELLER" | "MIDMAN" | "ADMIN";

export interface RoleSubject {
  id: string;
  roles: string[];
  midmanStatus?: string | null;
}

export function hasRole(subject: RoleSubject | null | undefined, role: AppRole): boolean {
  if (!subject) return false;
  return subject.roles.includes(role);
}

export function isAdmin(subject: RoleSubject | null | undefined): boolean {
  return hasRole(subject, "ADMIN");
}

export function isVerifiedMidman(subject: RoleSubject | null | undefined): boolean {
  return hasRole(subject, "MIDMAN") && subject?.midmanStatus === "VERIFIED";
}

export function canAccessTransaction(
  userId: string,
  tx: { buyerId: string; sellerId: string; midmanId: string | null },
  subject?: RoleSubject | null,
): boolean {
  if (isAdmin(subject)) return true;
  return tx.buyerId === userId || tx.sellerId === userId || tx.midmanId === userId;
}

export function canResolveDispute(subject: RoleSubject | null | undefined): boolean {
  return isAdmin(subject);
}
