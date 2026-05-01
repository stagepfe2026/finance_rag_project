import { BriefcaseBusiness, ShieldCheck, Upload } from "lucide-react";

import type { AuthUser } from "../../../services/auth.service";
import { getUserInitials } from "./profileForm";

type ProfileSummaryCardProps = {
  user: AuthUser;
  imageUrl: string;
  onImageChange: (file: File) => void;
};

export default function ProfileSummaryCard({ user, imageUrl, onImageChange }: ProfileSummaryCardProps) {
  const roleLabel = user.role === "ADMIN" ? "Administrateur" : "Finance Utilisateur";
  const fullName = `${user.prenom || ""} ${user.nom || ""}`.trim() || "Utilisateur";

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-2xl font-semibold text-[#273043]">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            getUserInitials(user)
          )}
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-950">{fullName}</h2>
        <p className="mt-1 text-[12px] font-medium text-[#9d0208]">{roleLabel}</p>
      </div>

      <div className="my-6 border-t border-slate-200" />

      <div className="space-y-5 text-left">
        <div className="flex items-start gap-3">
          <BriefcaseBusiness size={16} className="mt-0.5 text-slate-500" />
          <div>
            <p className="text-[12px] font-semibold text-slate-800">Departement</p>
            <p className="mt-1 text-[11px] text-slate-500">{user.direction || "Direction des Finances"}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <ShieldCheck size={16} className="mt-0.5 text-slate-500" />
          <div>
            <p className="text-[12px] font-semibold text-slate-800">Role</p>
            <p className="mt-1 text-[11px] text-slate-500">{roleLabel}</p>
          </div>
        </div>
      </div>

      <label className="mt-7 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#9d0208] bg-white text-[12px] font-semibold text-[#9d0208] transition hover:bg-[#fff4f2]">
        <Upload size={14} />
        Changer la photo
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              onImageChange(file);
            }
          }}
        />
      </label>
    </aside>
  );
}
