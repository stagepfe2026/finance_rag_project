import { LoginFooter } from "./composants/LoginFooter";
import { LoginForm } from "./composants/LoginForm";
import { LoginHeader } from "./composants/LoginHeader";

export default function LoginPage() {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
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
          backgroundImage:
            "radial-gradient(rgba(214,214,214,0.9) 0.55px, transparent 0.55px)",
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

      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center gap-0 px-6 py-10">
        <LoginHeader />
        <LoginForm />
        <LoginFooter />
      </div>
    </div>
  );
}
