import { AlertTriangle } from "lucide-react";
import type { Reclamation } from "../../../models/reclamation";

type ReclamationMessagesProps = {
  urgentItems: Reclamation[];
  onSelect: (reclamation: Reclamation) => void;
};

export default function ReclamationMessages({ urgentItems, onSelect }: ReclamationMessagesProps) {
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex min-w-max gap-3">
        {urgentItems.length === 0 ? (
          <div className="rounded border border-[#e5eaf2] bg-white px-4 py-3 text-sm text-[#8a96ad]">
            Aucune reclamation urgente en attente.
          </div>
        ) : (
          urgentItems.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => onSelect(item)}
              className="flex min-w-[260px] items-start gap-3 rounded border border-[#f3c6cc] bg-[#f5e6e7] px-4 py-3 text-left transition hover:bg-[#f1d7da]"
            >
              <span className="mt-1 rounded bg-white p-1 text-[#9d0208]">
                <AlertTriangle size={14} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#9d0208]">
                  {item.ticketNumber}
                </span>
                <span className="mt-1 block truncate text-xs text-[#9d0208]">{item.subject}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
