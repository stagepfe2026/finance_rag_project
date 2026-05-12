import { Link } from "react-router-dom";
import type { GuideStep } from "./guideSteps";

type GuideHeaderProps = {
  activeStep: GuideStep;
  activeStepIndex: number;
  isPlaying: boolean;
  onPreviousStep: () => void;
  onNextStep: () => void;
  onReplayGuide: () => void;
  onTogglePlay: () => void;
};

export default function GuideHeader({
  activeStep,
  activeStepIndex,
  isPlaying,
  onPreviousStep,
  onNextStep,
  onReplayGuide,
  onTogglePlay,
}: GuideHeaderProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 font-sans">
      <div className="flex min-w-0 items-start gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm font-semibold text-[#9d0208]">
          {activeStepIndex + 1}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">{activeStep.title}</h2>
          <p className="mt-0.5 max-w-3xl text-xs leading-5 text-gray-600">{activeStep.summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPreviousStep}
          disabled={activeStepIndex === 0}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          title="Etape precedente"
        >
          <span className="text-sm leading-none">‹</span>
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-[11px] font-medium text-gray-900 transition hover:bg-gray-50"
        >
          {isPlaying ? "Pause" : "Lecture"}
        </button>

        <button
          type="button"
          onClick={onNextStep}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition hover:text-gray-900"
          title="Etape suivante"
        >
          <span className="text-sm leading-none">›</span>
        </button>

        <button
          type="button"
          onClick={onReplayGuide}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-[11px] font-medium text-gray-900 transition hover:bg-gray-50"
        >
          Revoir
        </button>

        <Link
          to={activeStep.route}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#9d0208] px-2.5 text-[11px] font-semibold text-white transition hover:bg-[#870106]"
        >
          Ouvrir la page
        </Link>
      </div>
    </div>
  );
}
