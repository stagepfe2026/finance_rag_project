import { InputField } from "./InputField";
import { Lock, User } from "lucide-react";

export function LoginForm() {
  return (
    <div className="mt-8 flex w-full max-w-[372px] flex-col items-center">
  
      <div className="w-full space-y-[12px]">
        <InputField type="text" placeholder="Nom d'utilisateur" icon={<User size={16} strokeWidth={1.9} />} />
        <InputField type="password" placeholder="Mot de passe" icon={<Lock size={16} strokeWidth={1.9} />} />
      </div>

      <a href="#" className="mt-4 text-[12px] font-medium text-[#e53935] transition hover:opacity-80">
        Mot de passe oublie ?
      </a>

      <button
        className="mt-5 h-[37px] w-full rounded-[6px] text-[14px] font-semibold text-white transition hover:opacity-95"
        style={{
          background: "linear-gradient(90deg, #ba1d29 0%, #e22635 100%)",
          boxShadow: "0 8px 22px rgba(198,40,40,0.22)",
        }}
      >
        Se connecter
      </button>
    </div>
  );
}
