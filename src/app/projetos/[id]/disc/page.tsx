"use client";

import { supabase } from "@/lib/supabase";
import { calcularPontuacaoDisc, derivarPerfilDisc, calcularExigenciaMeio, calcularAderencia } from "@/lib/disc-utils";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function AnaliseDiscEquipePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [listaFunc, setListaFunc] = useState<{ cd_funcionario: string; nm_completo: string; sg_perfil_disc: string | null; js_pontuacao_disc: any }[]>([]);

  useEffect(() => {
    const buscarDadosDaEquipe = async () => {
      try {
        setLoading(true);

        // 1. Descobre a empresa do projeto
        const { data: projData, error: projError } = await supabase
          .from("PROJETOS")
          .select("cd_empresa")
          .eq("cd_projeto", params.id)
          .single();

        if (projError) throw projError;

        // 2. Busca funcionários da empresa
        const { data: funcionarios, error: funcError } = await supabase
          .from("FUNCIONARIOS")
          .select("cd_funcionario, nm_completo, sg_perfil_disc, js_pontuacao_disc")
          .eq("cd_empresa", projData.cd_empresa)
          .eq("sn_ativo", true);

        if (funcError) throw funcError;

        setListaFunc(funcionarios || []);

        const concluidos = (funcionarios || []).filter(
          (f) => f.js_pontuacao_disc?.status === "CONCLUIDO" && f.js_pontuacao_disc?.respostas_brutas,
        );

        const totalTestes = concluidos.length;

        if (totalTestes === 0) {
          setStats(null);
          return;
        }

        // 3. Calcula scores de cada funcionário a partir das respostas brutas
        const avaliacoes = concluidos.map((f) => {
          const scores = calcularPontuacaoDisc(f.js_pontuacao_disc.respostas_brutas);
          const exigencia = calcularExigenciaMeio(f.js_pontuacao_disc.respostas_brutas);
          const aderencia = calcularAderencia(scores, exigencia);
          return {
            scores,
            respostas: f.js_pontuacao_disc.respostas_brutas,
            aderencia
          };
        });

        // 4. Contagem de perfis predominantes
        const contagem = { D: 0, I: 0, S: 0, C: 0 };
        avaliacoes.forEach(({ scores, respostas }) => {
          const perfilPrincipal = derivarPerfilDisc(scores, respostas)[0] as keyof typeof contagem;
          contagem[perfilPrincipal]++;
        });

        // 5. Distribuição percentual para o gráfico
        const dist = {
          D: Math.round((contagem.D / totalTestes) * 100),
          I: Math.round((contagem.I / totalTestes) * 100),
          S: Math.round((contagem.S / totalTestes) * 100),
          C: Math.round((contagem.C / totalTestes) * 100),
        };

        // 6. Média dos scores da equipe (para barras de maturidade)
        const mediaDI = Math.round(avaliacoes.reduce((s, a) => s + a.scores.D + a.scores.I, 0) / (totalTestes * 2));
        const mediaCS = Math.round(avaliacoes.reduce((s, a) => s + a.scores.C + a.scores.S, 0) / (totalTestes * 2));

        const maturidade = {
          autoconhecimento: mediaCS,
          comunicacao: mediaDI,
          conflitos: Math.round(avaliacoes.reduce((s, a) => s + a.scores.S, 0) / totalTestes),
          adaptabilidade: Math.round(avaliacoes.reduce((s, a) => s + a.scores.D + a.scores.I, 0) / (totalTestes * 2)),
          trabalhoEquipe: Math.round(avaliacoes.reduce((s, a) => s + a.scores.S + a.scores.I, 0) / (totalTestes * 2)),
        };

        const perfilEquipe = Object.keys(dist).reduce((a, b) =>
          dist[a as keyof typeof dist] > dist[b as keyof typeof dist] ? a : b,
        );

        setStats({
          total: totalTestes,
          distribuicao: dist,
          perfilEquipe,
          aderenciaMedia: Math.round(avaliacoes.reduce((s, a) => s + a.aderencia, 0) / totalTestes),
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

  // Gradiente do Gráfico de Rosca (Distribuição da Equipe)
  const donutGradient = stats
    ? `conic-gradient(#EF4444 0% ${stats.distribuicao.D}%, #EAB308 ${stats.distribuicao.D}% ${stats.distribuicao.D + stats.distribuicao.I}%, #22C55E ${stats.distribuicao.D + stats.distribuicao.I}% ${stats.distribuicao.D + stats.distribuicao.I + stats.distribuicao.S}%, #3B82F6 ${stats.distribuicao.D + stats.distribuicao.I + stats.distribuicao.S}% 100%)`
    : "";

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
      data: stats ? [
        stats.maturidade.autoconhecimento,
        stats.maturidade.comunicacao,
        stats.maturidade.conflitos,
        stats.maturidade.adaptabilidade,
        stats.maturidade.trabalhoEquipe,
      ] : [0, 0, 0, 0, 0],
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-20">
      {/* Header Superior */}
      <header className="bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-5 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 border-b border-slate-200 shadow-sm sticky top-0 z-10 shrink-0 w-full">
        <div className="flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-4 pl-12 lg:pl-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-primary tracking-tight">
              Análise DISC da Equipe
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium pl-12 lg:pl-0 sm:ml-10 leading-tight">
            Visão consolidada do perfil comportamental e maturidade do time.
          </p>
        </div>

        {/* BOTÃO DE PDF */}
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={handlePrint}
            className="print-hidden flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors shadow-sm focus:outline-none"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Relatório PDF
          </button>
        </div>
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
          {stats && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-[#FF8323]">
                fact_check
              </span>
              <span className="text-sm font-bold text-slate-700">
                {stats.total} Testes Concluídos
              </span>
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* GRID DOS GRÁFICOS                                 */}
        {/* ================================================= */}
        {!stats && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center mb-6">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">pie_chart</span>
            <p className="font-bold text-slate-600 mb-1">Nenhum colaborador finalizou o teste DISC ainda.</p>
            <p className="text-sm text-slate-400">Envie os links de pesquisa para gerar os gráficos consolidados.</p>
          </div>
        )}
        {stats && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </div>}

        {/* ======================================= */}
        {/* LISTAGEM INDIVIDUAL — STATUS DISC       */}
        {/* ======================================= */}
        <div className="mt-8">
          <h3 className="text-sm font-black text-[#064384] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">group</span>
            Status Individual — DISC por Colaborador
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Colaborador</th>
                  <th className="text-center px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Perfil</th>
                  <th className="text-center px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status DISC</th>
                  <th className="text-right px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Ação</th>
                </tr>
              </thead>
              <tbody>
                {listaFunc.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-sm text-slate-400 font-medium">
                      Nenhum colaborador cadastrado neste projeto.
                    </td>
                  </tr>
                ) : (
                  listaFunc.map((f) => {
                    const concluido = f.js_pontuacao_disc?.status === "CONCLUIDO" && f.js_pontuacao_disc?.respostas_brutas;
                    const perfil = f.sg_perfil_disc || (concluido ? "?" : null);
                    const discCorMap: Record<string, string> = { D: "bg-red-500", I: "bg-yellow-400", S: "bg-green-500", C: "bg-blue-500" };
                    const discCor = perfil ? (discCorMap[perfil[0]] || "bg-slate-400") : "bg-slate-200";

                    return (
                      <tr key={f.cd_funcionario} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-sm text-slate-800">{f.nm_completo}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {perfil ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-black ${discCor}`}>
                              {perfil[0]}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs font-bold">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {concluido ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-3 py-1 rounded-full">
                              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              Realizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-black px-3 py-1 rounded-full">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => router.push(`/projetos/${params.id}/equipe/${f.cd_funcionario}`)}
                            className="text-xs font-bold text-[#064384] hover:underline"
                          >
                            Ver perfil
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
