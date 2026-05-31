import type { ReactNode } from "react";

type ProfileSectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

type ProfileReadFieldProps = {
  label: string;
  value: string;
};

const valueClassName =
  "mt-1 h-8 w-full rounded-xl border border-slate-100 bg-slate-50 px-2.5 text-[11px] font-medium text-slate-700 flex items-center";

export function ProfileSection({ title, icon, children }: ProfileSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        {icon ? <span className="text-[#273043]">{icon}</span> : null}
        <h2 className="text-sm font-semibold text-[#273043]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function ProfileTextField({ label, value }: ProfileReadFieldProps) {
  return (
    <div className="block">
      <span className="text-[10px] font-semibold text-slate-600">{label}</span>
      <div className={valueClassName}>{value || "—"}</div>
    </div>
  );
}

export function ProfileSelectField({ label, value }: ProfileReadFieldProps) {
  return (
    <div className="block">
      <span className="text-[10px] font-semibold text-slate-600">{label}</span>
      <div className={valueClassName}>{value || "—"}</div>
    </div>
  );
}

export function ProfileTextareaField({ label, value }: ProfileReadFieldProps) {
  return (
    <div className="block">
      <span className="text-[10px] font-semibold text-slate-600">{label}</span>
      <div className="mt-1 min-h-14 w-full rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-[11px] font-medium text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}
