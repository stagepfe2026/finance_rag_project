import { Link } from "react-router-dom";

type GuideCompletionPanelProps = {
  onReplayGuide: () => void;
};

export default function GuideCompletionPanel({ onReplayGuide }: GuideCompletionPanelProps) {
  return (
    <div className="guide-slide border-t border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-white text-xs font-bold text-emerald-600">OK</span>
          <div>
            <h3 className="text-sm font-bold text-[#273043]">Guide termine</h3>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">
              Vous pouvez revenir a l accueil ou revoir le parcours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReplayGuide}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-[#273043] transition hover:bg-slate-50"
          >
            Revoir
          </button>
          <Link
            to="/user/accueil"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#273043] px-2.5 text-[11px] font-semibold text-white transition hover:bg-[#1f2636]"
          >
            Retour accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
