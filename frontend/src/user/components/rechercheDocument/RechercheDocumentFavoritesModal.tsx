import { ArrowUpRight, Heart, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  documentCategoryLabels,
  type DocumentSearchItem,
} from "../../../models/document";

type Props = {
  open: boolean;
  items: DocumentSearchItem[];
  apiBaseUrl: string;
  onClose: () => void;
  onSelect: (item: DocumentSearchItem) => void;
  onToggleFavorite: (item: DocumentSearchItem) => void;
};

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function openDocumentInNewTab(apiBaseUrl: string, item: DocumentSearchItem) {
  window.open(
    `${apiBaseUrl}/api/v1/document-search/${item.id}/file`,
    "_blank",
    "noopener,noreferrer",
  );
}

export default function RechercheDocumentFavoritesModal({
  open,
  items,
  apiBaseUrl,
  onClose,
  onSelect,
  onToggleFavorite,
}: Props) {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setIsMounted(true);

      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => {
      setIsMounted(false);
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMounted, onClose]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        type="button"
        aria-label="Fermer le panneau des favoris"
        onClick={onClose}
        className={[
          "absolute inset-0 bg-[rgba(17,24,39,0.18)] transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      <aside
        className={[
          "absolute right-0 top-0 h-full w-[min(25vw,420px)] min-w-[320px] border-l border-slate-200 bg-white shadow-[-18px_0_40px_rgba(17,24,39,0.12)] transition-transform duration-200 ease-out",
          isVisible ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label="Mes Documents Favoris"
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 bg-white px-6 pb-5 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
               <h2 className="mt-2 text-[20px] font-bold text-[#9d0208]">
                  Mes Documents Favoris</h2>
                <p className="mt-2 text-[13px] text-slate-500">
                  {items.length} document{items.length > 1 ? "s" : ""} enregistre{items.length > 1 ? "s" : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#9d0208]"
                aria-label="Fermer le panneau des favoris"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {items.length === 0 ? (
              <div className="mx-6 mt-5 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-[13px] text-slate-500">
                Aucun document favori pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {items.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="cursor-pointer bg-white px-6 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-[#273043]">
                          {item.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-[#273043]">
                            {documentCategoryLabels[item.category]}
                          </span>
                          <span>{formatDate(item.realizedAt || item.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleFavorite(item);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#9d0208] transition hover:bg-slate-100"
                          title="Retirer des favoris"
                        >
                          <Heart size={17} className="fill-current" />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDocumentInNewTab(apiBaseUrl, item);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#9d0208]"
                          title="Consulter dans un nouvel onglet"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
