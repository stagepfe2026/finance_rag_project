type ProfileSnackbarProps = {
  open: boolean;
  message: string;
  tone: "success" | "error" | "info";
};

export default function ProfileSnackbar({ open, message, tone }: ProfileSnackbarProps) {
  if (!open || !message) {
    return null;
  }

  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-slate-200 bg-white text-[#273043]";

  return (
    <div className="pointer-events-none fixed right-5 top-24 z-50 w-full max-w-[360px] px-2">
      <div className={`rounded-xl border px-4 py-3 text-[12px] font-semibold shadow-lg ${toneClassName}`}>
        {message}
      </div>
    </div>
  );
}
