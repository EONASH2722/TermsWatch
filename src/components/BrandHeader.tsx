export function BrandHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-line/70 px-5 py-4">
      <img src="./icons/icon-48.png" alt="" className="size-9" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[15px] font-bold tracking-[0.16em] text-white">
          TERMS<span className="text-cyan">WATCH</span>
        </div>
        <p className="mt-0.5 text-xs text-muted">Know before you agree.</p>
      </div>
    </header>
  );
}
