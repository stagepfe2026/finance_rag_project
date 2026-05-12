import type { ReactNode } from "react";

type Props = {
  filters: ReactNode;
  searchBar: ReactNode;
  resultsHeader: ReactNode;
  results: ReactNode;
  preview?: ReactNode;
};

export default function RechercheDocumentLayout({
  filters,
  searchBar,
  resultsHeader,
  results,
  preview,
}: Props) {
  return (
    <div className="h-[calc(100vh-83px)] overflow-hidden bg-slate-50 px-4 py-4">
      <div className="mx-auto h-full w-full">
        <div
          className={[
            "grid h-full items-start gap-4",
            preview
              ? "xl:grid-cols-[250px_minmax(0,1fr)_330px]"
              : "xl:grid-cols-[250px_minmax(0,1fr)]",
          ].join(" ")}
        >
          <div className="h-full min-h-0">
            {filters}
          </div>

          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {searchBar}
            <div className="mt-3">{resultsHeader}</div>
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
              {results}
            </div>
          </section>

          {preview ? <div className="h-full min-h-0">{preview}</div> : null}
        </div>
      </div>
    </div>
  );
}
