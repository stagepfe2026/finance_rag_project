import type { ReactNode } from "react";

import type { ProfileFormState, ProfileTextFieldName } from "./profileForm";

type ProfileSectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
};

type ProfileTextFieldProps = {
  label: string;
  name: ProfileTextFieldName;
  value: string;
  type?: "text" | "email" | "tel" | "date";
  placeholder?: string;
  onChange: (name: ProfileTextFieldName, value: string) => void;
};

type ProfileSelectFieldProps = {
  label: string;
  name: ProfileTextFieldName;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (name: ProfileTextFieldName, value: string) => void;
};

type ProfileTextareaFieldProps = {
  label: string;
  name: ProfileTextFieldName;
  value: string;
  placeholder?: string;
  onChange: (name: ProfileTextFieldName, value: string) => void;
};

type ProfileToggleFieldProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const fieldClassName =
  "mt-1 h-8 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#9d0208] focus:ring-2 focus:ring-[#9d0208]/10";

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

export function ProfileTextField({
  label,
  name,
  value,
  type = "text",
  placeholder,
  onChange,
}: ProfileTextFieldProps) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className={fieldClassName}
      />
    </label>
  );
}

export function ProfileSelectField({ label, name, value, options, onChange }: ProfileSelectFieldProps) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className={`${fieldClassName} appearance-none`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProfileTextareaField({
  label,
  name,
  value,
  placeholder,
  onChange,
}: ProfileTextareaFieldProps) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold text-slate-600">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-1 min-h-14 w-full resize-y rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#9d0208] focus:ring-2 focus:ring-[#9d0208]/10"
      />
    </label>
  );
}

export function ProfileToggleField({ label, description, checked, onChange }: ProfileToggleFieldProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-[#9d0208]"
    >
      <span>
        <span className="block text-[12px] font-semibold text-slate-900">{label}</span>
        <span className="mt-0.5 block text-[11px] text-slate-500">{description}</span>
      </span>
      <span
        className={[
          "relative inline-flex h-5 w-9 shrink-0 rounded-full p-0.5 transition",
          checked ? "bg-[#9d0208]" : "bg-slate-200",
        ].join(" ")}
      >
        <span
          className={[
            "h-4 w-4 rounded-full bg-white shadow-sm transition",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

export type ProfileFieldChange = (name: ProfileTextFieldName, value: string) => void;
export type ProfileToggleChange = (name: keyof Pick<ProfileFormState, "notificationsEmail" | "notificationsSms" | "twoFactorEnabled">, value: boolean) => void;
