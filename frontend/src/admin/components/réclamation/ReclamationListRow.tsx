import { AlertTriangle } from "lucide-react";
import type { Reclamation } from "../../../models/reclamation";
import {
  formatDate,
  getPriorityLabel,
  getStatusClassName,
  getStatusLabel,
} from "./reclamationHelpers";

type ReclamationListRowProps = {
  item: Reclamation;
  isSelected: boolean;
  onSelect: (reclamation: Reclamation) => void;
};

export default function ReclamationListRow({ item, isSelected, onSelect }: ReclamationListRowProps) {
  return (
    <tr
      onClick={() => onSelect(item)}
      className={`cursor-pointer transition ${isSelected ? "bg-[#f5e6e7]" : "hover:bg-[#f7f9fc]"}`}
    >
      <td className="border-b border-[#e5eaf2] px-4 py-3">
        <span className="rounded bg-[#eef2f8] px-2 py-0.5 text-[10px] font-semibold text-[#071f3d]">
          {item.ticketNumber}
        </span>
      </td>
      <td className="border-b border-[#e5eaf2] px-4 py-3 text-xs font-semibold text-[#071f3d]">
        <div className="max-w-[260px] truncate">{item.subject}</div>
      </td>
      <td className="border-b border-[#e5eaf2] px-4 py-3 text-xs text-[#5f6680]">
        <div className="max-w-[220px] truncate">{item.userEmail}</div>
      </td>
      <td className="border-b border-[#e5eaf2] px-4 py-3 text-xs text-[#5f6680]">
        {item.priority === "URGENT" ? (
          <span className="inline-flex items-center gap-1 rounded bg-[#f5e6e7] px-2 py-0.5 text-[10px] font-semibold text-[#9d0208]">
            <AlertTriangle size={12} />
            Urgente
          </span>
        ) : (
          getPriorityLabel(item.priority)
        )}
      </td>
      <td className="border-b border-[#e5eaf2] px-4 py-3">
        <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${getStatusClassName(item.status)}`}>
          {getStatusLabel(item.status)}
        </span>
      </td>
      <td className="border-b border-[#e5eaf2] px-4 py-3 text-xs text-[#5f6680]">
        {formatDate(item.updatedAt)}
      </td>
    </tr>
  );
}
