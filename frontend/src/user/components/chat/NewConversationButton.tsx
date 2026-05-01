import { Plus } from "lucide-react";

type NewConversationButtonProps = {
  onClick: () => void;
};

export default function NewConversationButton({ onClick }: NewConversationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#273043] bg-[#273043] px-3 text-[13px] font-semibold text-white shadow-[0_10px_22px_rgba(39,48,67,0.16)] transition hover:bg-[#10106f]"
    >
      <Plus size={16} />
      Nouvelle conversation
    </button>
  );
}
