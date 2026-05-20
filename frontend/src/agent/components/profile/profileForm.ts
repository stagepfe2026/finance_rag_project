import type { AuthUser, ProfileUpdatePayload } from "../../../services/auth.service";

export type ProfileFormState = ProfileUpdatePayload;

export type ProfileTextFieldName = Exclude<
  keyof ProfileFormState,
  "notificationsEmail" | "notificationsSms" | "twoFactorEnabled"
>;

export type ProfileToggleName = "notificationsEmail" | "notificationsSms" | "twoFactorEnabled";

export function buildProfileForm(user: AuthUser | null): ProfileFormState {
  return {
    nom: user?.nom ?? "",
    prenom: user?.prenom ?? "",
    email: user?.email ?? "",
    telephone: user?.telephone ?? "",
    profileImageUrl: user?.profileImageUrl ?? "",
    adresse: user?.adresse ?? "",
    dateNaissance: user?.dateNaissance ?? "",
    direction: user?.direction ?? "",
    service: user?.service ?? "",
    poste: user?.poste ?? "",
    matricule: user?.matricule ?? "",
    bureau: user?.bureau ?? "",
    responsable: user?.responsable ?? "",
    membreDepuis: user?.membreDepuis ?? "",
    languePreferee: user?.languePreferee ?? "fr",
    themePrefere: user?.themePrefere ?? "light",
    notificationsEmail: user?.notificationsEmail ?? true,
    notificationsSms: user?.notificationsSms ?? false,
    twoFactorEnabled: user?.twoFactorEnabled ?? false,
  };
}

export function getUserInitials(user: AuthUser | null) {
  const initials = `${user?.prenom?.charAt(0) ?? ""}${user?.nom?.charAt(0) ?? ""}`.toUpperCase();
  return initials || "U";
}
