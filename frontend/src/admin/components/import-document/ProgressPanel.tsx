import type { ProgressStep } from "../../../models/import-document";

type ProgressPanelProps = {
  steps: ProgressStep[];
};

export default function ProgressPanel({ steps }: ProgressPanelProps) {
  return (
    <div className="rounded-lg border border-[#e5eaf2] bg-white">
      <div className="border-b border-[#e5eaf2] px-4 py-2">
        <h2 className="text-sm font-bold text-[#071f3d]">Progression</h2>
      </div>

      <div className="px-4 py-3">
        <div className="space-y-1">
          {steps.map((step, index) => {
            const tone =
              step.status === "done"
                ? "bg-red-700 text-white"
                : step.status === "current"
                  ? "bg-[#9d0208] text-white"
                  : step.status === "error"
                    ? "bg-[#fce8e7] text-[#9d0208]"
                    : "bg-gray-200 text-gray-600";

            return (
              <div key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${tone}`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 ? <div className="mt-1.5 h-7 w-px bg-gray-200" /> : null}
                </div>

                <div className="min-w-0 pt-0.5">
                  <p className={`text-[12px] font-semibold ${step.status === "current" || step.status === "error" ? "text-[#9d0208]" : "text-[#071f3d]"}`}>
                    {step.label}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-[#8a96ad]">{step.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
