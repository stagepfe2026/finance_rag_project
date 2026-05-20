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
    <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <textarea
        rows={1}
        aria-label="Saisir votre question"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Posez votre question..."
        className="min-h-8 max-h-24 flex-1 resize-none bg-transparent text-[13px] leading-6 text-[#273043] outline-none placeholder:text-slate-400"
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#9d0208] text-white transition hover:bg-[#7f0106] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Envoyer la question"
      >
        <SendHorizontal size={15} />
      </button>
    </div>
  );
}
