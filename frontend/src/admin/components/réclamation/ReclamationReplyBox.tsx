// ReclamationReplyBox.tsx
type ReclamationReplyBoxProps = {
  adminReply: string;
  alreadyHandled: boolean;
  adminReplyBy: string | null;
  isSubmitting: boolean;
  onReplyChange: (value: string) => void;
  onSubmit: () => void;
};

export default function ReclamationReplyBox({
  adminReply,
  alreadyHandled,
  adminReplyBy,
  isSubmitting,
  onReplyChange,
  onSubmit,
}: ReclamationReplyBoxProps) {
  return (
    <div>
      {alreadyHandled ? (
        <p className="mb-2 rounded bg-emerald-50 px-3 py-1.5 text-[11px] leading-relaxed text-emerald-800 border border-emerald-200">
          Traitée par <span className="font-semibold">{adminReplyBy ?? "un administrateur"}</span>. Envoi désactivé.
        </p>
      ) : null}

      <textarea
        rows={4}
        value={adminReply}
        onChange={(e) => onReplyChange(e.target.value)}
        disabled={alreadyHandled}
        placeholder="Rédigez votre réponse officielle..."
        className="admin-reclamation-reply-input w-full rounded border border-[#dde3ed] bg-[#f8fafc] px-3 py-2 text-[12px] text-[#071f3d] outline-none transition focus:border-[#9d0208] disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-[#8a96ad]">
          Agent : {adminReplyBy ?? "—"}
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || alreadyHandled}
          className="rounded bg-[#9d0208] cursor-pointer px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#7b0206] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
