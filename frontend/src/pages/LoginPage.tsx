import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

function getHomePath(role: "ADMIN" | "FINANCE_USER"): string {
  return role === "ADMIN" ? "/admin/documents/import" : "/user/accueil";
}

function Icon({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authMessage, clearAuthMessage } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-10"
      style={{
        background: `
          radial-gradient(circle at 50% 16%, rgba(198, 40, 40, 0.10), transparent 14%),
          radial-gradient(circle at left 42%, rgba(225, 225, 225, 0.45), transparent 30%),
          radial-gradient(circle at right 72%, rgba(225, 225, 225, 0.42), transparent 28%),
          linear-gradient(180deg, #fbfaf9 0%, #f5f3f2 52%, #f8f7f6 100%)
        `,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(rgba(214,214,214,0.9) 0.55px, transparent 0.55px)",
          backgroundSize: "6px 6px",
        }}
      />

      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[40%] opacity-[0.5]"
        style={{
          background:
            "radial-gradient(ellipse at left center, rgba(210,210,210,0.24) 0%, rgba(210,210,210,0.10) 28%, transparent 60%)",
          filter: "blur(2px)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[40%] opacity-[0.5]"
        style={{
          background:
            "radial-gradient(ellipse at right center, rgba(210,210,210,0.22) 0%, rgba(210,210,210,0.10) 26%, transparent 58%)",
          filter: "blur(2px)",
        }}
      />

      <svg
        className="pointer-events-none absolute left-[-8%] top-[18%] h-[68%] w-[42%] opacity-[0.38]"
        viewBox="0 0 520 760"
        preserveAspectRatio="none"
      >
        <g fill="none" stroke="#ddd8d5" strokeWidth="1.2">
          <path d="M-80 110 C 100 90, 200 135, 340 220 C 410 262, 470 285, 560 295" />
          <path d="M-100 210 C 85 186, 200 236, 350 330 C 430 380, 495 405, 590 416" />
          <path d="M-95 330 C 98 305, 225 357, 382 452 C 460 499, 520 522, 608 534" />
          <path d="M-62 470 C 128 442, 255 490, 405 584 C 480 631, 540 656, 620 668" />
        </g>
      </svg>

      <svg
        className="pointer-events-none absolute bottom-[4%] right-[-7%] h-[58%] w-[40%] opacity-[0.34]"
        viewBox="0 0 520 760"
        preserveAspectRatio="none"
      >
        <g fill="none" stroke="#ddd8d5" strokeWidth="1.2">
          <path d="M620 130 C 452 142, 338 192, 206 286 C 132 338, 70 366, -10 384" />
          <path d="M640 254 C 462 266, 342 320, 196 420 C 122 470, 62 500, -18 520" />
          <path d="M630 394 C 460 410, 344 462, 214 554 C 146 602, 88 630, 14 646" />
          <path d="M604 540 C 446 554, 342 602, 230 680 C 168 724, 120 748, 54 758" />
        </g>
      </svg>

      <div
        className="pointer-events-none absolute left-1/2 top-[58px] h-[200px] w-[340px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(198,40,40,0.14) 0%, rgba(198,40,40,0.08) 24%, rgba(198,40,40,0.03) 46%, transparent 72%)",
          filter: "blur(16px)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center px-6 py-10 text-center">
        <div
          className="flex h-[86px] w-[86px] items-center justify-center rounded-full text-[18px] font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #b61825 0%, #d92632 100%)",
            boxShadow: "0 10px 28px rgba(198,40,40,0.22)",
          }}
        >
          MF
        </div>

        <h1 className="mt-5 text-[18px] font-medium leading-none text-[#303030]">Republique Tunisienne</h1>
        <p className="mt-2 text-[14px] leading-none text-[#8b8b8b]">Ministere des Finances</p>
        <div className="mt-6 h-px w-[92px] bg-[#e1dddd]" />

        <div className="mt-9 w-full max-w-[372px]">
          <h2 className="mb-[32px] text-center text-[17px] font-semibold text-[#242424]">
            rag_finance - PFE Ministere
          </h2>

          <form className="space-y-[12px]" onSubmit={onSubmit}>
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[#9ca3af]">
                <Icon size={16}>
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </Icon>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nom d'utilisateur"
                autoComplete="email"
                className="h-[40px] w-full rounded-[7px] border border-[#ddd7d6] bg-[rgba(255,255,255,0.82)] pl-[38px] pr-3 text-[13px] text-[#4a4a4a] outline-none placeholder:text-[#9aa1ad] focus:border-[#d0c7c6] focus:ring-0"
                style={{ boxShadow: "0 2px 10px rgba(255,255,255,0.55) inset" }}
              />
            </div>

            <div className="relative w-full">
              <span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-[#9ca3af]">
                <Icon size={16}>
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </Icon>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                autoComplete="current-password"
                className="h-[40px] w-full rounded-[7px] border border-[#ddd7d6] bg-[rgba(255,255,255,0.82)] pl-[38px] pr-10 text-[13px] text-[#4a4a4a] outline-none placeholder:text-[#9aa1ad] focus:border-[#d0c7c6] focus:ring-0"
                style={{ boxShadow: "0 2px 10px rgba(255,255,255,0.55) inset" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <Icon size={16}>
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
                    <path d="M9.36 5.56A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.17 13.17 0 0 1-4.16 4.91" />
                    <path d="M6.23 6.23A13.16 13.16 0 0 0 2 12s3 7 10 7a10.94 10.94 0 0 0 2.44-.28" />
                  </Icon>
                ) : (
                  <Icon size={16}>
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </Icon>
                )}
              </button>
            </div>

            <a href="#" className="block pt-1 text-[12px] font-medium text-[#e53935] transition hover:opacity-80">
              Mot de passe oublie ?
            </a>

            {authMessage ? (
              <div className="rounded-xl border border-[rgba(218,61,32,0.28)] bg-[rgba(218,61,32,0.10)] px-4 py-2.5 text-left text-[11px] font-semibold text-[#DA3D20]">
                {authMessage}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-[rgba(218,61,32,0.28)] bg-[rgba(218,61,32,0.10)] px-4 py-2.5 text-left text-[11px] font-semibold text-[#DA3D20]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-[37px] w-full rounded-[6px] text-[14px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "linear-gradient(90deg, #ba1d29 0%, #e22635 100%)",
                boxShadow: "0 8px 22px rgba(198,40,40,0.22)",
              }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <div className="mt-[30px] flex flex-col items-center text-center">
          <div className="mb-4 h-px w-[372px] bg-[#e7e2e1]" />
          <p className="text-[12px] text-[#7b7f87]">© Ministere des Finances | Tous droits reserves</p>
          <p className="mt-2 text-[12px] text-[#8e939b]">Acces reserve aux utilisateurs autorises</p>
        </div>
      </div>
    </div>
  );
}
