import type { ReactNode } from "react";
import type { GuideStep } from "./guideSteps";

type GuideBrowserFrameProps = {
  step: GuideStep;
};

function StepNotes({ step }: { step: GuideStep }) {
  return (
    <aside className="rounded-md border border-gray-200 bg-gray-50 p-2 font-sans">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9d0208]">Etapes</p>
      <div className="mt-1.5 space-y-1">
        {step.actions.map((action, index) => (
          <div key={action.title} className="rounded-md border border-gray-200 bg-white px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-red-50 text-[10px] font-semibold text-[#9d0208]">
                {index + 1}
              </span>
              <p className="truncate text-[11px] font-medium text-gray-900">{action.title}</p>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-gray-500">{action.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-md border border-gray-200 border-l-2 border-l-[#9d0208] bg-white px-2.5 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9d0208]">Resultat attendu</p>
        <p className="mt-1 line-clamp-3 text-[10px] leading-4 text-gray-600">{step.result}</p>
      </div>
    </aside>
  );
}

function MockupShell({ title, step, children }: { title: string; step: GuideStep; children: ReactNode }) {
  return (
    <section className="h-full min-h-[240px] overflow-hidden rounded-md border border-gray-200 bg-white font-sans shadow-sm">
      <div className="flex h-8 items-center justify-between border-b border-gray-200 bg-gray-50 px-3">
        <span className="h-1.5 w-20 rounded-full bg-gray-200" />
        <p className="text-[11px] font-medium text-gray-500">{title}</p>
      </div>
      <div className="grid h-[calc(100%-32px)] min-h-0 gap-2 overflow-hidden bg-white p-2 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-h-0 overflow-hidden">{children}</div>
        <StepNotes step={step} />
      </div>
    </section>
  );
}

function AreaLabel({ children }: { children: string }) {
  return <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{children}</p>;
}

function StepMarker({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span
      className={[
        "absolute z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#9d0208] text-[10px] font-bold text-white shadow-sm ring-2 ring-white",
        className,
      ].join(" ")}
    >
      {value}
    </span>
  );
}

export default function GuideBrowserFrame({ step }: GuideBrowserFrameProps) {
  if (step.id === "documents") {
    return (
      <MockupShell title="Recherche documents" step={step}>
        <div className="grid h-full gap-2 lg:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="relative rounded-md border border-gray-200 bg-gray-50 p-2.5">
            <StepMarker value={2} className="right-2 top-2" />
            <AreaLabel>Filtres</AreaLabel>
            <div className="space-y-1.5">
              <div className="rounded-md border border-gray-200 bg-white p-2">
                <span className="block h-2 w-20 rounded-full bg-slate-300" />
                <span className="mt-1.5 block h-7 rounded-md bg-gray-50" />
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-2">
                <span className="block h-2 w-24 rounded-full bg-slate-300" />
                <span className="mt-1.5 block h-7 rounded-md bg-gray-50" />
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <AreaLabel>Resultats</AreaLabel>
            <div className="relative flex h-8 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5">
              <StepMarker value={1} className="-left-2 -top-2" />
              <span className="h-3 w-3 rounded-full border border-[#9d0208]" />
              <span className="h-2 w-56 max-w-full rounded-full bg-slate-300" />
              <span className="ml-auto h-6 w-16 rounded-md bg-[#273043]" />
            </div>
            <div className="mt-2 space-y-1.5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-2">
                  <span className="h-8 w-8 rounded-md bg-red-50" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <span className="block h-2.5 w-4/5 rounded-full bg-slate-300" />
                    <span className="block h-2 w-1/2 rounded-full bg-slate-200" />
                  </div>
                  <span className="relative h-6 w-6 rounded-md border border-red-100 bg-red-50">
                    {item === 0 ? <StepMarker value={3} className="-right-2 -top-2" /> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MockupShell>
    );
  }

  if (step.id === "chat") {
    return (
      <MockupShell title="Chat" step={step}>
        <div className="grid h-full gap-2 lg:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="relative rounded-md bg-[#273043] p-2.5">
            <StepMarker value={1} className="right-2 top-2" />
            <AreaLabel>Conversations</AreaLabel>
            <span className="block h-8 rounded-md bg-white/15" />
            <div className="mt-2 space-y-1.5">
              <span className="block h-8 rounded-md bg-white/25" />
              <span className="block h-8 rounded-md bg-white/10" />
              <span className="block h-8 rounded-md bg-white/10" />
            </div>
          </aside>
          <div className="flex min-w-0 flex-col rounded-md border border-gray-200 bg-gray-50 p-2.5">
            <AreaLabel>Discussion</AreaLabel>
            <div className="flex flex-1 flex-col gap-2">
              <div className="max-w-[72%] rounded-md bg-white p-2 shadow-sm">
                <span className="block h-2.5 w-40 rounded-full bg-slate-300" />
              </div>
              <div className="ml-auto max-w-[74%] rounded-md bg-[#9d0208] p-2">
                <span className="block h-2.5 w-48 rounded-full bg-white/75" />
              </div>
              <div className="relative max-w-[80%] rounded-md bg-white p-2.5 shadow-sm">
                <StepMarker value={3} className="-right-2 -top-2" />
                <span className="mb-2 block h-5 w-5 rounded-md bg-red-50" />
                <span className="block h-2.5 w-full rounded-full bg-slate-300" />
                <span className="mt-2 block h-2.5 w-2/3 rounded-full bg-slate-200" />
              </div>
            </div>
            <span className="relative mt-2 block h-8 rounded-md border border-gray-200 bg-white">
              <StepMarker value={2} className="-left-2 -top-2" />
            </span>
          </div>
        </div>
      </MockupShell>
    );
  }

  if (step.id === "reclamations") {
    return (
      <MockupShell title="Reclamations" step={step}>
        <div className="h-full rounded-md border border-gray-200 bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 p-2.5">
            <div>
              <AreaLabel>Liste des demandes</AreaLabel>
              <span className="block h-2.5 w-56 rounded-full bg-slate-300" />
            </div>
            <span className="relative h-8 w-28 rounded-md bg-[#273043]">
              <StepMarker value={1} className="-right-2 -top-2" />
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2 px-2.5 py-2">
                <span className="h-6 rounded-full bg-slate-100" />
                <span className="h-6 rounded-full bg-slate-200" />
                <span className="relative h-6 rounded-full bg-red-50">
                  {item === 0 ? <StepMarker value={2} className="-right-2 -top-2" /> : null}
                </span>
                <span className="relative h-6 rounded-full bg-slate-100">
                  {item === 1 ? <StepMarker value={3} className="-right-2 -top-2" /> : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      </MockupShell>
    );
  }

  if (step.id === "profil") {
    return (
      <MockupShell title="Profil" step={step}>
        <div className="grid h-full gap-2 lg:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="relative rounded-md border border-gray-200 bg-gray-50 p-2.5 text-center">
            <StepMarker value={1} className="right-2 top-2" />
            <AreaLabel>Identite</AreaLabel>
            <span className="mx-auto block h-20 w-20 rounded-full bg-white ring-1 ring-slate-200" />
            <span className="mx-auto mt-4 block h-2.5 w-28 rounded-full bg-slate-300" />
            <span className="mx-auto mt-2 block h-2 w-20 rounded-full bg-red-100" />
          </aside>
          <div className="min-w-0">
            <AreaLabel>Informations</AreaLabel>
            <div className="grid gap-2 md:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="rounded-md border border-gray-200 bg-white p-2 shadow-sm">
                  <span className="block h-2 w-24 rounded-full bg-slate-300" />
                  <span className="relative mt-2 block h-8 rounded-md bg-slate-50">
                    {item === 0 ? <StepMarker value={2} className="-right-2 -top-2" /> : null}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative mt-2 ml-auto h-7 w-24 rounded-md bg-[#273043]">
              <StepMarker value={3} className="-right-2 -top-2" />
            </div>
          </div>
        </div>
      </MockupShell>
    );
  }

  return (
    <MockupShell title="Accueil" step={step}>
      <div className="flex h-full min-h-0 flex-col gap-3 bg-slate-50">
        <section className="relative overflow-hidden rounded-md border border-slate-200 bg-white px-4 py-4">
          <div className="max-w-[58%]">
            <span className="block h-3 w-36 rounded-full bg-slate-800" />
            <span className="mt-3 block h-2.5 w-52 rounded-full bg-slate-400" />
            <span className="mt-2 block h-2 w-44 rounded-full bg-slate-200" />
          </div>
          <div className="absolute -bottom-3 right-6 h-24 w-36 rounded-t-full bg-slate-200 opacity-60" />
        </section>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-[2fr_1fr]">
          <div className="flex min-h-0 flex-col gap-2">
            <section className="relative flex items-center gap-2 rounded-md border border-gray-200 bg-white p-2">
              <StepMarker value={1} className="-left-2 -top-2" />
              <span className="h-8 flex-1 rounded-md border border-slate-200 bg-slate-50" />
              <span className="h-8 w-20 rounded-md bg-[#273043]" />
            </section>

            <section className="relative rounded-md border border-gray-200 bg-white p-2.5">
              <StepMarker value={2} className="right-2 top-2" />
              <AreaLabel>Actions rapides</AreaLabel>
              <div className="grid gap-1.5 md:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="flex min-h-16 flex-col justify-between rounded-md border border-gray-200 p-2">
                    <div>
                      <span className="block h-2.5 w-24 rounded-full bg-slate-300" />
                      <span className="mt-2 block h-2 w-16 rounded-full bg-slate-200" />
                    </div>
                    <span className="ml-auto mt-2 h-3 w-5 rounded-full bg-red-100" />
                  </div>
                ))}
              </div>
            </section>

            <section className="min-h-0 flex-1 rounded-md border border-gray-200 bg-white p-2.5">
              <AreaLabel>Documents recents</AreaLabel>
              <div className="divide-y divide-slate-100">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="grid grid-cols-[2fr_1fr_80px] gap-3 py-2">
                    <span className="h-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 rounded-full bg-red-50" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="relative min-h-0 rounded-md border border-gray-200 bg-white p-2.5">
            <StepMarker value={3} className="right-2 top-2" />
            <AreaLabel>Notifications</AreaLabel>
            <div className="space-y-1.5">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="rounded-md border border-gray-100 bg-gray-50 p-2">
                  <span className="block h-2.5 w-4/5 rounded-full bg-slate-300" />
                  <span className="mt-2 block h-2 w-3/5 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </MockupShell>
  );
}
