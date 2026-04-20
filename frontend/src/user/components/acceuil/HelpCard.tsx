import React from "react";

export default function HelpCard() {
  return (
    <div className="rounded-xl bg-[#142850] p-5 text-white">
      <h2 className="text-sm font-semibold">Besoin d’aide ?</h2>

      <p className="mt-2 text-xs text-slate-200">
        Consultez notre guide ou contactez le support.
      </p>

      <button className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-semibold text-[#142850]">
        Voir le guide
      </button>
    </div>
  );
}