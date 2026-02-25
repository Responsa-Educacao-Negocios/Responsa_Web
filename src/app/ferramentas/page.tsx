"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Definição das Ferramentas
const TOOLS_DATA = [
  {
    id: 1,
    category: "Arquitetura de Cargos",
    iconCategory: "account_tree",
    title: "Gerador de Descrição de Cargos",
    icon: "assignment",
    description:
      "Crie descrições detalhadas e alinhadas ao mercado utilizando nossa base de dados de competências e responsabilidades.",
    link: "#",
  },
  {
    id: 2,
    category: "Arquitetura de Cargos",
    iconCategory: "account_tree",
    title: "Calculadora de Turnover",
    icon: "calculate",
    description:
      "Analise a rotatividade da empresa por setor, custo de reposição e identifique gargalos críticos de retenção.",
    link: "#",
  },
  {
    id: 3,
    category: "Diagnóstico & Clima",
    iconCategory: "analytics",
    title: "Criador de Pesquisas",
    icon: "poll",
    description:
      "Configure pesquisas de clima organizacional, eNPS e satisfação interna com envio automatizado e relatórios em tempo real.",
    link: "#",
  },
  {
    id: 4,
    category: "Diagnóstico & Clima",
    iconCategory: "analytics",
    title: "Mapeamento DISC",
    icon: "psychology_alt",
    description:
      "Aplique e gerencie avaliações de perfil comportamental para times e lideranças, com cruzamento de dados para fit cultural.",
    link: "#",
  },
  {
    id: 5,
    category: "Desenvolvimento",
    iconCategory: "school",
    title: "Biblioteca de Competências",
    icon: "library_books",
    description:
      "Acesso completo a um repositório de competências técnicas e comportamentais com indicadores de desempenho sugeridos.",
    link: "#",
  },
];

export default function FerramentasPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Proteção de Rota
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Lógica de Filtro
  const filteredTools = TOOLS_DATA.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Agrupamento por Categoria para a UI
  const groupedTools = filteredTools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = { tools: [], icon: tool.iconCategory };
      }
      acc[tool.category].tools.push(tool);
      return acc;
    },
    {} as Record<string, { tools: typeof TOOLS_DATA; icon: string }>,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center flex-col gap-4 text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando Ferramentas...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light font-display text-text-main antialiased relative">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER ESPECÍFICO */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm flex-shrink-0 z-10">
          <h2 className="text-xl font-bold text-primary tracking-tight">
            Ferramentas de Consultoria
          </h2>

          <div className="flex w-full max-w-md items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all">
            <span className="material-symbols-outlined text-slate-400">
              search
            </span>
            <input
              className="w-full bg-transparent text-sm text-text-main placeholder-slate-400 focus:outline-none"
              placeholder="Buscar ferramenta específica..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent ring-2 ring-white"></span>
            </button>
            <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
          </div>
        </header>

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {Object.keys(groupedTools).length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Nenhuma ferramenta encontrada para a busca{" "}
              <strong>"{searchTerm}"</strong>.
            </div>
          ) : (
            Object.entries(groupedTools).map(([categoryName, categoryData]) => (
              <section key={categoryName} className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="material-symbols-outlined text-primary">
                    {categoryData.icon}
                  </span>
                  <h3 className="text-lg font-bold text-graphite">
                    {categoryName}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryData.tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="group bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-all"
                    >
                      <div className="mb-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-50 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-3xl">
                            {tool.icon}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-graphite mb-2">
                          {tool.title}
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      <button
                        onClick={() => router.push(tool.link)}
                        className="w-full mt-4 bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 group/btn focus:outline-none"
                      >
                        Abrir Ferramenta
                        <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  ))}

                  {/* Card Fixo de Em Breve apenas na categoria Desenvolvimento */}
                  {categoryName === "Desenvolvimento" && !searchTerm && (
                    <div className="group bg-white/50 border border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-60">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl">
                          add
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-500">
                        Mais ferramentas em breve
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 italic">
                        PDI Automatizado & 360 Graus
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
