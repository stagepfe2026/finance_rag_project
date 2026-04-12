export function LoginHeader() {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex h-[86px] w-[86px] items-center justify-center rounded-full text-[18px] font-semibold text-white"
        style={{
          background: "linear-gradient(135deg, #b61825 0%, #d92632 100%)",
          boxShadow: "0 10px 28px rgba(198,40,40,0.22)",
        }}
      >
        MF
      </div>

      <h1 className="mt-5 text-[18px] font-medium leading-none text-[#303030]">Republique Tunisienne</h1>
      <p className="mt-2 text-[14px] leading-none text-[#8b8b8b]">Ministere des Finances</p>
      <div className="mt-6 h-px w-[92px] bg-[#e1dddd]" />
    </div>
  );
}
