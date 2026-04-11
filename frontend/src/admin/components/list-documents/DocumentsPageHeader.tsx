import { Download, FileText } from "lucide-react";

export default function DocumentsPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-[18px] font-semibold tracking-tight text-[#111111] md:text-[19px]">
          Documents <span className="text-[#cf2027]">indexés</span>
        </h1>
        <p className="mt-1 text-[12px] text-[#7a7472]">
          Administration documentaire ministérielle
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button className="inline-flex h-8 items-center gap-2 rounded-full bg-white px-3 text-[12px] font-medium text-[#6f6968] shadow-sm ring-1 ring-[#efe8e6] hover:bg-[#fafafa]">
          <Download size={16} />
          Export Excel
        </button>

        <button className="inline-flex h-8 items-center gap-2 rounded-full bg-white px-3 text-[12px] font-medium text-[#6f6968] shadow-sm ring-1 ring-[#efe8e6] hover:bg-[#fafafa]">
          <FileText size={16} />
          Export PDF
        </button>
      </div>
    </div>
  );
}