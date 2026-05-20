import { Link } from "react-router-dom";
import type { GuideStep } from "./guideSteps";
import { guideStepDurationMs } from "./guideSteps";

type GuideSidebarProps = {
  steps: GuideStep[];
  activeStep: GuideStep;
  guideProgress: number;
  isPlaying: boolean;
  onSelectStep: (stepId: string) => void;
};

export default function GuideSidebar({
  steps,
  activeStep,
  guideProgress,
  isPlaying,
  onSelectStep,
}: GuideSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-gray-200 bg-white font-sans">
      <div className="border-b border-gray-200 px-3.5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9d0208]">
          Guide d’aide
        </p>

        <h1 className="mt-1 text-base font-semibold text-gray-900">
          Parcours utilisateur
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {steps.map((step, index) => {
          const isActive = activeStep.id === step.id;

          return (
            <button
              key={step.id}
              type="button"
              aria-label={`Ouvrir l'etape du guide: ${step.title}`}
              aria-current={isActive ? "step" : undefined}
              onClick={() => onSelectStep(step.id)}
              className={[
                "relative mb-1 flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors duration-200",
                isActive
                  ? "user-guide-step-active bg-gray-100 text-gray-900"
                  : "user-guide-step text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  isActive
                    ? "user-guide-step-index-active bg-[#9d0208] text-white"
                    : "user-guide-step-index bg-gray-100 text-gray-500",
                ].join(" ")}
              >
                {index + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {step.title}
                </span>

                <span className="block truncate text-[10px] leading-4 text-gray-500">
                  {step.eyebrow}
                </span>
              </span>

              {isActive && isPlaying && (
                <span
                  className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-[#9d0208]"
                  style={{
                    animation: `guideStepProgress ${guideStepDurationMs}ms linear forwards`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-200 px-3.5 py-2.5">
        <div className="flex items-center justify-between text-[11px] text-gray-600">
          <span>Progression</span>

          <span className="font-semibold text-[#9d0208]">
            {guideProgress}%
          </span>
        </div>

        <div className="mt-1.5 h-1 rounded-full bg-gray-200">
          <div
            className="h-1 rounded-full bg-[#9d0208] transition-all duration-300"
            style={{ width: `${guideProgress}%` }}
          />
        </div>

        <Link
          to="/user/accueil"
          className="mt-3 flex h-8 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-[11px] font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
        >
          Quitter le guide
        </Link>
      </div>
    </aside>
  );
}
