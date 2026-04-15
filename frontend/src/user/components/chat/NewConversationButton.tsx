import { Plus } from "lucide-react";

type NewConversationButtonProps = {
  onClick: () => void;
};

export default function NewConversationButton({ onClick }: NewConversationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ddd3d0] bg-white px-2 py-2 text-[13px] font-medium text-[#2f2725] transition hover:bg-[#fffafa] cursor-pointer"
    >
      <Plus size={16} />
      Nouvelle discussion
    </button>
  );
}
