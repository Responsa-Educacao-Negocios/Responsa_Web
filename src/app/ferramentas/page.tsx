"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Definição das Ferramentas — disponivel:false = em breve (sem rota criada)
const TOOLS_DATA = [
  {
    id: 4,
    category: "Diagnóstico & Clima",
    iconCategory: "analytics",
    title: "Mapeamento DISC",
    icon: "psychology_alt",
    description:
      "Aplique e gerencie avaliações de perfil comportamental para times e lideranças, com cruzamento de dados para fit cultural.",
    link: "/ferramentas/disc",
    disponivel: true,
  },
  {
    id: 7,
    category: "Diagnóstico & Clima",
    iconCategory: "analytics",
    title: "Inventário de Gestão do Tempo",
    icon: "update",
    description:
      "Avaliação Rosa Krausz de 96 pontos para identificar os desperdiçadores de tempo e gerar planos de desenvolvimento individual.",
    link: "/ferramentas/gestao-tempo",
    disponivel: true,
  },
  {
    id: 8,
    category: "Diagnóstico & Clima",
    iconCategory: "analytics",
    title: "Riscos Psicossociais (NR-1)",
    icon: "health_and_safety",
    description:
      "Mapeamento completo de 60 pontos exigido pela NR-1, avaliando maturidade organizacional, liderança e gerando planos de ação.",
    link: "/ferramentas/nr1",
    disponivel: true,
  },
  {
    id: 5,
    category: "Inovação & IA",
    iconCategory: "smart_toy",
    title: "Maturidade em IA (Marketing)",
    icon: "robot_2",
    description:
      "Diagnóstico interativo para avaliar o nível de uso de Inteligência Artificial no negócio e gerar laudos executivos instantâneos.",
    link: "/ferramentas/ia-marketing",
    disponivel: true,
  },
  {
    id: 9,
    category: "Avaliação 9 Box",
    iconCategory: "grid_view",
    title: "9 Box — Comportamental",
    icon: "person_check",
    description:
      "Mapeie o desempenho e comportamento dos colaboradores na Matriz 9 Box. Avalia Comportamento × Desempenho.",
    link: "/ferramentas/9box",
    disponivel: true,
  },
  {
    id: 10,
    category: "Avaliação 9 Box",
    iconCategory: "grid_view",
    title: "9 Box — Liderança",
    icon: "supervisor_account",
    description:
      "Avalie líderes pelo cruzamento de Comportamento × Capacidade de Liderança na Matriz 9 Box. Gere relatório PDF.",
    link: "/ferramentas/9box",
    disponivel: true,
  },
  {
    id: 11,
    category: "Avaliação 9 Box",
    iconCategory: "grid_view",
    title: "9 Box — Gestão de Pessoas",
    icon: "groups_3",
    description:
      "Classifique gestores e coordenadores pelo cruzamento de Comportamento × Gestão de Pessoas na Matriz 9 Box.",
    link: "/ferramentas/9box",
    disponivel: true,
  },
  {
    id: 1,
    category: "Arquitetura de Cargos",
    iconCategory: "account_tree",
    title: "Gerador de Descrição de Cargos",
    icon: "assignment",
    description:
      "Crie descrições detalhadas e alinhadas ao mercado utilizando nossa base de dados de competências e responsabilidades.",
    link: "/ferramentas/gerador-cargos",
    disponivel: false,
  },
  {
    id: 2,
    category: "Arquitetura de Cargos",
    iconCategory: "account_tree",
    title: "Calculadora de Turnover",
    icon: "calculate",
    description:
      "Analise a rotatividade da empresa por setor, custo de reposição e identifique gargalos críticos de retenção.",
    link: "/ferramentas/turnover",
    disponivel: false,
  },
  {
    id: 3,
    category: "Diagnóstico & Clima",
    iconCategory: "analytics",
    title: "Criador de Pesquisas",
    icon: "poll",
    description:
      "Configure pesquisas de clima organizacional, eNPS e satisfação interna com envio automatizado e relatórios em tempo real.",
    link: "/ferramentas/pesquisas",
    disponivel: false,
  },
  {
    id: 6,
    category: "Desenvolvimento",
    iconCategory: "school",
    title: "Biblioteca de Competências",
    icon: "library_books",
    description:
      "Repositório de competências técnicas e comportamentais com indicadores de desempenho e mapeamento por nível de cargo.",
    link: "/ferramentas/competencias",
    disponivel: false,
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4 text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando Ferramentas...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased relative">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER ESPECÍFICO */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm flex-shrink-0 z-10">
          <h2 className="text-xl font-black text-[#064384] tracking-tight">
            Hub de Ferramentas
          </h2>

          <div className="flex w-full max-w-md items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 border border-transparent focus-within:border-[#064384]/30 focus-within:bg-white transition-all">
            <span className="material-symbols-outlined text-slate-400">
              search
            </span>
            <input
              className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              placeholder="Buscar ferramenta específica..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF8323] ring-2 ring-white"></span>
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
              <section
                key={categoryName}
                className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                {/* Título da Categoria */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#064384] flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {categoryData.icon}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">
                    {categoryName}
                  </h3>
                </div>

                {/* Grid de Cards da Categoria */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryData.tools.map((tool) => (
                    <div
                      key={tool.id}
                      className={`group bg-white rounded-2xl shadow-sm border p-6 flex flex-col justify-between transition-all duration-300 ${tool.disponivel ? "border-slate-200 hover:shadow-md hover:border-[#064384]/30" : "border-dashed border-slate-200 opacity-60"}`}
                    >
                      <div className="mb-6 flex-grow">
                        <div className="flex items-start justify-between mb-5">
                          <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${tool.disponivel ? "bg-blue-50 text-[#064384] group-hover:bg-[#064384] group-hover:text-white group-hover:scale-110" : "bg-slate-100 text-slate-400"} transition-all duration-300`}>
                            <span
                              className="material-symbols-outlined text-3xl"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {tool.icon}
                            </span>
                          </div>
                          {!tool.disponivel && (
                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
                              Em breve
                            </span>
                          )}
                        </div>
                        <h4 className={`text-lg font-black mb-2 ${tool.disponivel ? "text-slate-800 group-hover:text-[#064384]" : "text-slate-500"} transition-colors`}>
                          {tool.title}
                        </h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      {tool.disponivel ? (
                        <button
                          onClick={() => router.push(tool.link)}
                          className="w-full mt-auto bg-slate-50 hover:bg-[#064384] text-[#064384] hover:text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group/btn focus:outline-none border border-slate-200 hover:border-[#064384]"
                        >
                          Abrir Ferramenta
                          <span className="material-symbols-outlined text-[18px] transition-transform group-hover/btn:translate-x-1">
                            arrow_forward
                          </span>
                        </button>
                      ) : (
                        <div className="w-full mt-auto bg-slate-50 text-slate-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed select-none">
                          <span className="material-symbols-outlined text-[18px]">construction</span>
                          Em desenvolvimento
                        </div>
                      )}
                    </div>
                  ))}

                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
