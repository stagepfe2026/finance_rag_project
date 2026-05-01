import { Eye, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DocumentActionsMenuProps = {
  onView: () => void;
  onDeleteFromIndex: () => void;
  onReindex: () => void;
  isBusy: boolean;
};

export default function DocumentActionsMenu({
  onView,
  onDeleteFromIndex,
  onReindex,
  isBusy,
}: DocumentActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onView}
        title="Consulter"
        className="rounded-lg p-2 text-[#8a8a8a] hover:bg-[#f7f3f3] hover:text-[#1f1f1f]"
      >
        <Eye size={16} />
      </button>

      <button
        type="button"
        title="Plus d actions"
        onClick={() => setIsOpen((value) => !value)}
        className="rounded-lg p-2 text-[#8a8a8a] hover:bg-[#f7f3f3] hover:text-[#1f1f1f]"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-10 z-20 min-w-[160px] rounded-xl border border-[#ede7e5] bg-white p-1.5 shadow-lg">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setIsOpen(false);
              onReindex();
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-[12px] text-[#111111] hover:bg-[#f8f4f2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reindexer
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setIsOpen(false);
              onDeleteFromIndex();
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-[12px] text-[#9d0208] hover:bg-[#fff3f2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Supprimer
          </button>
        </div>
      ) : null}
    </div>
  );
}
