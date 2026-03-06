"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function TopBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Inicializa o estado com o valor atual da URL (se existir)
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );

  // Lógica de Debounce: Atualiza a URL 400ms após o usuário parar de digitar
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }

      // Atualiza a URL sem recarregar a página e sem rolar para o topo
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pathname, router, searchParams]);

  // Limpa o campo de busca visualmente se a URL mudar externamente (ex: mudar de página)
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (currentSearch !== searchTerm) {
      setSearchTerm(currentSearch);
    }
  }, [searchParams]);

  return (
    <header className="flex h-16 sm:h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-sm flex-shrink-0 z-30 w-full gap-4 transition-all">
      {/* TÍTULO DINÂMICO */}
      <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate pl-12 lg:pl-0">
        Painel Administrativo
      </h2>

      {/* CONTAINER DE BUSCA */}
      <div className="flex flex-1 max-w-md items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 border border-transparent focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-md transition-all group">
        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">
          search
        </span>

        <input
          className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none font-medium"
          placeholder="Buscar em todo o sistema..."
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Botão de Limpar (Aparece apenas quando há texto) */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-slate-400 hover:text-red-500 transition-colors flex items-center p-1"
            title="Limpar busca"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* ESPAÇO PARA ELEMENTOS ADICIONAIS (Notificações, etc) */}
      <div className="hidden md:flex items-center gap-4">
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        <button className="text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  );
}
