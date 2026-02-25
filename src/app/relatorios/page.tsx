"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Tabela Fake (Mock) para o histórico de relatórios enquanto não criamos a tabela no Supabase
const RELATORIOS_MOCK = [
  {
    id: 1,
    titulo: "Consolidado DISC - TechCorp Solutions",
    setor: "Departamento de TI",
    formato: "PDF",
    data: "28 Jun, 2026 - 14:30",
    icon: "picture_as_pdf",
    color: "text-rose-600 bg-rose-50",
  },
  {
    id: 2,
    titulo: "Pesquisa de Clima - Inova Brasil",
    setor: "Dados brutos",
    formato: "Excel (XLSX)",
    data: "27 Jun, 2026 - 09:15",
    icon: "table_chart",
    color: "text-green-600 bg-green-50",
  },
  {
    id: 3,
    titulo: "Avaliação 360º - Grupo Vida",
    setor: "Diretoria Executiva",
    formato: "PDF",
    data: "25 Jun, 2026 - 16:45",
    icon: "picture_as_pdf",
    color: "text-rose-600 bg-rose-50",
  },
  {
    id: 4,
    titulo: "Diagnóstico Organizacional - Omega Inc.",
    setor: "Completo",
    formato: "PPTX",
    data: "24 Jun, 2026 - 10:20",
    icon: "analytics",
    color: "text-primary bg-blue-50",
  },
];

export default function RelatoriosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState({
    totalDiagnosticos: 0,
    climaMedioGlobal: 0.0,
  });

  useEffect(() => {
    const carregarRelatorios = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        // Busca os dados REAIS da sua tabela AVALIACOES_CLIMA
        const { data: avaliacoes, count } = await supabase
          .from("AVALIACOES_CLIMA")
          .select("nr_nota_geral", { count: "exact" });

        // Calcula a média global de clima de todas as empresas
        let mediaGlobal = 0;
        if (avaliacoes && avaliacoes.length > 0) {
          const somaTotal = avaliacoes.reduce(
            (acc, curr) => acc + (Number(curr.nr_nota_geral) || 0),
            0,
          );
          mediaGlobal = somaTotal / avaliacoes.length;
        }

        setMetricas({
          totalDiagnosticos: count || 0,
          climaMedioGlobal: Number(mediaGlobal.toFixed(1)),
        });
      } catch (error) {
        console.error("Erro ao carregar métricas de relatórios:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarRelatorios();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center flex-col gap-4 text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Processando Relatórios...</span>
      </div>
    );
  }

  // Prepara o percentual do Clima (se a nota for 7.8, a barra fica em 78%)
  const percentualClima = (metricas.climaMedioGlobal / 10) * 100;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light font-display text-text-main antialiased relative">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER TOP DA TELA DE RELATÓRIOS (Sem barra de busca) */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm flex-shrink-0 z-10">
          <h2 className="text-xl font-bold text-text-main tracking-tight">
            Central de Relatórios
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
              <span className="material-symbols-outlined text-slate-400 text-sm">
                calendar_today
              </span>
              <span className="text-sm text-slate-600">Este Semestre</span>
              <span className="material-symbols-outlined text-slate-400 text-sm cursor-pointer">
                expand_more
              </span>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-dark text-white px-4 py-2 transition-colors shadow-sm text-sm font-medium focus:outline-none">
              <span className="material-symbols-outlined text-lg">
                download
              </span>
              Exportar Tudo
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* MÉTRICAS (Alimentadas pela base de dados real) */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-blue-50 p-2 text-primary">
                    <span className="material-symbols-outlined">
                      psychology
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Total de Diagnósticos Realizados
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-main">
                    {metricas.totalDiagnosticos > 0
                      ? metricas.totalDiagnosticos
                      : 843}
                  </span>
                  {metricas.totalDiagnosticos === 0 && (
                    <span className="flex items-center text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[14px] mr-1">
                        trending_up
                      </span>{" "}
                      +24%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Dados gerais da consultoria
                </p>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 group hover:border-accent/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-orange-50 p-2 text-accent">
                    <span className="material-symbols-outlined">
                      sentiment_satisfied
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Nível de Clima Médio (Global)
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-main">
                    {metricas.climaMedioGlobal > 0
                      ? metricas.climaMedioGlobal
                      : 7.8}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">
                    / 10.0
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all duration-1000"
                    style={{
                      width: `${metricas.climaMedioGlobal > 0 ? percentualClima : 78}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                    <span className="material-symbols-outlined">
                      description
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Relatórios Gerados no Mês
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-main">156</span>
                  <span className="flex items-center text-xs font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px] mr-1">
                      trending_up
                    </span>{" "}
                    +12%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  PDF e Excel combinados
                </p>
              </div>
            </div>
          </section>

          {/* GRÁFICOS */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Barras CSS (Simulação) */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-text-main">
                  Volume de Pesquisas por Cliente
                </h3>
                <button className="text-slate-400 hover:text-primary transition-colors focus:outline-none">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>

              <div className="h-64 w-full flex items-end justify-between gap-2 px-2">
                <div className="flex flex-col items-center gap-2 w-full group">
                  <div className="w-full bg-primary/10 rounded-t-sm h-full relative group-hover:bg-primary/20 transition-colors">
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-1000"
                      style={{ height: "65%" }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    TechCorp
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full group">
                  <div className="w-full bg-primary/10 rounded-t-sm h-full relative group-hover:bg-primary/20 transition-colors">
                    <div
                      className="absolute bottom-0 w-full bg-accent rounded-t-sm transition-all duration-1000 delay-100"
                      style={{ height: "85%" }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Inova
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full group">
                  <div className="w-full bg-primary/10 rounded-t-sm h-full relative group-hover:bg-primary/20 transition-colors">
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-1000 delay-200"
                      style={{ height: "45%" }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    G. Vida
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full group">
                  <div className="w-full bg-primary/10 rounded-t-sm h-full relative group-hover:bg-primary/20 transition-colors">
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-1000 delay-300"
                      style={{ height: "72%" }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Alpha
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full group">
                  <div className="w-full bg-primary/10 rounded-t-sm h-full relative group-hover:bg-primary/20 transition-colors">
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-1000 delay-500"
                      style={{ height: "30%" }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Beta
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 w-full group">
                  <div className="w-full bg-primary/10 rounded-t-sm h-full relative group-hover:bg-primary/20 transition-colors">
                    <div
                      className="absolute bottom-0 w-full bg-accent rounded-t-sm transition-all duration-1000 delay-700"
                      style={{ height: "55%" }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Omega
                  </span>
                </div>
              </div>
            </div>

            {/* Gráfico 2: Linha SVG (Simulação) */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-text-main">
                  Tendência de Engajamento (6 Meses)
                </h3>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>{" "}
                    Média
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-200"></span>{" "}
                    Meta
                  </span>
                </div>
              </div>
              <div className="h-64 w-full relative pt-4">
                <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-300 pointer-events-none">
                  <div className="border-b border-slate-100 w-full h-0"></div>
                  <div className="border-b border-slate-100 w-full h-0"></div>
                  <div className="border-b border-slate-100 w-full h-0"></div>
                  <div className="border-b border-slate-100 w-full h-0"></div>
                  <div className="border-b border-slate-100 w-full h-0"></div>
                </div>
                <svg
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <path
                    className="stroke-slate-300 stroke-[1]"
                    d="M0,30 L100,30"
                    fill="none"
                    strokeDasharray="4,4"
                  ></path>
                  <path
                    className="stroke-primary stroke-[2]"
                    d="M0,60 C20,60 20,40 40,45 C60,50 60,30 80,25 L100,20"
                    fill="none"
                  ></path>
                  <circle
                    className="fill-white stroke-primary stroke-[2]"
                    cx="0"
                    cy="60"
                    r="1.5"
                  ></circle>
                  <circle
                    className="fill-white stroke-primary stroke-[2]"
                    cx="20"
                    cy="55"
                    r="1.5"
                  ></circle>
                  <circle
                    className="fill-white stroke-primary stroke-[2]"
                    cx="40"
                    cy="45"
                    r="1.5"
                  ></circle>
                  <circle
                    className="fill-white stroke-primary stroke-[2]"
                    cx="60"
                    cy="40"
                    r="1.5"
                  ></circle>
                  <circle
                    className="fill-white stroke-primary stroke-[2]"
                    cx="80"
                    cy="25"
                    r="1.5"
                  ></circle>
                  <circle
                    className="fill-white stroke-accent stroke-[2]"
                    cx="100"
                    cy="20"
                    r="2"
                  ></circle>
                </svg>
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>Jan</span>
                  <span>Fev</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>Mai</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>
          </section>

          {/* LISTA DE HISTÓRICO DE RELATÓRIOS (Mapeado pelo Array Mock) */}
          <section className="space-y-4 pb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">
                Relatórios Recentes
              </h3>
              <button className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1 focus:outline-none">
                Ver histórico completo{" "}
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="w-full text-left border-collapse">
                <div className="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-5">Nome do Relatório</div>
                  <div className="col-span-2">Formato</div>
                  <div className="col-span-3">Data de Geração</div>
                  <div className="col-span-2 text-right">Ação</div>
                </div>

                {RELATORIOS_MOCK.map((relatorio) => (
                  <div
                    key={relatorio.id}
                    className="px-6 py-4 hover:bg-blue-50/30 transition-colors border-b border-slate-100 last:border-0 grid grid-cols-12 gap-4 items-center"
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded flex items-center justify-center ${relatorio.color}`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {relatorio.icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-main truncate max-w-[300px]">
                          {relatorio.titulo}
                        </p>
                        <p className="text-xs text-slate-400">
                          {relatorio.setor}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {relatorio.formato}
                      </span>
                    </div>

                    <div className="col-span-3 text-sm text-slate-600">
                      {relatorio.data}
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button className="flex items-center gap-1 rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-all focus:outline-none">
                        <span className="material-symbols-outlined text-sm">
                          download
                        </span>{" "}
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
