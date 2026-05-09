import { LoginForm } from "./composants/LoginForm";
import { LoginHeader } from "./composants/LoginHeader";
import loginImage from "../assets/login.png";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <section className="relative hidden min-h-screen w-[52%] overflow-hidden bg-[#171717] lg:block">
        <img
          src={loginImage}
          alt="Ministere des Finances"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
      </section>

      <section className="flex min-h-screen flex-1 items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-[560px]">
          <LoginHeader />
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
