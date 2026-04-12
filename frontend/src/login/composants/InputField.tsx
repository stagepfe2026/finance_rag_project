import type { ReactNode } from "react";

interface InputFieldProps {
  type: string;
  placeholder: string;
  icon?: ReactNode;
}

export function InputField({ type, placeholder, icon }: InputFieldProps) {
  return (
    <div className="relative w-full">
      {icon ? (
        <span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[#9ca3af]">
          {icon}
        </span>
      ) : null}

      <input
        type={type}
        placeholder={placeholder}
        className="h-[37px] w-full rounded-[7px] border border-[#ddd7d6] bg-[rgba(255,255,255,0.82)] pl-[38px] pr-3 text-[13px] text-[#4a4a4a] outline-none placeholder:text-[#9aa1ad] focus:border-[#d0c7c6] focus:ring-0"
        style={{ boxShadow: "0 2px 10px rgba(255,255,255,0.55) inset" }}
      />
    </div>
  );
}
