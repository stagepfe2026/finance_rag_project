import type { ProgressStep } from "../../../models/import-document";

type ProgressPanelProps = {
  steps: ProgressStep[];
};

export default function ProgressPanel({ steps }: ProgressPanelProps) {
  return (
    <div className="rounded-l border border-[#ede7e5] shadow-[0_10px_35px_rgba(87,51,39,0.04)]">
      <div className="border-b border-[#f0e8e6] px-4 py-3">
        <h2 className="border-l-2 border-[#cf2027] pl-2 text-[13px] font-semibold text-[#111111]">
          Progression
        </h2>
      </div>

      <div className="px-4 py-1">
        <div className="space-y-1">
          {steps.map((step, index) => {
            const tone =
              step.status === "done"
                ? "bg-red-700 text-white"
                : step.status === "current"
                  ? "bg-[#cf2027] text-white"
                  : step.status === "error"
                    ? "bg-[#fce8e7] text-[#cf2027]"
                    : "bg-gray-200 text-gray-600";

            return (
              <div key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${tone}`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 ? <div className="mt-1.5 h-7 w-px bg-gray-200" /> : null}
                </div>

                <div className="pt-0.5">
                  <p className={`text-[12px] font-medium ${step.status === "current" || step.status === "error" ? "text-[#cf2027]" : "text-[#111111]"}`}>
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-500">{step.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

