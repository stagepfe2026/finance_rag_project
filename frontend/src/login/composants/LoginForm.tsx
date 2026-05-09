import { InputField } from "./InputField";

export function LoginForm() {
  return (
    <div className="flex w-full max-w-[560px] flex-col">
      <p className="text-[13px] font-semibold uppercase tracking-[0.44em] text-[#b3121b]">
        Portail officiel
      </p>
      <h1 className="mt-4 font-serif text-[40px] leading-none text-[#061f3d]">Connexion</h1>
      <p className="mt-4 text-[16px] text-[#8a94a5]">
        Identifiez-vous pour acceder a votre espace securise.
      </p>

      <div className="mt-12 w-full space-y-7">
        <InputField
          type="email"
          label="Adresse electronique"
          placeholder="prenom.nom@finances.gov.tn"
        />
        <InputField
          type="password"
          label="Mot de passe"
          placeholder="Votre mot de passe"
        />
      </div>

      <button
        className="mt-10 h-[54px] w-full rounded-[6px] bg-[#09284a] text-[14px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-[#061f3d]"
      >
        Se connecter
      </button>

      <div className="mt-9 h-px w-full bg-[#e6ebf1]" />
    </div>
  );
}
