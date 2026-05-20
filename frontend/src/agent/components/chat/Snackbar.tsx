type SnackbarProps = {
  open: boolean;
  message: string;
  tone?: "success" | "error" | "info";
  onClick?: () => void;
};

export default function Snackbar({ open, message, tone = "info", onClick }: SnackbarProps) {
  if (!open || !message) {
    return null;
  }

  const toneClassName =
    tone === "success"
      ? "border-[#d7eadf] bg-[#f2fbf6] text-[#17663a]"
      : tone === "error"
        ? "border-[#f0d5d2] bg-[#fff6f5] text-[#9d0208]"
        : "border-[#d9e1ef] bg-[#f7faff] text-[#23436b]";

  return (
    <div
      className={[
        "fixed bottom-5 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 px-4",
        onClick ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
    >
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
        className={[
          "rounded-xl border px-4 py-3 text-[12px] font-medium shadow-[0_12px_35px_rgba(21,18,17,0.12)] backdrop-blur",
          toneClassName,
          onClick ? "cursor-pointer hover:opacity-90 transition-opacity" : "",
        ].join(" ")}
      >
        {message}
        {onClick ? <span className="ml-2 underline underline-offset-2 opacity-70">Voir</span> : null}
      </div>
    </div>
  );
}
