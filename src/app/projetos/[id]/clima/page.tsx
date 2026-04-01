"use client";

import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ClimaOrganizacionalPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [nomeExibicao, setNomeExibicao] = useState<string>("");
  const [climaData, setClimaData] = useState<any>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);

        // 1. Busca o nome da Empresa
        const { data: projData } = await supabase
          .from("PROJETOS")
          .select(`cd_empresa, EMPRESAS ( nm_fantasia )`)
          .eq("cd_projeto", params.id)
          .single();

        if (projData) {
          const empresa = Array.isArray(projData.EMPRESAS)
            ? projData.EMPRESAS[0]
            : projData.EMPRESAS;
          setNomeExibicao(empresa?.nm_fantasia || "");
        }

        // 2. Busca TODAS as respostas individuais para calcular a média
        const { data: respostas, error: errR } = await supabase
          .from("RESPOSTAS_INDIVIDUAIS_CLIMA")
          .select("*")
          .eq("cd_projeto", params.id);

        if (respostas && respostas.length > 0) {
          const total = respostas.length;

          // Função para calcular média de uma coluna
          const calcMedia = (coluna: string) => {
            const soma = respostas.reduce(
              (acc, curr) => acc + (curr[coluna] || 0),
              0,
            );
            // Multiplicamos por 20 para transformar escala Likert 1-5 em 1-100%
            return Math.round((soma / total) * 20);
          };

          const dimensoesFormatadas = [
            {
              id: "lideranca",
              label: "Liderança",
              score: calcMedia("nr_lideranca"),
            },
            {
              id: "comunicac",
              label: "Comunicação",
              score: calcMedia("nr_comunicac"),
            },
            {
              id: "reconhecir",
              label: "Reconhecimento",
              score: calcMedia("nr_reconhecir"),
            },
            {
              id: "desenvolvi",
              label: "Desenvolvimento",
              score: calcMedia("nr_desenvolvi"),
            },
            {
              id: "ambiente",
              label: "Ambiente",
              score: calcMedia("nr_ambiente"),
            },
            {
              id: "engajamen",
              label: "Engajamento",
              score: calcMedia("nr_engajamen"),
            },
          ].map((d) => ({
            ...d,
            status:
              d.score >= 70 ? "Forte" : d.score >= 50 ? "Estável" : "Sensível",
            color:
              d.score >= 70
                ? "text-emerald-600 bg-emerald-50"
                : d.score >= 50
                  ? "text-blue-600 bg-blue-50"
                  : "text-orange-600 bg-orange-50",
          }));

          const indiceGeral = Math.round(
            dimensoesFormatadas.reduce((acc, d) => acc + d.score, 0) / 6,
          );

          // Extrai as respostas qualitativas
          const respostasQuali = respostas
            .map((r) => r.js_respostas_abertas)
            .filter((r) => r && Object.keys(r).length > 0);

          setClimaData({
            indiceGeral,
            totalRespostas: total,
            dimensoes: dimensoesFormatadas,
            respostasQuali,
          });
        } else {
          setClimaData(null);
        }
      } catch (error) {
        console.error("Erro ao carregar Clima:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) carregarDados();
  }, [params.id]);

  // Gerador de PDF
  const handlePrint = () => {
    if (!climaData) return;

    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    const statusGeral =
      climaData.indiceGeral >= 70
        ? "Positivo / Forte"
        : climaData.indiceGeral >= 50
          ? "Estável"
          : "Sensível / Alerta";

    const detalhesHTML = climaData.dimensoes
      .map((d: any) => {
        const corBarra =
          d.score >= 70 ? "#059669" : d.score >= 50 ? "#064384" : "#ea580c";
        return `
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 5px;">
            <span style="color: #334155;">${d.label}</span>
            <span style="color: ${corBarra};">${d.score}% - ${d.status}</span>
          </div>
          <div style="height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
            <div style="height: 100%; width: ${d.score}%; background: ${corBarra};"></div>
          </div>
        </div>
      `;
      })
      .join("");

    let comentariosHTML = "";
    if (climaData.respostasQuali.length > 0) {
      comentariosHTML = `
        <h3 style="color: #064384; border-bottom: 2px solid #064384; padding-bottom: 5px; margin-top: 40px;">Comentários e Sugestões (Amostra)</h3>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px;">
      `;
      // Pega os 5 primeiros comentários válidos para não poluir o PDF
      const amostra = climaData.respostasQuali.slice(0, 5);
      amostra.forEach((quali: any, index: number) => {
        if (quali.q1)
          comentariosHTML += `<p style="font-size: 13px; margin-bottom: 10px;"><strong>O que fazemos bem:</strong> "${quali.q1}"</p>`;
        if (quali.q2)
          comentariosHTML += `<p style="font-size: 13px; margin-bottom: 10px; color: #dc2626;"><strong>O que melhorar:</strong> "${quali.q2}"</p>`;
        if (index < amostra.length - 1)
          comentariosHTML += `<hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 15px 0;"/>`;
      });
      comentariosHTML += `</div>`;
    }

    janela.document.write(`
      <html>
        <head><style>body{font-family: Arial, sans-serif; padding: 40px; color: #1e293b;} @media print { body { -webkit-print-color-adjust: exact; } }</style></head>
        <body>
          <h1 style="color: #064384; text-align: center; margin-bottom: 5px;">Relatório de Clima Organizacional</h1>
          <h3 style="text-align: center; color: #64748b; margin-top: 0;">Empresa: ${nomeExibicao} | Respostas: ${climaData.totalRespostas}</h3>
          
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; text-transform: uppercase; font-weight: bold; color: #64748b;">Índice Geral de Clima</p>
            <h1 style="font-size: 64px; margin: 10px 0; color: #064384;">${climaData.indiceGeral}%</h1>
            <p style="font-weight: bold; font-size: 18px; color: ${climaData.indiceGeral >= 50 ? "#059669" : "#ea580c"};">Classificação: ${statusGeral}</p>
          </div>

          <h3 style="color: #064384; border-bottom: 2px solid #064384; padding-bottom: 5px;">Análise por Dimensão</h3>
          <div style="margin-bottom: 30px;">${detalhesHTML}</div>

          ${comentariosHTML}
          
          <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">
            Gerado via Consultoria Wallison Branquinho - Metodologia 360º
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
        </body>
      </html>
    `);
    janela.document.close();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#064384]">
          progress_activity
        </span>
      </div>
    );
  }

  if (!climaData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4">
        <span className="material-symbols-outlined text-6xl text-slate-300">
          thermostat
        </span>
        <h2 className="text-2xl font-black text-[#064384]">
          Pesquisa não iniciada
        </h2>
        <p className="text-slate-500 text-center max-w-sm font-medium">
          Copie o link público e envie para os colaboradores da empresa{" "}
          <b>{nomeExibicao}</b> para começar a coletar os dados.
        </p>
        <button
          onClick={() => {
            const link = `${window.location.origin}/pesquisa/clima/${params.id}`;
            navigator.clipboard.writeText(link);
            setLinkCopiado(true);
            setTimeout(() => setLinkCopiado(false), 2000);
          }}
          className="mt-4 bg-[#FF8323] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">
            {linkCopiado ? "check" : "content_copy"}
          </span>
          {linkCopiado ? "Link Copiado!" : "Copiar Link Público"}
        </button>
      </div>
    );
  }

  const radarOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "radar",
      toolbar: { show: false },
      fontFamily: "Montserrat",
    },
    labels: climaData.dimensoes.map((d: any) => d.label),
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
          colors: Array(6).fill("#64748b"),
          fontSize: "10px",
          fontWeight: 700,
        },
      },
    },
  };

  const barOptions: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Montserrat" },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 4, barHeight: "55%" },
    },
    colors: ["#FF8323"],
    xaxis: {
      categories: [...climaData.dimensoes]
        .sort((a, b) => a.score - b.score)
        .map((d) => d.label),
      min: 0,
      max: 100,
    },
    grid: { strokeDashArray: 4 },
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-20">
      {/* HEADER DE COMANDOS */}
      <header className="bg-white/95 backdrop-blur-sm px-6 py-5 border-b border-slate-200 shadow-sm sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/projetos/${params.id}/templates`)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-[#064384] tracking-tight">
              Clima Organizacional
            </h2>
            <p className="text-xs text-[#FF8323] font-bold uppercase tracking-widest">
              {nomeExibicao}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              const link = `${window.location.origin}/pesquisa/clima/${params.id}`;
              navigator.clipboard.writeText(link);
              setLinkCopiado(true);
              setTimeout(() => setLinkCopiado(false), 2000);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {linkCopiado ? "check" : "content_copy"}
            </span>
            {linkCopiado ? "Link Copiado" : "Link Público"}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#064384] hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              picture_as_pdf
            </span>
            Gerar Relatório PDF
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto w-full px-6 py-8 space-y-6">
        {/* KPI GERAL */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
              Painel de Resultados
            </h1>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-500">
                how_to_reg
              </span>
              <p className="text-slate-500 font-bold text-sm">
                Baseado em{" "}
                <strong className="text-[#064384]">
                  {climaData.totalRespostas}
                </strong>{" "}
                participações anônimas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 pr-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Índice Geral
              </p>
              <span
                className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${climaData.indiceGeral >= 50 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}
              >
                {climaData.indiceGeral >= 70
                  ? "Positivo"
                  : climaData.indiceGeral >= 50
                    ? "Estável"
                    : "Alerta"}
              </span>
            </div>
            <div className="text-6xl font-black text-[#064384] tracking-tighter">
              {climaData.indiceGeral}
              <span className="text-3xl text-slate-300">%</span>
            </div>
          </div>
        </div>

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h3 className="font-black text-slate-400 text-xs mb-6 uppercase tracking-widest">
              Radar por Domínio
            </h3>
            <Chart
              options={radarOptions}
              series={[
                {
                  name: "Score",
                  data: climaData.dimensoes.map((d: any) => d.score),
                },
              ]}
              type="radar"
              height={320}
            />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h3 className="font-black text-slate-400 text-xs mb-6 uppercase tracking-widest">
              Ranking de Prioridades
            </h3>
            <Chart
              options={barOptions}
              series={[
                {
                  name: "Nota",
                  data: [...climaData.dimensoes]
                    .sort((a, b) => a.score - b.score)
                    .map((d) => d.score),
                },
              ]}
              type="bar"
              height={320}
            />
          </div>
        </div>

        {/* BARRAS DE STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {climaData.dimensoes.map((dim: any) => (
            <div
              key={dim.label}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-slate-700 text-sm">
                  {dim.label}
                </h4>
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${dim.color}`}
                >
                  {dim.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#064384] transition-all"
                    style={{ width: `${dim.score}%` }}
                  ></div>
                </div>
                <span className="font-black text-slate-800 text-lg">
                  {dim.score}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* RESPOSTAS ABERTAS / QUALITATIVAS */}
        {climaData.respostasQuali.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mt-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#FF8323] text-3xl">
                chat
              </span>
              <div>
                <h3 className="font-black text-slate-800 text-xl tracking-tight">
                  Comentários e Sugestões
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  Insights anônimos deixados pela equipe.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* O que fazemos bem */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">
                  O que fazemos bem
                </h4>
                {climaData.respostasQuali.map(
                  (r: any, i: number) =>
                    r.q1 && (
                      <div
                        key={i}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative"
                      >
                        <span className="material-symbols-outlined absolute top-4 right-4 text-emerald-200 opacity-50">
                          format_quote
                        </span>
                        <p className="text-sm text-slate-600 font-medium italic pr-6">
                          "{r.q1}"
                        </p>
                      </div>
                    ),
                )}
              </div>

              {/* O que precisamos melhorar */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-red-500 uppercase tracking-widest border-b border-red-100 pb-2">
                  O que melhorar urgente
                </h4>
                {climaData.respostasQuali.map(
                  (r: any, i: number) =>
                    r.q2 && (
                      <div
                        key={i}
                        className="bg-red-50/50 p-4 rounded-xl border border-red-100 relative"
                      >
                        <span className="material-symbols-outlined absolute top-4 right-4 text-red-200 opacity-50">
                          format_quote
                        </span>
                        <p className="text-sm text-slate-700 font-medium italic pr-6">
                          "{r.q2}"
                        </p>
                      </div>
                    ),
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
