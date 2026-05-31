import { BriefcaseBusiness, Mail, UserRound } from "lucide-react";
import {
  ProfileSection,
  ProfileTextField,
  ProfileTextareaField,
} from "./ProfileFields";
import type { AuthUser } from "../../../services/auth.service";

type ProfileInformationGridProps = {
  user: AuthUser;
};

export default function ProfileInformationGrid({ user }: ProfileInformationGridProps) {
  return (
    <div className="grid gap-4">
      <ProfileSection title="Informations personnelles" icon={<UserRound size={18} className="text-[#9d0208]" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <ProfileTextField label="Prenom" value={user.prenom} />
          <ProfileTextField label="Nom" value={user.nom} />
          <ProfileTextField label="Email" value={user.email} />
          <ProfileTextField label="Telephone" value={user.telephone} />
          <ProfileTextField label="Matricule" value={user.matricule} />
          <ProfileTextField label="Date de naissance" value={user.birthDate} />
          <ProfileTextField label="Membre depuis" value={user.memberSince} />
        </div>
      </ProfileSection>

      <ProfileSection title="Informations professionnelles" icon={<BriefcaseBusiness size={18} />}>
        <div className="grid gap-3 md:grid-cols-2">
          <ProfileTextField label="Direction" value={user.direction} />
          <ProfileTextField label="Service" value={user.service} />
          <ProfileTextField label="Poste" value={user.poste} />
          <ProfileTextField label="Bureau" value={user.bureau} />
          <ProfileTextField label="Responsable" value={user.manager} />
        </div>
      </ProfileSection>

      <ProfileSection title="Coordonnees" icon={<Mail size={18} />}>
        <ProfileTextareaField label="Adresse" value={user.adresse} />
      </ProfileSection>
    </div>
  );
}
