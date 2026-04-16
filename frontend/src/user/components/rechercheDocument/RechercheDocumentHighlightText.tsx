import type { ReactNode } from "react";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getSearchTerms(query: string) {
  return query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term, index, array) => term.length > 1 && array.indexOf(term) === index);
}

type RechercheDocumentHighlightTextProps = {
  text: string;
  query: string;
};

export default function RechercheDocumentHighlightText({
  text,
  query,
}: RechercheDocumentHighlightTextProps): ReactNode {
  const terms = getSearchTerms(query);

  if (!text || terms.length === 0) {
    return text;
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = terms.some((term) => part.toLowerCase() === term.toLowerCase());

    if (!isMatch) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-[#fde7be] px-1 py-0.5 text-[#7d2f19]"
      >
        {part}
      </mark>
    );
  });
}