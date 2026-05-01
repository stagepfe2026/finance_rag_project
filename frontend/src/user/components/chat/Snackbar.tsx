type SnackbarProps = {
  open: boolean;
  message: string;
  tone?: "success" | "error" | "info";
};

export default function Snackbar({ open, message, tone = "info" }: SnackbarProps) {
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
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 px-4">
      <div
        className={[
          "rounded-xl border px-4 py-3 text-[12px] font-medium shadow-[0_12px_35px_rgba(21,18,17,0.12)] backdrop-blur",
          toneClassName,
        ].join(" ")}
      >
        {message}
      </div>
    </div>
  );
}
