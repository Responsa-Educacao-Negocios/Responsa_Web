"use client";

import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Importando o ApexCharts para o gráfico de barras horizontais
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function AnaliseDiscEquipePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const buscarDadosDaEquipe = async () => {
      try {
        setLoading(true);

        // 1. Busca TODAS as avaliações DISC vinculadas diretamente a este PROJETO
        const { data: avaliacoes, error } = await supabase
          .from("AVALIACOES_DISC")
          .select("*")
          .eq("cd_projeto", params.id);

        if (error) throw error;

        const totalTestes = avaliacoes ? avaliacoes.length : 0;

        if (totalTestes === 0) {
          setStats(null);
          return;
        }

        // 2. Contagem de Perfis Predominantes
        const contagem = { D: 0, I: 0, S: 0, C: 0 };

        avaliacoes.forEach((a) => {
          // Pega as notas da avaliação individual e descobre qual é a maior
          const scores = {
            D: a.nr_dominancia || 0,
            I: a.nr_influencia || 0,
            S: a.nr_estabilidade || 0,
            C: a.nr_conformidade || 0,
          };

          // Encontra a letra com a maior pontuação
          const perfilPrincipal = Object.keys(scores).reduce((x, y) =>
            scores[x as keyof typeof scores] > scores[y as keyof typeof scores]
              ? x
              : y,
          );

          contagem[perfilPrincipal as keyof typeof contagem]++;
        });

        // 3. Transformando em Porcentagens para o Gráfico de Rosca
        const dist = {
          D: Math.round((contagem.D / totalTestes) * 100),
          I: Math.round((contagem.I / totalTestes) * 100),
          S: Math.round((contagem.S / totalTestes) * 100),
          C: Math.round((contagem.C / totalTestes) * 100),
        };

        // 4. Achando o perfil predominante da equipe
        const perfilEquipe = Object.keys(dist).reduce((a, b) =>
          dist[a as keyof typeof dist] > dist[b as keyof typeof dist] ? a : b,
        );

        // 5. Mocks de Maturidade Comportamental (Média da Equipe)
        const maturidade = {
          autoconhecimento: 55,
          comunicacao: 62,
          conflitos: 40,
          adaptabilidade: 58,
          trabalhoEquipe: 70,
        };

        setStats({
          total: totalTestes,
          distribuicao: dist,
          perfilEquipe,
          aderenciaMedia: 85, // Mock temporário
          maturidade,
        });
      } catch (error) {
        console.error("Erro ao buscar dados da equipe:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) buscarDadosDaEquipe();
  }, [params.id]);

  // --- FUNÇÃO DE IMPRESSÃO / PDF ---
  const handlePrint = () => {
    const conteudo = document.getElementById("area-impressao")?.innerHTML;
    if (!conteudo) return;

    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    janela.document.write(`
      <html>
        <head>
          <title>Análise DISC da Equipe</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
          <style>
            @media print {
              @page { margin: 10mm; size: A4 landscape; } /* Paisagem fica melhor para os gráficos juntos */
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
              <p class="text-slate-500 font-medium">Análise DISC - Visão Geral da Equipe</p>
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">
          progress_activity
        </span>
      </div>
    );
  }

  // Se não houver dados estatísticos
  if (!stats) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-6xl text-slate-300">
          pie_chart
        </span>
        <h2 className="text-xl font-bold text-slate-700">
          Sem dados suficientes
        </h2>
        <p className="text-sm text-slate-500 max-w-md text-center">
          Nenhum colaborador desta equipe finalizou o teste DISC ainda. Envie os
          links de pesquisa para gerar este dashboard.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-[#064384] text-white rounded-lg font-bold text-sm"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Gradiente do Gráfico de Rosca (Distribuição da Equipe)
  const donutGradient = `conic-gradient(#EF4444 0% ${stats.distribuicao.D}%, #EAB308 ${stats.distribuicao.D}% ${stats.distribuicao.D + stats.distribuicao.I}%, #22C55E ${stats.distribuicao.D + stats.distribuicao.I}% ${stats.distribuicao.D + stats.distribuicao.I + stats.distribuicao.S}%, #3B82F6 ${stats.distribuicao.D + stats.distribuicao.I + stats.distribuicao.S}% 100%)`;

  // Configuração do Gráfico de Barras Horizontais (ApexCharts)
  const barChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Montserrat, sans-serif",
      animations: { enabled: false }, // Desliga animação na impressão
    },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 4, barHeight: "60%" },
    },
    colors: ["#064384"],
    dataLabels: { enabled: false },
    xaxis: {
      categories: [
        "Autoconhecimento",
        "Comunicação",
        "Conflitos",
        "Adaptabilidade",
        "Trabalho em equipe",
      ],
      min: 0,
      max: 100,
      labels: { style: { colors: "#94a3b8", fontSize: "10px" } },
    },
    yaxis: {
      labels: {
        style: { colors: "#475569", fontSize: "11px", fontWeight: 600 },
      },
    },
    grid: {
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    tooltip: { y: { formatter: (val) => `${val}%` } },
  };

  const barChartSeries = [
    {
      name: "Média da Equipe",
      data: [
        stats.maturidade.autoconhecimento,
        stats.maturidade.comunicacao,
        stats.maturidade.conflitos,
        stats.maturidade.adaptabilidade,
        stats.maturidade.trabalhoEquipe,
      ],
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-20">
      {/* Header Superior */}
      <header className="bg-white/95 backdrop-blur-sm pt-8 pb-6 px-8 flex justify-between items-end border-b border-slate-200 shadow-sm sticky top-0 z-10 shrink-0">
        <div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-slate-400 hover:text-[#064384] mb-1"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight">
              Análise DISC da Equipe
            </h2>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1 ml-10">
            Visão consolidada do perfil comportamental e maturidade do time.
          </p>
        </div>

        {/* BOTÃO DE PDF ADICIONADO AQUI */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors shadow-sm focus:outline-none print-hidden"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          Relatório PDF
        </button>
      </header>

      {/* ÁREA DE IMPRESSÃO COMEÇA AQUI */}
      <main
        id="area-impressao"
        className="max-w-[1400px] mx-auto w-full px-6 py-8 flex-1"
      >
        {/* Título interno que só o PDF não vai esconder (No site esconde pq já tem o header) */}
        <div className="mb-8 flex items-end justify-between break-inside-avoid">
          <div>
            <h1 className="text-3xl font-black text-[#064384] tracking-tight print:hidden">
              Análise DISC da Equipe
            </h1>
            <p className="text-slate-500 font-medium mt-1 print:hidden">
              Visão consolidada do perfil comportamental e maturidade do time.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="material-symbols-outlined text-[#FF8323]">
              fact_check
            </span>
            <span className="text-sm font-bold text-slate-700">
              {stats.total} Testes Concluídos
            </span>
          </div>
        </div>

        {/* ================================================= */}
        {/* GRID DOS GRÁFICOS (Adicionado break-inside-avoid) */}
        {/* ================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. DISTRIBUIÇÃO POR PERFIL (DONUT) */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col break-inside-avoid">
            <h3 className="font-bold text-[#064384] text-sm mb-8">
              Distribuição por Perfil
            </h3>

            <div className="flex flex-col items-center justify-center flex-1">
              {/* Rosca */}
              <div
                className="size-48 rounded-full relative mb-8"
                style={{ background: donutGradient }}
              >
                <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-3xl font-black text-[#064384] leading-none">
                    {stats.perfilEquipe}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">
                    Maioria
                  </span>
                </div>
              </div>

              {/* Legenda Horizontal (Igual ao Print) */}
              <div className="w-full flex justify-center flex-wrap gap-x-6 gap-y-3 px-4">
                {[
                  {
                    label: "D - Dominância",
                    val: stats.distribuicao.D,
                    color: "bg-[#EF4444]",
                  },
                  {
                    label: "I - Influência",
                    val: stats.distribuicao.I,
                    color: "bg-[#EAB308]",
                  },
                  {
                    label: "S - Estabilidade",
                    val: stats.distribuicao.S,
                    color: "bg-[#22C55E]",
                  },
                  {
                    label: "C - Conformidade",
                    val: stats.distribuicao.C,
                    color: "bg-[#3B82F6]",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div
                      className={`size-2.5 rounded-full ${item.color}`}
                    ></div>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {item.label}:{" "}
                      <strong className="text-slate-800">{item.val}%</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. MATURIDADE COMPORTAMENTAL (BARRAS) */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col break-inside-avoid">
            <h3 className="font-bold text-[#064384] text-sm mb-4">
              Maturidade Comportamental
            </h3>
            <div className="flex-1 w-full -ml-2">
              <Chart
                options={barChartOptions}
                series={barChartSeries}
                type="bar"
                height="100%"
              />
            </div>
          </div>

          {/* 3. ANÁLISE DE EQUILÍBRIO (BARRAS DE PROGRESSO) */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col break-inside-avoid">
            <h3 className="font-bold text-[#064384] text-sm mb-8">
              Análise de Equilíbrio
            </h3>

            <div className="flex flex-col justify-center gap-10 flex-1">
              {/* Risco de Conflito */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-slate-700">
                    Risco de Conflito
                  </span>
                  <span className="text-xs font-bold text-orange-500">
                    Médio
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `45%` }}
                  ></div>
                </div>
              </div>

              {/* Equilíbrio da Equipe */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-slate-700">
                    Equilíbrio da Equipe
                  </span>
                  <span className="text-xs font-bold text-[#3B82F6]">62%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3B82F6] rounded-full transition-all duration-1000"
                    style={{ width: `62%` }}
                  ></div>
                </div>
              </div>

              {/* Maturidade Geral */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-slate-700">
                    Aderência aos Cargos
                  </span>
                  <span className="text-xs font-bold text-[#22C55E]">
                    {stats.aderenciaMedia}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22C55E] rounded-full transition-all duration-1000"
                    style={{ width: `${stats.aderenciaMedia}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
