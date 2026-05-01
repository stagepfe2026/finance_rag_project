import { SendHorizontal } from "lucide-react";
import type { KeyboardEvent } from "react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

export default function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="flex items-end gap-3 rounded-xl bg-slate-100 px-3 py-2.5">
      <textarea
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Posez votre question..."
        className="min-h-9 max-h-24 flex-1 resize-none bg-transparent text-[13px] leading-6 text-[#26356f] outline-none placeholder:text-[#8790ad]"
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#9d0208] text-white transition hover:bg-[#9f000d] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Envoyer la question"
      >
        <SendHorizontal size={15} />
      </button>
    </div>
  );
}
