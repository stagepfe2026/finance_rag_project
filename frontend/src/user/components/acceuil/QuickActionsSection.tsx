import { Link } from "react-router-dom";

import SectionCard from "./SectionCard";
import type { QuickAction } from "./types/acceuil.types";

type Props = {
  actions: QuickAction[];
};

export default function QuickActionsSection({ actions }: Props) {
  return (
    <SectionCard title="Actions rapides">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) =>
          action.href ? (
            <Link
              key={action.id}
              to={action.href}
              className="flex min-h-32 flex-col justify-between rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
            >
              <div>
                <h3 className="text-sm font-semibold leading-6 text-slate-900">{action.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{action.description}</p>
              </div>
              <div className="mt-3 text-right text-lg text-red-600">→</div>
            </Link>
          ) : (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="flex min-h-32 flex-col justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-300"
            >
              <div>
                <h3 className="text-sm font-semibold leading-6 text-slate-900">{action.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{action.description}</p>
              </div>
              <div className="mt-3 text-right text-lg text-red-600">→</div>
            </button>
          ),
        )}
      </div>
    </SectionCard>
  );
}
