import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  BotMessageSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Heart,
  Home,
  MessageSquareText,
  Pause,
  Play,
  RotateCcw,
  Search,
  TicketCheck,
  UserPen,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type GuideStep = {
  id: string;
  title: string;
  route: string;
  icon: typeof Home;
  summary: string;
  actions: string[];
};

const guideSteps: GuideStep[] = [
  {
    id: "accueil",
    title: "Accueil",
    route: "/user/accueil",
    icon: Home,
    summary: "Point de depart pour rechercher, ouvrir les actions rapides et suivre les dernieres informations.",
    actions: ["Utiliser la barre de recherche", "Ouvrir une action rapide", "Consulter les notifications recentes"],
  },
  {
    id: "documents",
    title: "Recherche documents",
    route: "/user/documents/recherche",
    icon: FileSearch,
    summary: "Espace pour retrouver les documents avec mots-cles, categories, dates et favoris.",
    actions: ["Saisir un mot-cle", "Filtrer par nom, categorie ou date", "Ajouter un document aux favoris"],
  },
  {
    id: "chat",
    title: "Chat",
    route: "/user/chat",
    icon: MessageSquareText,
    summary: "Assistant de discussion pour poser une question et exploiter les sources documentaires.",
    actions: ["Creer une nouvelle conversation", "Poser une question", "Consulter les sources de la reponse"],
  },
  {
    id: "reclamations",
    title: "Reclamations",
    route: "/user/reclamations",
    icon: TicketCheck,
    summary: "Suivi des demandes, creation de reclamation et lecture des reponses admin.",
    actions: ["Creer une reclamation", "Filtrer par statut ou lecture", "Ouvrir le detail d un ticket"],
  },
  {
    id: "profil",
    title: "Profil",
    route: "/user/profil",
    icon: UserPen,
    summary: "Page pour verifier et mettre a jour les informations personnelles et professionnelles.",
    actions: ["Modifier les champs", "Changer la photo", "Enregistrer les informations"],
  },
];

const guideStepDurationMs = 3600;

function GuideBubble({ className, children }: { className: string; children: string }) {
  return (
    <div
      className={[
        "pointer-events-none absolute z-20 max-w-[220px] rounded-xl border border-red-100 bg-white px-3 py-2 text-[11px] font-semibold leading-4 text-[#273043] shadow-[0_14px_34px_rgba(15,23,42,0.14)]",
        className,
      ].join(" ")}
    >
      <span className="mb-1 block h-1.5 w-8 rounded-full bg-[#9d0208]" />
      {children}
    </div>
  );
}

function BrowserFrame({ step }: { step: GuideStep }) {
  if (step.id === "documents") {
    return (
      <div className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <GuideBubble className="right-5 top-5">
          Cette barre permet de chercher un document avec un mot-cle.
        </GuideBubble>
        <GuideBubble className="bottom-5 left-5">
          Les filtres limitent les resultats par nom, categorie ou date.
        </GuideBubble>
        <GuideBubble className="bottom-5 right-5">
          Le coeur ajoute rapidement le document aux favoris.
        </GuideBubble>
        <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
          <Search size={14} className="text-[#9d0208]" />
          <span className="h-2 w-40 rounded-full bg-slate-300" />
          <span className="ml-auto h-6 w-16 rounded-lg bg-[#273043]" />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[190px_minmax(0,1fr)]">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="block h-2 w-20 rounded-full bg-slate-300" />
            <span className="block h-8 rounded-lg bg-white" />
            <span className="block h-2 w-24 rounded-full bg-slate-300" />
            <span className="block h-8 rounded-lg bg-white" />
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <span className="h-9 w-9 rounded-lg bg-red-50" />
                <div className="min-w-0 flex-1 space-y-2">
                  <span className="block h-2 w-4/5 rounded-full bg-slate-300" />
                  <span className="block h-2 w-1/2 rounded-full bg-slate-200" />
                </div>
                <Heart size={16} className="text-[#9d0208]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step.id === "chat") {
    return (
      <div className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <GuideBubble className="left-5 top-5">
          La colonne gauche conserve vos conversations precedentes.
        </GuideBubble>
        <GuideBubble className="bottom-5 right-5">
          Ecrivez une question ici pour interroger les documents.
        </GuideBubble>
        <div className="grid h-full gap-3 md:grid-cols-[190px_minmax(0,1fr)]">
          <div className="rounded-lg bg-[#273043] p-3">
            <span className="block h-8 rounded-lg bg-white/15" />
            <div className="mt-4 space-y-2">
              <span className="block h-8 rounded-lg bg-white/20" />
              <span className="block h-8 rounded-lg bg-white/10" />
              <span className="block h-8 rounded-lg bg-white/10" />
            </div>
          </div>
          <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-1 flex-col gap-3">
              <div className="max-w-[70%] rounded-lg bg-white p-3 shadow-sm">
                <span className="block h-2 w-36 rounded-full bg-slate-300" />
              </div>
              <div className="ml-auto max-w-[72%] rounded-lg bg-[#9d0208] p-3">
                <span className="block h-2 w-40 rounded-full bg-white/70" />
              </div>
              <div className="max-w-[78%] rounded-lg bg-white p-3 shadow-sm">
                <BotMessageSquare size={16} className="mb-2 text-[#9d0208]" />
                <span className="block h-2 w-full rounded-full bg-slate-300" />
                <span className="mt-2 block h-2 w-2/3 rounded-full bg-slate-200" />
              </div>
            </div>
            <span className="mt-3 block h-10 rounded-lg bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (step.id === "reclamations") {
    return (
      <div className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <GuideBubble className="right-5 top-5">
          Ce bouton ouvre le formulaire pour creer une nouvelle reclamation.
        </GuideBubble>
        <GuideBubble className="bottom-5 left-5">
          Cliquez sur une ligne pour lire le detail et les reponses.
        </GuideBubble>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="block h-3 w-36 rounded-full bg-slate-300" />
            <span className="mt-2 block h-2 w-56 rounded-full bg-slate-200" />
          </div>
          <span className="h-9 w-36 rounded-lg bg-[#273043]" />
        </div>
        <div className="mt-3 rounded-lg border border-slate-200">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0">
              <span className="h-6 rounded-full bg-slate-100" />
              <span className="h-6 rounded-full bg-slate-200" />
              <span className="h-6 rounded-full bg-red-50" />
              <span className="h-6 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step.id === "profil") {
    return (
      <div className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <GuideBubble className="left-5 top-5">
          Cette zone resume votre identite et votre photo.
        </GuideBubble>
        <GuideBubble className="right-5 top-5">
          Modifiez vos informations puis enregistrez les changements.
        </GuideBubble>
        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="rounded-lg border border-slate-200 p-4 text-center">
            <span className="mx-auto block h-20 w-20 rounded-full bg-slate-100" />
            <span className="mx-auto mt-4 block h-2 w-24 rounded-full bg-slate-300" />
            <span className="mx-auto mt-2 block h-2 w-16 rounded-full bg-red-100" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 p-3">
                <span className="block h-2 w-20 rounded-full bg-slate-300" />
                <span className="mt-2 block h-8 rounded-lg bg-slate-50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <GuideBubble className="right-5 top-5">
        Les notifications affichent les nouveautes importantes.
      </GuideBubble>
      <GuideBubble className="bottom-5 left-5">
        Les cartes rapides ouvrent directement les pages principales.
      </GuideBubble>
      <div className="relative h-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="block h-4 w-32 rounded-full bg-slate-300" />
            <span className="mt-2 block h-2 w-56 rounded-full bg-slate-200" />
          </div>
          <BellRing size={18} className="text-[#9d0208]" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[FileSearch, MessageSquareText, TicketCheck, BellRing].map((Icon, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
              <Icon size={17} className="text-[#9d0208]" />
              <span className="mt-4 block h-2 w-20 rounded-full bg-slate-300" />
              <span className="mt-2 block h-2 w-14 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UserGuidePage() {
  const [activeStepId, setActiveStepId] = useState(guideSteps[0].id);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasFinished, setHasFinished] = useState(false);
  const activeStepIndex = Math.max(0, guideSteps.findIndex((step) => step.id === activeStepId));
  const activeStep = useMemo(
    () => guideSteps.find((step) => step.id === activeStepId) ?? guideSteps[0],
    [activeStepId],
  );
  const ActiveIcon = activeStep.icon;
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

  return (
    <div className="h-screen overflow-hidden bg-slate-50 px-4 py-4">
      <style>
        {`
          @keyframes guideSlideIn {
            from { opacity: 0; transform: translateY(12px) scale(0.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes guideStepProgress {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }

          @keyframes guideGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(157, 2, 8, 0.18); }
            50% { box-shadow: 0 0 0 8px rgba(157, 2, 8, 0.04); }
          }

          .guide-slide {
            animation: guideSlideIn 420ms ease-out both;
          }

          .guide-glow {
            animation: guideGlow 1800ms ease-in-out infinite;
          }
        `}
      </style>

      <div className="mx-auto grid h-full w-full gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="px-2 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9d0208]">Guide</p>
            <h1 className="mt-2 text-xl font-bold text-[#273043]">Utiliser l espace user</h1>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Parcourez les principales pages avec des captures simplifiees.
            </p>
          </div>

          <div className="mt-3 space-y-1.5">
            {guideSteps.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep.id === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => selectStep(step.id)}
                  className={[
                    "relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition",
                    isActive ? "bg-[#273043] text-white" : "text-slate-600 hover:bg-slate-50 hover:text-[#273043]",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  {step.title}
                  {isActive && isPlaying ? (
                    <span
                      className="absolute bottom-0 left-0 h-1 w-full origin-left bg-[#9d0208]"
                      style={{ animation: `guideStepProgress ${guideStepDurationMs}ms linear forwards` }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-[13px] font-semibold text-[#45556f]">
              <span>Progression</span>
              <span className="text-[#9d0208]">{guideProgress}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-[#9d0208] transition-all" style={{ width: `${guideProgress}%` }} />
            </div>
          </div>
        </aside>

        <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#9d0208]">
                <ActiveIcon size={20} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Page user</p>
                <h2 className="mt-1 text-xl font-bold text-[#273043]">{activeStep.title}</h2>
                <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">{activeStep.summary}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={activeStepIndex === 0}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:text-[#273043] disabled:cursor-not-allowed disabled:opacity-40"
                title="Etape precedente"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setHasFinished(false);
                  setIsPlaying((current) => !current);
                }}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#273043] transition hover:bg-slate-50"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? "Pause" : "Lecture"}
              </button>

              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:text-[#273043]"
                title="Etape suivante"
              >
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={replayGuide}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#273043] transition hover:bg-slate-50"
              >
                <RotateCcw size={14} />
                Revoir
              </button>

              <Link
                to={activeStep.route}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#9d0208] px-3 text-xs font-semibold text-white transition hover:bg-[#870106]"
              >
                Ouvrir la page
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div key={activeStep.id} className="guide-slide mt-4 min-h-0 flex-1">
            <BrowserFrame step={activeStep} />
          </div>

          {hasFinished ? (
            <div className="guide-slide mt-4 shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="guide-glow inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-emerald-800">Guide termine</h3>
                    <p className="mt-1 text-sm text-emerald-700">
                      Vous pouvez revenir a l accueil ou revoir le parcours.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={replayGuide}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <RotateCcw size={14} />
                    Revoir
                  </button>
                  <Link
                    to="/user/accueil"
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#273043] px-3 text-xs font-semibold text-white transition hover:bg-[#1f2636]"
                  >
                    <ArrowLeft size={14} />
                    Retour accueil
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid shrink-0 gap-3 md:grid-cols-3">
              {activeStep.actions.map((action, index) => (
                <div key={action} className="guide-slide rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#9d0208]">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[#273043]">{action}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
