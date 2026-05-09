import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import loginImage from "../assets/login.png";

function getHomePath(role: "ADMIN" | "FINANCE_USER"): string {
  return role === "ADMIN" ? "/admin/documents/import" : "/user/accueil";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authMessage, clearAuthMessage } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    typeof location.state === "object" && location.state && "from" in location.state
      ? String((location.state as { from?: unknown }).from ?? "")
      : "";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    clearAuthMessage();

    if (!email.trim() || !password.trim()) {
      setError("Email et mot de passe sont obligatoires.");
      return;
    }

    try {
      setLoading(true);
      const res = await login({ email, password });
      const target = from.startsWith("/") ? from : res.redirectTo || getHomePath("FINANCE_USER");
      navigate(target, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#fbfaf9]">
      <section className="relative hidden min-h-screen w-[56%] overflow-hidden bg-[#171717] lg:block">
        <img
          src={loginImage}
          alt="Ministere des Finances"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
      </section>

      <section className="flex min-h-screen flex-1 items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-[560px]">
         
          <h1 className="mt-4 font-serif text-3xl font-bold leading-none text-red-700">Connexion</h1>
         

          <form className="mt-12 space-y-7" onSubmit={onSubmit}>
            <label className="block w-full">
              <span className="mb-2 block text-[13px] font-semibold uppercase  text-[#24324a]">
                Adresse email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@finances.gov.tn"
                autoComplete="email"
                className="h-[35px] w-full rounded-[7px] border border-[#dce2ea] bg-[#f8f9fc] px-4 text-sm text-[#17233a] outline-none transition placeholder:text-[#b7becb] focus:border-[#0b2a4d] focus:bg-white focus:ring-2 focus:ring-[#0b2a4d]/10"
              />
            </label>

            <label className="block w-full">
              <span className="mb-2 block text-[13px] font-semibold uppercase  text-[#24324a]">
                Mot de passe
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                className="h-[35px] w-full rounded-[7px] border border-[#dce2ea] bg-[#f8f9fc] px-4 text-sm text-[#17233a] outline-none transition placeholder:text-[#b7becb] focus:border-[#0b2a4d] focus:bg-white focus:ring-2 focus:ring-[#0b2a4d]/10"
              />
            </label>

            {authMessage ? (
              <div className="rounded-[7px] border border-[rgba(218,61,32,0.28)] bg-[rgba(218,61,32,0.10)] px-4 py-3 text-left text-[12px] font-semibold text-[#DA3D20]">
                {authMessage}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[7px] border border-[rgba(218,61,32,0.28)] bg-[rgba(218,61,32,0.10)] px-4 py-3 text-left text-[12px] font-semibold text-[#DA3D20]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-[37px] w-full cursor-pointer rounded-[6px] bg-[#09284a] text-xs font-semibold uppercase  text-white transition hover:bg-[#0d4283] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-9 h-px w-full bg-[#e6ebf1]" />
        </div>
      </section>
    </div>
  );
}
