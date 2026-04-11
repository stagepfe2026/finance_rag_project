export default function DocumentsStatusSummary({
  indexed = 8,
  processing = 2,
  failed = 2,
}) {
  return (
    <div className="rounded-2xl border border-[#ede7e5] bg-white px-4 py-3 text-[12px]">
      <span className="font-medium text-[#138a6a]">Indexés: {indexed}</span>
      <span className="mx-3 text-[#d2c8c5]">|</span>
      <span className="font-medium text-[#d38d12]">En cours: {processing}</span>
      <span className="mx-3 text-[#d2c8c5]">|</span>
      <span className="font-medium text-[#dc4c4c]">Échoués: {failed}</span>
    </div>
  );
}