import type { AuthUser } from "../../../services/auth.service";

export function getUserInitials(user: AuthUser | null) {
  const initials = `${user?.prenom?.charAt(0) ?? ""}${user?.nom?.charAt(0) ?? ""}`.toUpperCase();
  return initials || "U";
}
