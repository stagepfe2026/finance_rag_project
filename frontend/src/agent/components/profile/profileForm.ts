import type { AuthUser, ProfileUpdatePayload } from "../../../services/auth.service";

export type ProfileFormState = ProfileUpdatePayload;

export type ProfileTextFieldName = Exclude<
  keyof ProfileFormState,
  "emailNotificationsOn" | "smsNotificationsOn" | "isTwoFactorEnabled"
>;

export function buildProfileForm(user: AuthUser | null): ProfileFormState {
  return {
    nom: user?.nom ?? "",
    prenom: user?.prenom ?? "",
    email: user?.email ?? "",
    telephone: user?.telephone ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    adresse: user?.adresse ?? "",
    dateNaissance: user?.dateNaissance ?? "",
    direction: user?.direction ?? "",
    service: user?.service ?? "",
    poste: user?.poste ?? "",
    matricule: user?.matricule ?? "",
    bureau: user?.bureau ?? "",
    responsable: user?.responsable ?? "",
    membreDepuis: user?.membreDepuis ?? "",
    preferredLanguage: user?.preferredLanguage ?? "fr",
    preferredTheme: user?.preferredTheme ?? "light",
    emailNotificationsOn: user?.emailNotificationsOn ?? true,
    smsNotificationsOn: user?.smsNotificationsOn ?? false,
    isTwoFactorEnabled: user?.isTwoFactorEnabled ?? false,
  };
}

export function getUserInitials(user: AuthUser | null) {
  const initials = `${user?.prenom?.charAt(0) ?? ""}${user?.nom?.charAt(0) ?? ""}`.toUpperCase();
  return initials || "U";
}
