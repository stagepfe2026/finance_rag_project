import type { ReactNode } from "react";

interface InputFieldProps {
  type: string;
  label: string;
  placeholder: string;
  icon?: ReactNode;
}

export function InputField({ type, label, placeholder, icon }: InputFieldProps) {
  return (
    <label className="block w-full">
      <span className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.22em] text-[#24324a]">
        {label}
      </span>

      <div className="relative w-full">
        {icon ? (
          <span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[#9ca3af]">
            {icon}
          </span>
        ) : null}

        <input
          type={type}
          placeholder={placeholder}
          className={[
            "h-[54px] w-full rounded-[7px] border border-[#dce2ea] bg-[#f8f9fc]",
            "px-4 text-[15px] text-[#17233a] outline-none transition",
            "placeholder:text-[#b7becb] focus:border-[#0b2a4d] focus:bg-white focus:ring-2 focus:ring-[#0b2a4d]/10",
            icon ? "pl-[38px]" : "",
          ].join(" ")}
        />
      </div>
    </label>
  );
}
