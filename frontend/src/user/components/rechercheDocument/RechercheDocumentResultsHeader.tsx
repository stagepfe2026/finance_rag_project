type Props = {
  total: number;
  query: string;
  error?: string;
};

export default function RechercheDocumentResultsHeader({
  total,
  query,
  error,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1e7e5] pb-2">
      <div>
        <p className="text-[12px] text-[#7d6c68]">
          {total} résultat{total > 1 ? "s" : ""}
          {query.trim() ? (
            <>
              {" "}pour <span className="font-semibold text-[#b2342c]">{query}</span>
            </>
          ) : null}
        </p>

        {error ? <p className="mt-1 text-[12px] text-[#b2342c]">{error}</p> : null}
      </div>
    </div>
  );
}
