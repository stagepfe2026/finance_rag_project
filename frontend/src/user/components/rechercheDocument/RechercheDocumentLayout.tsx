import type { ReactNode } from "react";

type Props = {
  filters: ReactNode;
  searchBar: ReactNode;
  resultsHeader: ReactNode;
  results: ReactNode;
  preview: ReactNode;
};

export default function RechercheDocumentLayout({
  filters,
  searchBar,
  resultsHeader,
  results,
  preview,
}: Props) {
  return (
    <div className="min-h-screen bg-[#f8f4f3]">
      <div className="mx-auto w-full">
        <div className="grid items-start gap-4 xl:grid-cols-[250px_minmax(0,1fr)_340px]">
          <div className="">
            {filters}
          </div>

          <section className=" rounded-xl border border-[#efe3e1] bg-white p-3 shadow-sm">
            {searchBar}
            <div className="mt-3">{resultsHeader}</div>
            <div className="mt-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {results}
            </div>
          </section>

          <div className="">
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}