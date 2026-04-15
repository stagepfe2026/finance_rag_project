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
    <div className="flex items-end gap-2 rounded-[10px] border border-[#e6dddb] bg-white px-2.5 py-2 shadow-[0_8px_18px_rgba(77,43,39,0.05)]">
      <textarea
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ecrivez votre message..."
        className="h-[32px] max-h-10 flex-1 resize-none bg-transparent text-[13px] leading-[32px] text-[#3a302d] outline-none placeholder:text-[#b09f9b]"
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cb3a32] text-white transition hover:bg-[#b7312a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SendHorizontal size={13} />
      </button>
    </div>
  );
}
