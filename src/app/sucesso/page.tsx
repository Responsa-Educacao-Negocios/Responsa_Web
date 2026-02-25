"use client";

export default function SucessoPage() {
  return (
    <div className="bg-background-light min-h-screen flex flex-col transition-colors duration-200 relative overflow-hidden z-0 items-center justify-center p-6">
      {/* Background Blurs (Mantendo a identidade visual da pesquisa) */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none"></div>

      {/* Header simplificado */}
      <header className="fixed top-0 w-full px-6 py-6 flex items-center justify-center sm:justify-start">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">corporate_fare</span>
          </div>
          <span className="font-black text-lg tracking-tight text-primary uppercase">
            Responsa
          </span>
        </div>
      </header>

      {/* Card Central de Sucesso */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-10 sm:p-12 text-center flex flex-col items-center animate-in zoom-in-95 slide-in-from-bottom-8 duration-700">
        {/* Ícone de Sucesso Animado */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-75"></div>
          <div className="relative size-24 bg-green-50 border-4 border-white shadow-lg rounded-full flex items-center justify-center text-green-500 z-10">
            <span className="material-symbols-outlined text-[48px]">
              check_circle
            </span>
          </div>
        </div>

        {/* Textos */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tight leading-tight">
          Análise Concluída!
        </h1>
        <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">
          Muito obrigado por dedicar seu tempo. Suas respostas foram
          criptografadas, salvas com sucesso e já estão disponíveis para a
          equipe de Gestão de Talentos.
        </p>

        {/* Instrução Final */}
        <div className="w-full pt-6 border-t border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px]">
              verified_user
            </span>
            Você já pode fechar esta aba
          </p>
        </div>
      </div>
    </div>
  );
}
