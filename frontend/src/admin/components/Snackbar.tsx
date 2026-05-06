import { useEffect } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

type SnackbarProps = {
  open: boolean;
  message: string;
  tone?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
};

const TONE_STYLES = {
  success: {
    bar: "bg-[#071f3d]",
    icon: <CheckCircle size={15} className="shrink-0 text-[#4ade80]" />,
    text: "text-[#e2f7ec]",
    bg: "bg-[#071f3d] border-[#1f2a44]",
  },
  error: {
    bar: "bg-[#9d0208]",
    icon: <XCircle size={15} className="shrink-0 text-[#fca5a5]" />,
    text: "text-[#ffe4e6]",
    bg: "bg-[#9d0208] border-[#7f1d1d]",
  },
  info: {
    bar: "bg-[#071f3d]",
    icon: <Info size={15} className="shrink-0 text-[#93c5fd]" />,
    text: "text-[#dbeafe]",
    bg: "bg-[#071f3d] border-[#1f2a44]",
  },
};

export default function Snackbar({
  open,
  message,
  tone = "info",
  onClose,
  duration = 3500,
}: SnackbarProps) {
  useEffect(() => {
    if (!open || !message) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [open, message, duration, onClose]);

  if (!open || !message) return null;

  const styles = TONE_STYLES[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[9999] w-full max-w-[400px] -translate-x-1/2 px-4"
    >
      <div
        className={[
          "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-[0_16px_40px_rgba(2,6,23,0.35)]",
          styles.bg,
        ].join(" ")}
      >
        {styles.icon}
        <p className={["flex-1 text-[12px] font-medium leading-5", styles.text].join(" ")}>
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto shrink-0 rounded p-0.5 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
