import { useEffect, useMemo, useState } from "react";
import GuideAnimations from "../components/guide/GuideAnimations";
import GuideBrowserFrame from "../components/guide/GuideBrowserFrame";
import GuideCompletionPanel from "../components/guide/GuideCompletionPanel";
import GuideHeader from "../components/guide/GuideHeader";
import GuideSidebar from "../components/guide/GuideSidebar";
import { guideStepDurationMs, guideSteps } from "../components/guide/guideSteps";

export default function UserGuidePage() {
  const [activeStepId, setActiveStepId] = useState(guideSteps[0].id);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasFinished, setHasFinished] = useState(false);
  const activeStepIndex = Math.max(0, guideSteps.findIndex((step) => step.id === activeStepId));
  const activeStep = useMemo(
    () => guideSteps.find((step) => step.id === activeStepId) ?? guideSteps[0],
    [activeStepId],
  );
  const guideProgress = hasFinished ? 100 : Math.round(((activeStepIndex + 1) / guideSteps.length) * 100);

  useEffect(() => {
    document.title = "Guide utilisateur | CIMF";
  }, []);

  useEffect(() => {
    if (!isPlaying || hasFinished) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (activeStepIndex >= guideSteps.length - 1) {
        setHasFinished(true);
        setIsPlaying(false);
        return;
      }

      setActiveStepId(guideSteps[activeStepIndex + 1].id);
    }, guideStepDurationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeStepIndex, hasFinished, isPlaying]);

  function selectStep(stepId: string) {
    setActiveStepId(stepId);
    setHasFinished(false);
    setIsPlaying(false);
  }

  function goToPreviousStep() {
    setHasFinished(false);
    setIsPlaying(false);
    setActiveStepId(guideSteps[Math.max(0, activeStepIndex - 1)].id);
  }

  function goToNextStep() {
    if (activeStepIndex >= guideSteps.length - 1) {
      setHasFinished(true);
      setIsPlaying(false);
      return;
    }

    setHasFinished(false);
    setIsPlaying(false);
    setActiveStepId(guideSteps[activeStepIndex + 1].id);
  }

  function replayGuide() {
    setActiveStepId(guideSteps[0].id);
    setHasFinished(false);
    setIsPlaying(true);
  }

  function togglePlay() {
    setHasFinished(false);
    setIsPlaying((current) => !current);
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100 p-3">
      <GuideAnimations />

      <div className="mx-auto grid h-full w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:grid-cols-[250px_minmax(0,1fr)]">
        <GuideSidebar
          steps={guideSteps}
          activeStep={activeStep}
          guideProgress={guideProgress}
          isPlaying={isPlaying}
          onSelectStep={selectStep}
        />

        <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white">
          <GuideHeader
            activeStep={activeStep}
            activeStepIndex={activeStepIndex}
            isPlaying={isPlaying}
            onPreviousStep={goToPreviousStep}
            onNextStep={goToNextStep}
            onReplayGuide={replayGuide}
            onTogglePlay={togglePlay}
          />

          <div key={activeStep.id} className="guide-slide min-h-0 flex-1 bg-white px-4 py-3">
            <GuideBrowserFrame step={activeStep} />
          </div>

          {hasFinished ? <GuideCompletionPanel onReplayGuide={replayGuide} /> : null}
        </main>
      </div>
    </div>
  );
}
