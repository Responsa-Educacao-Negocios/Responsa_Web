// src/components/layout/TopBar.tsx
export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm flex-shrink-0 z-10 w-full">
      <h2 className="text-xl font-bold text-text-main tracking-tight">
        Painel Administrativo
      </h2>

      <div className="flex w-full max-w-md items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all">
        <span className="material-symbols-outlined text-slate-400">search</span>
        <input
          className="w-full bg-transparent text-sm text-text-main placeholder-slate-400 focus:outline-none"
          placeholder="Buscar projetos, clientes ou ferramentas..."
          type="text"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
}
