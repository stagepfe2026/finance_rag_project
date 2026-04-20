import { useEffect, useRef, useState } from "react";
import { ChevronDown, Copy, Download, ThumbsUp} from "lucide-react";

import type { ChatSource } from "../../../models/chat";
import { downloadChatSource } from "../../../services/chat.service";
import { legalStatusLabels, legalRelationTypeLabels } from "../../../models/document";

type MessageActionsProps = {
  content: string;
  sources?: ChatSource[];
};

export default function MessageActions({
  content,
  sources = [],
}: MessageActionsProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hasSources = sources.length > 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!panelRef.current) {
        return;
      }

      if (!panelRef.current.contains(event.target as Node)) {
        setIsSourcesOpen(false);
      }
    }

    if (isSourcesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSourcesOpen]);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
  }

  function handleExport() {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reponse-assistant.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSourceDownload(source: ChatSource) {
    try {
      setDownloadError(null);
      if (!source.document_id) {
        throw new Error(
          "Cette source ne peut pas etre telechargee car son document n est pas reference.",
        );
      }
      await downloadChatSource(source.document_id, source.document_name);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "Impossible de telecharger la source.",
      );
    }
  }

  function formatDate(value?: string | null) {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(parsed);
  }

  function getLegalStatusLabel(value: string) {
    if (value in legalStatusLabels) {
      return legalStatusLabels[value as keyof typeof legalStatusLabels];
    }
    return value;
  }

  function getRelationLabel(value: string) {
    if (value in legalRelationTypeLabels) {
      return legalRelationTypeLabels[value as keyof typeof legalRelationTypeLabels];
    }
    return value;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {hasSources ? (
          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={() => setIsSourcesOpen((value) => !value)}
              className="flex items-center gap-2 rounded-xl border border-[#ddd3d0] bg-white px-3 py-1.5 text-[12px] text-[#5f5652] transition hover:bg-[#faf7f6]"
              aria-expanded={isSourcesOpen}
            >
              <Download size={14} />
              Sources utilisees
              <ChevronDown
                size={14}
                className={`transition ${isSourcesOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isSourcesOpen ? (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[320px] max-w-[440px] rounded-2xl border border-[#e7ddda] bg-white p-2 shadow-[0_12px_40px_rgba(28,18,15,0.12)]">
                <div className="max-h-[280px] overflow-y-auto">
                  {sources.map((source, index) => (
                    <div
                      key={`${source.document_id || source.document_name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition hover:bg-[#faf7f6]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-[#2f2725]">
                          {source.document_name}
                        </p>
                        <p className="text-[11px] text-[#8b7d79]">
                          {source.document_type || source.category}
                          {source.version ? ` · v${source.version}` : ""}
                        </p>
                        <p className="text-[11px] text-[#8b7d79]">
                          {getLegalStatusLabel(source.legal_status)}
                          {source.date_publication ? ` · publié le ${formatDate(source.date_publication)}` : ""}
                        </p>
                        {source.relation_type && source.relation_type !== "none" ? (
                          <p className="text-[11px] text-[#8b7d79]">
                            {getRelationLabel(source.relation_type)}
                            {source.related_document_title ? ` ${source.related_document_title}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSourceDownload(source)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#ddd3d0] bg-white text-[#5f5652] transition hover:bg-[#f4efed]"
                        title={`Telecharger ${source.document_name}`}
                        aria-label={`Telecharger ${source.document_name}`}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#5f5652] transition cursor-pointer hover:bg-[#E1DEDD] rounded-lg"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#5f5652] transition cursor-pointer hover:bg-[#E1DEDD] rounded-lg"
        >
          <Download size={14} />
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#5f5652] transition cursor-pointer hover:bg-[#E1DEDD] rounded-lg"
        >
          <ThumbsUp size={14} />
        </button>
        
      </div>

      {downloadError ? (
        <p className="text-[11px] text-[#b42318]">{downloadError}</p>
      ) : null}
    </div>
  );
}
