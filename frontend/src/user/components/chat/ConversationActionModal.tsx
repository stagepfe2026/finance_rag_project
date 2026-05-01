import { useEffect, useState } from "react";

import type { Conversation } from "../../../models/chat";

type ConversationActionModalProps = {
  mode: "rename" | "archive" | "delete" | null;
  conversation: Conversation | null;
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (payload?: { summary: string }) => Promise<void> | void;
};

export default function ConversationActionModal({
  mode,
  conversation,
  open,
  busy = false,
  onClose,
  onConfirm,
}: ConversationActionModalProps) {
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (open && mode === "rename") {
      setSummary(conversation?.summary ?? "");
    }
  }, [conversation?.summary, mode, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [busy, onClose, open]);

  if (!open || !mode || !conversation) {
    return null;
  }

  const title =
    mode === "rename"
      ? "Renommer la conversation"
      : mode === "archive"
        ? "Archiver la conversation"
        : "Supprimer la conversation";

  const description =
    mode === "rename"
      ? "Choisissez un nouveau nom pour mieux organiser vos echanges."
      : mode === "archive"
        ? `La conversation "${conversation.summary}" sera deplacee dans les archives.`
        : `La conversation "${conversation.summary}" sera retiree de votre historique.`;

  const confirmLabel = mode === "rename" ? "Enregistrer" : mode === "archive" ? "Archiver" : "Supprimer";
  const confirmClassName =
    mode === "delete"
      ? "bg-[#9d0208] text-white hover:bg-[#9d0208]"
      : "bg-[#273043] text-white hover:bg-[#273043]";

  async function handleConfirm() {
    if (mode === "rename") {
      const normalizedSummary = summary.trim();
      if (!normalizedSummary) {
        return;
      }
      await onConfirm({ summary: normalizedSummary });
      return;
    }

    await onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.34)] px-4 py-6">
      <div className="w-full max-w-md rounded-xl border border-[#eadfdb] bg-white p-6 shadow-[0_24px_80px_rgba(17,24,39,0.18)]">
        <h2 className="text-[18px] font-semibold text-[#273043]">{title}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#746864]">{description}</p>

        {mode === "rename" ? (
          <div className="mt-5">
            <label className="mb-2 block text-[12px] font-medium text-[#5f5652]">Nom de la conversation</label>
            <input
              type="text"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              maxLength={120}
              autoFocus
              className="h-11 w-full rounded-xl border border-[#ddd3d0] bg-white px-4 text-[13px] text-[#273043] outline-none transition focus:border-[#273043]"
              placeholder="Saisissez un nouveau nom"
            />
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-[#ddd3d0] px-4 py-2 text-[13px] font-medium text-[#5f5652] transition hover:bg-[#faf7f6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy || (mode === "rename" && !summary.trim())}
            className={[
              "rounded-xl px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
              confirmClassName,
            ].join(" ")}
          >
            {busy ? "Traitement..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
