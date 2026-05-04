import type { ChatFeedbackRecentDislike } from "../../../models/chat-feedback";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function RecentDislikes({ items }: { items: ChatFeedbackRecentDislike[] }) {
  return (
    <section className="rounded border border-[#e5eaf2] rounded-lg bg-white">
      <div className="border-b border-[#e5eaf2] px-4 py-3">
        <h2 className="mt-0.5 text-xs font-bold text-[#071f3d]">Dernières mauvaises réponses</h2>
      </div>

      <div className="grid gap-3 p-4">
        {items.slice(0, 3).map((item) => (
          <article key={item.messageId} className="rounded border border-[#e5eaf2] bg-[#f7f9fc] px-3 py-2">
            <p className="line-clamp-2 text-[11px] leading-5 text-[#5f6680]">{item.content}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#9d0208]">
              {item.sources.map((source) => source.documentName).join(", ") || "Dislike sans source"}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-[#071f3d]">
              {item.isSignalement ? "Signalement document" : "Pas un signalement document"}
            </p>
            <p className="mt-1 text-[10px] text-[#8a96ad]">{formatDate(item.feedbackAt)}</p>
          </article>
        ))}

        {items.length === 0 ? <p className="text-[12px] text-[#8a96ad]">Aucun dislike récent.</p> : null}
      </div>
    </section>
  );
}
