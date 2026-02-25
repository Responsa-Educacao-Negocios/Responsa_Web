"use client";

import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// O ApexCharts usa "window" interno, então precisa ser carregado dinamicamente (SSR desativado)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ProjetoDetalhe {
  cd_projeto: string;
  tp_status: string;
  nr_horas_contratadas: number;
  nr_horas_consumidas: number;
  dt_prazo_estimado: string;
  EMPRESAS: {
    nm_fantasia: string;
  };
  TIPOS_CONSULTORIA: {
    nm_servico: string;
  };
}

export default function ConsultorProjetoDashboard() {
  const router = useRouter();
  const params = useParams(); // Pega o ID da URL

  const [loading, setLoading] = useState(true);
  const [projeto, setProjeto] = useState<ProjetoDetalhe | null>(null);

  // Estados com os dados Reais puxados do Banco
  const [metricas, setMetricas] = useState({
    indiceGeral: 0,
    maturidadeRH: 0,
    clima: 0,
    riscoTrabalhista: 0,
    colaboradores: 0, // Vai ser a quantidade de linhas no DISC
    radarData: [0, 0, 0, 0, 0, 0], // Liderança, Comunicação, etc.
    discData: [0, 0, 0, 0], // D, I, S, C
    desempenhoData: [0, 0, 0, 0], // Simulado por enquanto
    alertas: [] as string[],
  });

  useEffect(() => {
    const buscarDadosDoProjeto = async () => {
      const projetoId = params.id as string;
      if (!projetoId) return;

      try {
        // 1. Busca os dados base do Projeto
        const { data: projData, error: projError } = await supabase
          .from("PROJETOS")
          .select(
            `
            cd_projeto, tp_status, nr_horas_contratadas, nr_horas_consumidas, dt_prazo_estimado,
            EMPRESAS ( nm_fantasia ),
            TIPOS_CONSULTORIA ( nm_servico )
          `,
          )
          .eq("cd_projeto", projetoId)
          .single();

        if (projError) throw projError;
        setProjeto(projData as any);

        // 2. Busca o Clima mais recente desse projeto
        const { data: climaData } = await supabase
          .from("AVALIACOES_CLIMA")
          .select("*")
          .eq("cd_projeto", projetoId)
          .order("ts_criacao", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Busca a nota de Maturidade e Risco
        const { data: indData } = await supabase
          .from("INDICADORES_RH")
          .select("*")
          .eq("cd_projeto", projetoId)
          .order("ts_criacao", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 4. Busca todos os DISCs cadastrados para calcular as médias
        const { data: discData } = await supabase
          .from("AVALIACOES_DISC")
          .select(
            "nr_dominancia, nr_influencia, nr_estabilidade, nr_conformidade",
          )
          .eq("cd_projeto", projetoId);

        // --- MATEMÁTICA PARA OS GRÁFICOS REAIS ---

        let radar = [0, 0, 0, 0, 0, 0];
        let notaClima = 0;
        if (climaData) {
          notaClima = climaData.nr_nota_geral || 0;
          radar = [
            climaData.nr_lideranca || 0,
            climaData.nr_comunicacao || 0,
            climaData.nr_reconhecimento || 0,
            climaData.nr_desenvolvimento || 0,
            climaData.nr_ambiente || 0,
            climaData.nr_engajamento || 0,
          ];
        }

        let arrayDisc = [0, 0, 0, 0];
        let totalColabs = 0;
        if (discData && discData.length > 0) {
          totalColabs = discData.length;
          let sumD = 0,
            sumI = 0,
            sumS = 0,
            sumC = 0;
          discData.forEach((d) => {
            sumD += d.nr_dominancia || 0;
            sumI += d.nr_influencia || 0;
            sumS += d.nr_estabilidade || 0;
            sumC += d.nr_conformidade || 0;
          });
          arrayDisc = [
            Math.round(sumD / totalColabs),
            Math.round(sumI / totalColabs),
            Math.round(sumS / totalColabs),
            Math.round(sumC / totalColabs),
          ];
        }

        const maturidade = indData?.nr_maturidade_rh || 0;
        const risco = indData?.nr_risco_trabalhista || 0;
        const jsAlertas = indData?.js_alertas || [];

        // Calcula a média geral do dashboard
        const mediaGeral =
          Math.round((maturidade + notaClima + (100 - risco)) / 3) || 0;

        setMetricas({
          indiceGeral: mediaGeral,
          maturidadeRH: maturidade,
          clima: notaClima,
          riscoTrabalhista: risco,
          colaboradores: totalColabs,
          radarData: radar,
          discData: arrayDisc,
          desempenhoData: [0, 0, 0, 0], // Será atualizado em futura tabela de performance
          alertas: jsAlertas,
        });
      } catch (error) {
        console.error("Erro ao carregar projeto:", error);
        alert("Projeto não encontrado.");
        router.push("/projetos");
      } finally {
        setLoading(false);
      }
    };

    buscarDadosDoProjeto();
  }, [params.id, router]);

  // Configurações dos Gráficos (ApexCharts) com os dados gerados
  const radarOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "radar",
      toolbar: { show: false },
      fontFamily: "Montserrat, sans-serif",
    },
    labels: [
      "Liderança",
      "Comunicação",
      "Reconhecimento",
      "Desenvolvimento",
      "Ambiente",
      "Engajamento",
    ],
    stroke: { width: 2, colors: ["#064384"] },
    fill: { opacity: 0.1, colors: ["#064384"] },
    markers: {
      size: 4,
      colors: ["#fff"],
      strokeColors: "#064384",
      strokeWidth: 2,
    },
    yaxis: { show: false, min: 0, max: 100 },
    xaxis: {
      labels: {
        style: {
          colors: Array(6).fill("#1F2937"),
          fontSize: "11px",
          fontFamily: "Montserrat",
        },
      },
    },
    plotOptions: {
      radar: {
        polygons: { strokeColors: "#E5E7EB", connectorColors: "#E5E7EB" },
      },
    },
  };

  const donutOptions: ApexCharts.ApexOptions = {
    chart: { type: "donut", fontFamily: "Montserrat, sans-serif" },
    labels: [
      "Dominância (D)",
      "Influência (I)",
      "Estabilidade (S)",
      "Conformidade (C)",
    ],
    colors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6"],
    dataLabels: { enabled: false },
    legend: { position: "bottom", fontFamily: "Montserrat" },
    stroke: { show: true, colors: ["#fff"], width: 2 },
    plotOptions: { pie: { donut: { size: "65%" } } },
    noData: {
      text: "Sem avaliações",
      align: "center",
      verticalAlign: "middle",
      style: { color: "#64748b" },
    },
  };

  const barOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Montserrat, sans-serif",
    },
    colors: ["#064384"],
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: "60%", distributed: true },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ["Vendas", "Admin", "Operações", "Marketing"],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { min: 0, max: 100 },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
    },
    legend: { show: false },
  };

  if (loading || !projeto) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center flex-col gap-4 text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando Dashboard do Projeto...</span>
      </div>
    );
  }

  // Helpers Visuais
  const siglaEmpresa =
    projeto.EMPRESAS?.nm_fantasia?.substring(0, 2).toUpperCase() || "GP";

  const getBadgeStatus = () => {
    if (projeto.tp_status === "ATIVO")
      return {
        cor: "bg-green-500",
        texto: "Em Andamento",
        bg: "bg-green-50 text-green-700 border-green-200",
      };
    if (projeto.tp_status === "CONCLUIDO")
      return {
        cor: "bg-blue-500",
        texto: "Finalizado",
        bg: "bg-blue-50 text-blue-700 border-blue-200",
      };
    if (projeto.tp_status === "PAUSADO")
      return {
        cor: "bg-gray-500",
        texto: "Pausado",
        bg: "bg-gray-50 text-gray-700 border-gray-200",
      };
    return {
      cor: "bg-orange-500",
      texto: "Em Prospecção",
      bg: "bg-orange-50 text-orange-700 border-orange-200",
    };
  };

  const statusInfo = getBadgeStatus();
  const getMaturidadeTexto = (nota: number) =>
    nota > 70 ? "Alta" : nota > 40 ? "Estruturando" : "Baixa";
  const getClimaTexto = (nota: number) =>
    nota > 75 ? "Excelente" : nota > 50 ? "Estável" : "Crítico";
  const getRiscoTexto = (nota: number) =>
    nota > 60 ? "Alto" : nota > 30 ? "Médio" : "Baixo";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light font-display text-text-main antialiased">
      {/* ÁREA PRINCIPAL DA DASHBOARD */}
      <main className="flex-1 overflow-y-auto relative bg-[#F5F7FA]">
        {/* CABEÇALHO (Atualizado para o design maior) */}
        {/* CABEÇALHO */}
        <header className="bg-white/95 backdrop-blur-sm px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 shadow-sm sticky top-0 z-30">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-extrabold text-primary tracking-tight">
                Dashboard do Projeto
              </h2>
              {/* Badge de Status do Projeto */}
              <span className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider border border-green-200">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Em Andamento
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <span>Visão integrada de Gestão de Pessoas</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              {/* <span className="flex items-center gap-1.5">
                Índice Geral:
                <span className="px-2 py-0.5 rounded-md bg-orange-50 text-accent font-bold border border-orange-100 shadow-sm">
                  {indiceGeral}/100
                </span>
              </span> */}
            </div>
          </div>

          {/* Etiqueta da Empresa (Sem clique, sem setinha) */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 shadow-sm px-5 py-3 bg-slate-50/50 max-w-sm shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary mr-3 shadow-inner">
              <span className="material-symbols-outlined text-[18px]">
                domain
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">
                Cliente Atual
              </span>
              <span className="truncate text-base font-bold text-slate-800 leading-none">
                {projeto.EMPRESAS?.nm_fantasia}
              </span>
            </div>
          </div>
        </header>

        {/* CONTEÚDO GRÁFICOS E CARDS */}
        <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
          {/* 4 CARDS DE INDICADORES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-slate-400">
                  bar_chart
                </span>
                <span className="bg-yellow-50 text-yellow-600 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded">
                  {getMaturidadeTexto(metricas.maturidadeRH)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-accent">
                  {metricas.maturidadeRH}
                </h3>
                <span className="text-slate-400 text-sm">/100</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Maturidade RH
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-slate-400">
                  thermostat
                </span>
                <span className="bg-blue-50 text-primary text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded">
                  {getClimaTexto(metricas.clima)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl font-bold text-primary">
                  {metricas.clima}
                </h3>
                <span className="text-slate-400 text-sm">/100</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Clima Organizacional
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-slate-400">
                  groups
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-text-main">
                  {metricas.colaboradores}
                </h3>
              </div>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Colaboradores Mapeados
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-slate-400">
                  shield
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded ${metricas.riscoTrabalhista > 50 ? "bg-red-50 text-red-600" : "bg-orange-50 text-accent"}`}
                >
                  {getRiscoTexto(metricas.riscoTrabalhista)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <h3
                  className={`text-3xl font-bold ${metricas.riscoTrabalhista > 50 ? "text-red-600" : "text-accent"}`}
                >
                  {metricas.riscoTrabalhista}
                </h3>
                <span className="text-slate-400 text-sm">/100</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Risco Trabalhista
              </p>
            </div>
          </div>

          {/* LINHA DE GRÁFICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-accent text-[20px]">
                  thermostat
                </span>
                <h3 className="font-bold text-primary">Radar de Clima</h3>
              </div>
              <div className="w-full h-64 flex justify-center items-center">
                {metricas.clima > 0 ? (
                  <Chart
                    options={radarOptions}
                    series={[{ name: "Clima", data: metricas.radarData }]}
                    type="radar"
                    height={280}
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-400">
                    Aguardando Avaliação
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-accent text-[20px]">
                  pie_chart
                </span>
                <h3 className="font-bold text-primary">Distribuição DISC</h3>
              </div>
              <div className="w-full h-64 flex justify-center items-center">
                {metricas.colaboradores > 0 ? (
                  <Chart
                    options={donutOptions}
                    series={metricas.discData}
                    type="donut"
                    height={260}
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-400">
                    Nenhum colaborador avaliado
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-accent text-[20px]">
                  leaderboard
                </span>
                <h3 className="font-bold text-primary">Desempenho por Área</h3>
              </div>
              <div className="w-full h-64 flex justify-center items-center">
                <span className="text-sm font-medium text-slate-400">
                  Módulo em Desenvolvimento
                </span>
              </div>
            </div>
          </div>

          {/* RODAPÉ: ALERTAS E PRÓXIMAS AÇÕES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-primary mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">
                  warning_amber
                </span>
                Alertas Prioritários
              </h3>
              <div className="space-y-3">
                {metricas.alertas.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium italic p-3">
                    Nenhum alerta crítico para este projeto no momento.
                  </p>
                ) : (
                  metricas.alertas.map((alerta, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <span className="material-symbols-outlined text-accent mt-0.5">
                        error_outline
                      </span>
                      <div>
                        <p className="text-text-main font-bold text-sm">
                          {alerta}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-primary mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">
                  task_alt
                </span>
                Próximas Ações
              </h3>
              <div className="space-y-1">
                {metricas.clima === 0 && (
                  <div className="flex items-center gap-4 p-3 border-b border-slate-100 last:border-0">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">
                        trending_up
                      </span>
                    </span>
                    <span className="text-slate-600 text-sm font-medium">
                      Aplicar pesquisa de clima
                    </span>
                    <button className="ml-auto text-primary text-xs font-bold hover:text-accent hover:underline focus:outline-none uppercase tracking-wide">
                      Iniciar
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-4 p-3 border-b border-slate-100 last:border-0">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">
                      psychology
                    </span>
                  </span>
                  <span className="text-slate-600 text-sm font-medium">
                    Mapear novos colaboradores (DISC)
                  </span>
                  <button className="ml-auto text-primary text-xs font-bold hover:text-accent hover:underline focus:outline-none uppercase tracking-wide">
                    Abrir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
