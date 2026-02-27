"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Nova Tipagem Dinâmica
interface RelatorioItem {
  id: string;
  titulo: string;
  setor: string;
  formato: string;
  data: string;
  icon: string;
  color: string;
  href: string;
}

export default function RelatoriosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [relatorios, setRelatorios] = useState<RelatorioItem[]>([]);
  const [metricas, setMetricas] = useState({
    totalDiagnosticos: 0,
    climaMedioGlobal: 0.0,
    totalRelatorios: 0,
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
        // 1. Busca os Projetos e Empresas para gerar a lista de Relatórios Finais
        const { data: projetosData, error: projError } = await supabase
          .from("PROJETOS")
          .select(
            `
            cd_projeto,
            ts_criacao,
            EMPRESAS ( nm_fantasia )
          `,
          )
          .order("ts_criacao", { ascending: false });

        if (projError) throw projError;

        const relatoriosDinamicos =
          projetosData?.map((p) => {
            const empresa = Array.isArray(p.EMPRESAS)
              ? p.EMPRESAS[0]
              : p.EMPRESAS;
            return {
              id: p.cd_projeto,
              titulo: `Relatório Final Executivo - ${empresa?.nm_fantasia || "Empresa"}`,
              setor: "Gestão 360°",
              formato: "Web / PDF",
              data: new Date(p.ts_criacao).toLocaleDateString("pt-BR"),
              icon: "analytics",
              color: "text-[#064384] bg-blue-50",
              href: `/projetos/${p.cd_projeto}/relatorio`,
            };
          }) || [];

        setRelatorios(relatoriosDinamicos);

        // 2. Busca o número real de Diagnósticos RH já feitos
        const { count: diagCount } = await supabase
          .from("INDICADORES_RH")
          .select("*", { count: "exact", head: true });

        // 3. Busca a média Global de Clima (Lendo as respostas individuais para ser exato)
        const { data: respostasClima } = await supabase
          .from("RESPOSTAS_INDIVIDUAIS_CLIMA")
          .select(
            "nr_lideranca, nr_comunicac, nr_reconhecir, nr_desenvolvi, nr_ambiente, nr_engajamen",
          );

        let mediaGlobal = 0;
        if (respostasClima && respostasClima.length > 0) {
          const somaTotal = respostasClima.reduce((acc, curr) => {
            const mediaResposta =
              (curr.nr_lideranca +
                curr.nr_comunicac +
                curr.nr_reconhecir +
                curr.nr_desenvolvi +
                curr.nr_ambiente +
                curr.nr_engajamen) /
              6;
            return acc + mediaResposta;
          }, 0);
          // Multiplica por 10 para converter a escala 1-10 para 1-100, e divide para voltar pra 0-10 pro visual
          mediaGlobal = somaTotal / respostasClima.length;
        }

        setMetricas({
          totalDiagnosticos: diagCount || 0,
          climaMedioGlobal: Number(mediaGlobal.toFixed(1)),
          totalRelatorios: relatoriosDinamicos.length,
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
      <div className="min-h-screen bg-background-light flex items-center justify-center flex-col gap-4 text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Processando Relatórios...</span>
      </div>
    );
  }

  // Prepara o percentual do Clima (se a nota for 7.8, a barra fica em 78%)
  const percentualClima =
    metricas.climaMedioGlobal > 0 ? (metricas.climaMedioGlobal / 10) * 100 : 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] font-sans text-slate-800 antialiased relative">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER TOP DA TELA DE RELATÓRIOS */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm flex-shrink-0 z-10">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Central de Relatórios
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
              <span className="material-symbols-outlined text-slate-400 text-sm">
                calendar_today
              </span>
              <span className="text-sm font-bold text-slate-600">
                Este Semestre
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* MÉTRICAS REAIS DO BANCO */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-200 group hover:border-[#064384]/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-blue-50 p-2 text-[#064384]">
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    Diagnósticos Concluídos
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-800">
                    {metricas.totalDiagnosticos}
                  </span>
                  {metricas.totalDiagnosticos > 0 && (
                    <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase">
                      <span className="material-symbols-outlined text-[14px] mr-1">
                        trending_up
                      </span>{" "}
                      Ativos
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-400 mt-2">
                  Empresas mapeadas no sistema
                </p>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-200 group hover:border-[#FF8323]/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-orange-50 p-2 text-[#FF8323]">
                    <span className="material-symbols-outlined">
                      thermostat
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    Clima Médio (Global)
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-800">
                    {metricas.climaMedioGlobal > 0
                      ? metricas.climaMedioGlobal
                      : "0.0"}
                  </span>
                  <span className="text-sm text-slate-400 font-black">
                    / 10.0
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                  <div
                    className="bg-[#FF8323] h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${percentualClima}%` }}
                  ></div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-200 group hover:border-[#064384]/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                    <span className="material-symbols-outlined">
                      folder_shared
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    Relatórios Disponíveis
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-800">
                    {metricas.totalRelatorios}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-2">
                  Prontos para exportação PDF
                </p>
              </div>
            </div>
          </section>

          {/* GRÁFICOS ILUSTRATIVOS (Mantidos para composição visual) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
            {/* Gráfico 1: Barras CSS (Simulação) */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">
                  Evolução de Mapeamentos
                </h3>
              </div>
              <div className="h-40 w-full flex items-end justify-between gap-2 px-2">
                {[65, 85, 45, 72, 30, 55].map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 w-full group"
                  >
                    <div className="w-full bg-slate-100 rounded-t-md h-full relative overflow-hidden">
                      <div
                        className="absolute bottom-0 w-full bg-[#064384] rounded-t-md transition-all duration-1000"
                        style={{ height: `${h}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico 2: Tendência */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">
                  Média de Satisfação
                </h3>
              </div>
              <div className="h-40 w-full relative pt-4">
                <svg
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <path
                    className="stroke-slate-200 stroke-[1]"
                    d="M0,30 L100,30"
                    fill="none"
                    strokeDasharray="4,4"
                  ></path>
                  <path
                    className="stroke-[#FF8323] stroke-[3]"
                    d="M0,60 C20,60 20,40 40,45 C60,50 60,30 80,25 L100,20"
                    fill="none"
                  ></path>
                </svg>
              </div>
            </div>
          </section>

          {/* LISTA DINÂMICA DE RELATÓRIOS DO BANCO */}
          <section className="space-y-4 pb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                Relatórios por Cliente
              </h3>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="w-full text-left border-collapse">
                <div className="grid grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                  <div className="col-span-5">Nome do Relatório</div>
                  <div className="col-span-2">Formato</div>
                  <div className="col-span-3">Criação do Projeto</div>
                  <div className="col-span-2 text-right">Ação</div>
                </div>

                {relatorios.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-bold">
                    Nenhum relatório encontrado no banco de dados.
                  </div>
                ) : (
                  relatorios.map((relatorio) => (
                    <div
                      key={relatorio.id}
                      className="px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 grid grid-cols-12 gap-4 items-center group"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center ${relatorio.color}`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {relatorio.icon}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 truncate max-w-[300px]">
                            {relatorio.titulo}
                          </p>
                          <p className="text-xs font-medium text-slate-400 mt-0.5">
                            {relatorio.setor}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
                          {relatorio.formato}
                        </span>
                      </div>

                      <div className="col-span-3 text-sm font-medium text-slate-500">
                        {relatorio.data}
                      </div>

                      <div className="col-span-2 flex justify-end">
                        <button
                          onClick={() => router.push(relatorio.href)}
                          className="flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-[#064384] hover:bg-[#064384] hover:text-white shadow-sm transition-all focus:outline-none group-hover:border-[#064384]/30"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            visibility
                          </span>{" "}
                          Acessar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
