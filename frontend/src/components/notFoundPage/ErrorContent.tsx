import ActionButtons from "./ActionButtons";

type ErrorContentProps = {
  homePath: string;
  homeLabel: string;
  onBack: () => void;
};

export default function ErrorContent({ homePath, homeLabel, onBack }: ErrorContentProps) {
  return (
    <section className="max-w-md">
      <p className="text-[88px] font-extrabold leading-none tracking-tight text-[#111827] sm:text-[118px]">
        4<span className="text-[#d4001a]">0</span>4
      </p>
      <div className="mt-4 h-1 w-10 rounded bg-[#d4001a]" />
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#1f2937] sm:text-3xl">
        Page non <span className="text-[#d4001a]">trouvée</span>
      </h1>
      <p className="mt-5 max-w-xs text-[13px] leading-6 text-[#374151]">
        La page que vous recherchez n’existe pas ou a été déplacée.
      </p>
      <ActionButtons homePath={homePath} homeLabel={homeLabel} onBack={onBack} />
    </section>
  );
}
