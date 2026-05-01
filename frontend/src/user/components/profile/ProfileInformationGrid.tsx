import { BriefcaseBusiness, Info, Mail, Settings, UserRound } from "lucide-react";

import {
  ProfileSection,
  ProfileSelectField,
  ProfileTextareaField,
  ProfileTextField,
  type ProfileFieldChange,
} from "./ProfileFields";
import type { ProfileFormState } from "./profileForm";

type ProfileInformationGridProps = {
  form: ProfileFormState;
  onFieldChange: ProfileFieldChange;
};

const languageOptions = [
  { value: "fr", label: "Francais" },
  { value: "ar", label: "Arabe" },
  { value: "en", label: "Anglais" },
];

const themeOptions = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];

export default function ProfileInformationGrid({ form, onFieldChange }: ProfileInformationGridProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.88fr)]">
      <ProfileSection title="Informations personnelles" icon={<UserRound size={18} className="text-[#9d0208]" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <ProfileTextField label="Prenom" name="prenom" value={form.prenom} onChange={onFieldChange} />
          <ProfileTextField label="Nom" name="nom" value={form.nom} onChange={onFieldChange} />
          <ProfileTextField label="Email" name="email" type="email" value={form.email} onChange={onFieldChange} />
          <ProfileTextField
            label="Telephone"
            name="telephone"
            type="tel"
            value={form.telephone}
            placeholder="Entrez votre numero"
            onChange={onFieldChange}
          />
          <ProfileTextField
            label="Date de naissance"
            name="dateNaissance"
            type="date"
            value={form.dateNaissance}
            onChange={onFieldChange}
          />
          <ProfileTextField
            label="Matricule"
            name="matricule"
            value={form.matricule}
            placeholder="Entrez votre matricule"
            onChange={onFieldChange}
          />
        </div>
      </ProfileSection>

      <ProfileSection title="Preferences" icon={<Settings size={18} />}>
        <div className="space-y-4">
          <ProfileSelectField
            label="Langue"
            name="languePreferee"
            value={form.languePreferee}
            options={languageOptions}
            onChange={onFieldChange}
          />
          <ProfileSelectField
            label="Theme prefere"
            name="themePrefere"
            value={form.themePrefere}
            options={themeOptions}
            onChange={onFieldChange}
          />
          <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-[11px] leading-5 text-slate-500">
            <Info size={15} className="mt-0.5 shrink-0 text-blue-500" />
            Ces preferences seront appliquees sur l'ensemble de la plateforme.
          </div>
        </div>
      </ProfileSection>

      <ProfileSection
        title="Informations professionnelles"
        icon={<BriefcaseBusiness size={18} />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ProfileTextField
            label="Direction"
            name="direction"
            value={form.direction}
            placeholder="Entrez votre direction"
            onChange={onFieldChange}
          />
          <ProfileTextField
            label="Service"
            name="service"
            value={form.service}
            placeholder="Entrez votre service"
            onChange={onFieldChange}
          />
          <ProfileTextField
            label="Poste"
            name="poste"
            value={form.poste}
            placeholder="Entrez votre poste"
            onChange={onFieldChange}
          />
          <ProfileTextField
            label="Bureau"
            name="bureau"
            value={form.bureau}
            placeholder="Entrez votre bureau"
            onChange={onFieldChange}
          />
          <ProfileTextField
            label="Responsable"
            name="responsable"
            value={form.responsable}
            placeholder="Entrez le nom du responsable"
            onChange={onFieldChange}
          />
          <ProfileTextField
            label="Membre depuis"
            name="membreDepuis"
            type="date"
            value={form.membreDepuis}
            onChange={onFieldChange}
          />
        </div>
      </ProfileSection>

      <ProfileSection title="Coordonnees" icon={<Mail size={18} />}>
        <ProfileTextareaField
          label="Adresse"
          name="adresse"
          value={form.adresse}
          placeholder="Entrez votre adresse complete"
          onChange={onFieldChange}
        />
      </ProfileSection>
    </div>
  );
}
