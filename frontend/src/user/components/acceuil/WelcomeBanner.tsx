type WelcomeBannerProps = {
  userName: string;
  imageSrc?: string;
};

export default function WelcomeBanner({
  userName,
  imageSrc,
}: WelcomeBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-6 py-6">
      <div className="max-w-xl">
        <h1 className="text-xl font-bold text-slate-900">
          Bonjour {userName},
        </h1>

        <p className="mt-2 text-sm text-slate-700">
          Bienvenue dans votre espace documentaire.
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Accédez facilement aux documents et informations.
        </p>
      </div>

      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Bâtiment CIMF"
          className="absolute -bottom-2 right-6 h-full w-auto object-contain grayscale opacity-40"
        />
      ) : null}
    </section>
  );
}