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
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [projeto, setProjeto] = useState<ProjetoDetalhe | null>(null);

  const [metricas, setMetricas] = useState({
    indiceGeral: 0,
    maturidadeRH: 0,
    clima: 0,
    riscoTrabalhista: 0,
    colaboradores: 0,
    radarData: [0, 0, 0, 0, 0, 0],
    discData: [0, 0, 0, 0],
    desempenhoData: [0, 0, 0, 0],
    alertas: [] as string[],
  });

  useEffect(() => {
    const buscarDadosDoProjeto = async () => {
      const projetoId = params.id as string;
      if (!projetoId) return;

      try {
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

        const { data: climaData } = await supabase
          .from("AVALIACOES_CLIMA")
          .select("*")
          .eq("cd_projeto", projetoId)
          .order("ts_criacao", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: indData } = await supabase
          .from("INDICADORES_RH")
          .select("*")
          .eq("cd_projeto", projetoId)
          .order("ts_criacao", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: discData } = await supabase
          .from("AVALIACOES_DISC")
          .select(
            "nr_dominancia, nr_influencia, nr_estabilidade, nr_conformidade",
          )
          .eq("cd_projeto", projetoId);

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
          desempenhoData: [0, 0, 0, 0],
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

  const handlePrint = () => {
    const conteudo = document.getElementById("area-impressao")?.innerHTML;
    if (!conteudo) return;

    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    janela.document.write(`
      <html>
        <head>
          <title>Relatório Dashboard</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
          <style>
            @media print {
              @page { margin: 10mm; size: A4; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .break-inside-avoid { page-break-inside: avoid; }
              .print-hidden { display: none !important; }
            }
          </style>
        </head>
        <body class="bg-white text-slate-800 font-sans p-8">
          <div class="border-b-2 border-[#064384] pb-4 mb-8 flex justify-between items-end">
            <div>
              <h1 class="text-2xl font-black text-[#064384] uppercase tracking-widest">Consultoria RH</h1>
              <p class="text-slate-500 font-medium">Relatório Oficial Gerado pelo Sistema - Visão Geral do Projeto</p>
              <p class="text-slate-800 font-bold mt-2">Cliente: ${projeto?.EMPRESAS?.nm_fantasia || ""}</p>
            </div>
            <div class="text-right text-sm font-bold text-slate-400">
              ${new Date().toLocaleDateString("pt-BR")}
            </div>
          </div>
          ${conteudo}
          <script>
            setTimeout(() => { window.print(); window.close(); }, 800);
          </script>
        </body>
      </html>
    `);
    janela.document.close();
  };

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
          fontSize: "10px",
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
    legend: { position: "bottom", fontFamily: "Montserrat", fontSize: "12px" },
    stroke: { show: true, colors: ["#fff"], width: 2 },
    plotOptions: { pie: { donut: { size: "65%" } } },
    noData: {
      text: "Sem avaliações",
      align: "center",
      verticalAlign: "middle",
      style: { color: "#64748b" },
    },
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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

  const getMaturidadeTexto = (nota: number) =>
    nota > 70 ? "Alta" : nota > 40 ? "Estruturando" : "Baixa";
  const getClimaTexto = (nota: number) =>
    nota > 75 ? "Excelente" : nota > 50 ? "Estável" : "Crítico";
  const getRiscoTexto = (nota: number) =>
    nota > 60 ? "Alto" : nota > 30 ? "Médio" : "Baixo";

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-background-light font-display text-text-main antialiased">
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F5F7FA] w-full">
        {/* CABEÇALHO RESPONSIVO */}
        <header className="bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-5 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 border-b border-slate-200 shadow-sm shrink-0 z-10 w-full">
          {/* Título e Status */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-primary tracking-tight pl-12 lg:pl-0">
                Dashboard do Projeto
              </h2>
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-green-50 text-green-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-green-200">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Em Andamento
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium pl-12 lg:pl-0">
              <span>Visão integrada de Gestão de Pessoas</span>
            </div>
          </div>

          {/* Botões e Etiqueta Mobile-friendly */}
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 sm:gap-4 mt-2 md:mt-0">
            <div className="flex-1 sm:flex-none inline-flex items-center rounded-xl border border-slate-200 shadow-sm px-3 sm:px-5 py-2 sm:py-3 bg-slate-50/50 min-w-0 max-w-[200px] sm:max-w-xs overflow-hidden">
              <div className="hidden xs:flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary mr-3 shadow-inner shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  domain
                </span>
              </div>
              <div className="flex flex-col min-w-0 w-full">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1 truncate">
                  Cliente Atual
                </span>
                <span className="text-xs sm:text-sm lg:text-base font-black text-slate-800 leading-none truncate w-full">
                  {projeto.EMPRESAS?.nm_fantasia}
                </span>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="print-hidden shrink-0 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-colors border border-slate-200 h-full min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">
                print
              </span>
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </header>

        {/* ÁREA COM SCROLL INTERNO PARA GRÁFICOS */}
        <div
          id="area-impressao"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 scrollbar-hide max-w-[1600px] mx-auto w-full"
        >
          {/* 4 CARDS DE INDICADORES (Grid responsivo: 2 colunas mobile, 4 desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 break-inside-avoid">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2 sm:mb-4">
                <span className="material-symbols-outlined text-slate-400 hidden sm:block">
                  bar_chart
                </span>
                <span className="bg-yellow-50 text-yellow-600 text-[9px] sm:text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded w-fit">
                  {getMaturidadeTexto(metricas.maturidadeRH)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl sm:text-3xl font-black text-accent">
                  {metricas.maturidadeRH}
                </h3>
                <span className="text-slate-400 text-xs sm:text-sm">/100</span>
              </div>
              <p className="text-slate-500 text-[11px] sm:text-sm font-medium mt-1">
                Maturidade RH
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2 sm:mb-4">
                <span className="material-symbols-outlined text-slate-400 hidden sm:block">
                  thermostat
                </span>
                <span className="bg-blue-50 text-primary text-[9px] sm:text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded w-fit">
                  {getClimaTexto(metricas.clima)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl sm:text-3xl font-black text-primary">
                  {metricas.clima}
                </h3>
                <span className="text-slate-400 text-xs sm:text-sm">/100</span>
              </div>
              <p className="text-slate-500 text-[11px] sm:text-sm font-medium mt-1">
                Clima Atual
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2 sm:mb-4">
                <span className="material-symbols-outlined text-slate-400 hidden sm:block">
                  groups
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-text-main">
                  {metricas.colaboradores}
                </h3>
              </div>
              <p className="text-slate-500 text-[11px] sm:text-sm font-medium mt-1">
                Mapeados
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2 sm:mb-4">
                <span className="material-symbols-outlined text-slate-400 hidden sm:block">
                  shield
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded w-fit ${metricas.riscoTrabalhista > 50 ? "bg-red-50 text-red-600" : "bg-orange-50 text-accent"}`}
                >
                  {getRiscoTexto(metricas.riscoTrabalhista)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <h3
                  className={`text-2xl sm:text-3xl font-black ${metricas.riscoTrabalhista > 50 ? "text-red-600" : "text-accent"}`}
                >
                  {metricas.riscoTrabalhista}
                </h3>
                <span className="text-slate-400 text-xs sm:text-sm">/100</span>
              </div>
              <p className="text-slate-500 text-[11px] sm:text-sm font-medium mt-1">
                Risco Passivo
              </p>
            </div>
          </div>

          {/* LINHA DE GRÁFICOS (Grid responsivo: 1 col mobile, 3 desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 break-inside-avoid">
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-accent text-[20px]">
                  thermostat
                </span>
                <h3 className="font-bold text-primary text-sm sm:text-base">
                  Radar de Clima
                </h3>
              </div>
              <div className="w-full h-56 sm:h-64 flex justify-center items-center relative">
                {metricas.clima > 0 ? (
                  <div className="w-full h-full -ml-4 sm:ml-0">
                    <Chart
                      options={radarOptions}
                      series={[{ name: "Clima", data: metricas.radarData }]}
                      type="radar"
                      height="100%"
                      width="100%"
                    />
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-slate-400 text-center">
                    Aguardando <br /> Avaliação
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-accent text-[20px]">
                  pie_chart
                </span>
                <h3 className="font-bold text-primary text-sm sm:text-base">
                  Distribuição DISC
                </h3>
              </div>
              <div className="w-full h-56 sm:h-64 flex justify-center items-center">
                {metricas.colaboradores > 0 ? (
                  <Chart
                    options={donutOptions}
                    series={metricas.discData}
                    type="donut"
                    height="100%"
                    width="100%"
                  />
                ) : (
                  <span className="text-xs sm:text-sm font-medium text-slate-400 text-center">
                    Nenhum colaborador <br /> avaliado
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-accent text-[20px]">
                  leaderboard
                </span>
                <h3 className="font-bold text-primary text-sm sm:text-base">
                  Desempenho (Área)
                </h3>
              </div>
              <div className="w-full h-56 sm:h-64 flex justify-center items-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <span className="text-xs sm:text-sm font-bold text-slate-400 text-center px-4">
                  Módulo em <br /> Desenvolvimento
                </span>
              </div>
            </div>
          </div>

          {/* RODAPÉ: ALERTAS E PRÓXIMAS AÇÕES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 break-inside-avoid">
            {/* ALERTAS */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-primary mb-5 flex items-center gap-2 text-sm sm:text-base">
                <span className="material-symbols-outlined text-accent">
                  warning_amber
                </span>
                Alertas Prioritários
              </h3>
              <div className="space-y-3">
                {metricas.alertas.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-400 font-medium italic p-3 bg-slate-50 rounded-xl">
                    Nenhum alerta crítico para este projeto no momento.
                  </p>
                ) : (
                  metricas.alertas.map((alerta, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-red-50/30 border border-red-100"
                    >
                      <span className="material-symbols-outlined text-red-500 mt-0.5 text-lg">
                        error_outline
                      </span>
                      <p className="text-slate-800 font-bold text-xs sm:text-sm leading-snug">
                        {alerta}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PRÓXIMAS AÇÕES */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-primary mb-5 flex items-center gap-2 text-sm sm:text-base">
                <span className="material-symbols-outlined text-green-500">
                  task_alt
                </span>
                Próximas Ações
              </h3>
              <div className="space-y-2">
                {metricas.clima === 0 && (
                  <div className="flex items-center gap-3 sm:gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="shrink-0 size-8 sm:size-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] sm:text-[20px]">
                        trending_up
                      </span>
                    </span>
                    <span className="text-slate-700 text-xs sm:text-sm font-bold flex-1">
                      Aplicar pesquisa de clima
                    </span>
                    <button
                      onClick={() =>
                        router.push(`/projetos/${params.id}/clima`)
                      }
                      className="print-hidden shrink-0 text-white bg-primary hover:bg-accent px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
                    >
                      Iniciar
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 sm:gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="shrink-0 size-8 sm:size-10 rounded-full bg-blue-100 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] sm:text-[20px]">
                      psychology
                    </span>
                  </span>
                  <span className="text-slate-700 text-xs sm:text-sm font-bold flex-1 leading-tight">
                    Mapear novos <br className="sm:hidden" /> colaboradores
                    (DISC)
                  </span>
                  <button
                    onClick={() => router.push(`/projetos/${params.id}/equipe`)}
                    className="print-hidden shrink-0 text-white bg-primary hover:bg-accent px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
                  >
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
