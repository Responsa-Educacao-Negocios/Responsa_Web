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

        if (projData) setNomeExibicao(projData.EMPRESAS?.nm_fantasia || "");

        // 2. Busca TODAS as respostas individuais para calcular a média em tempo real
        const { data: respostas, error: errR } = await supabase
          .from("RESPOSTAS_INDIVIDUAIS_CLIMA")
          .select("*")
          .eq("cd_projeto", params.id);

        console.log("Respostas Individuais:", respostas, errR);

        if (respostas && respostas.length > 0) {
          const total = respostas.length;

          // Função para calcular média de uma coluna
          const calcMedia = (coluna: string) => {
            const soma = respostas.reduce(
              (acc, curr) => acc + (curr[coluna] || 0),
              0,
            );
            // Multiplicamos por 10 para transformar escala de 1-10 em 1-100% conforme o print
            return Math.round((soma / total) * 10);
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
                ? "text-green-600 bg-green-50"
                : d.score >= 50
                  ? "text-blue-600 bg-blue-50"
                  : "text-orange-600 bg-orange-50",
          }));

          // Média Geral de todas as dimensões
          const indiceGeral = Math.round(
            dimensoesFormatadas.reduce((acc, d) => acc + d.score, 0) / 6,
          );

          setClimaData({
            indiceGeral,
            totalRespostas: total,
            dimensoes: dimensoesFormatadas,
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">
          progress_activity
        </span>
      </div>
    );
  }

  if (!climaData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4">
        <span className="material-symbols-outlined text-6xl text-slate-200">
          thermostat
        </span>
        <h2 className="text-xl font-bold text-slate-700">
          Nenhuma pesquisa de clima iniciada
        </h2>
        <p className="text-slate-500 text-center max-w-xs font-medium">
          Clique no botão abaixo para copiar o link e enviar aos colaboradores.
        </p>
        <button
          onClick={() => {
            const link = `${window.location.origin}/pesquisa/clima/${params.id}`;
            navigator.clipboard.writeText(link);
            setLinkCopiado(true);
            setTimeout(() => setLinkCopiado(false), 2000);
          }}
          className="bg-[#FF8323] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-all active:scale-95"
        >
          {linkCopiado ? "Link Copiado!" : "Lançar Pesquisa"}
        </button>
      </div>
    );
  }

  // Opções do Gráfico Radar (Azul RESPONSA)
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
          fontWeight: 600,
        },
      },
    },
  };

  // Ranking de Prioridades (Barras Pretas conforme print)
  const barOptions: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Montserrat" },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 4, barHeight: "55%" },
    },
    colors: ["#111827"],
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
      <header className="bg-white/95 backdrop-blur-sm pt-8 pb-6 px-8 flex justify-between items-end border-b border-slate-200 shadow-sm sticky top-0 z-10 shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Clima Organizacional
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Visão geral do diagnóstico de clima para {nomeExibicao}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const link = `${window.location.origin}/pesquisa/clima/${params.id}`;
              navigator.clipboard.writeText(link);
              setLinkCopiado(true);
              setTimeout(() => setLinkCopiado(false), 2000);
            }}
            className={`px-4 py-2 rounded shadow transition-all font-bold text-xs uppercase ${linkCopiado ? "bg-green-500 text-white" : "bg-[#FF8323] text-white"}`}
          >
            {linkCopiado ? "Link Copiado!" : "Lançar Pesquisa"}
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto w-full px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Diagnóstico de Clima
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Baseado em {climaData.totalRespostas} participações.
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Índice Geral
              </p>
              <p className="text-2xl font-black text-[#064384]">
                {climaData.indiceGeral}/100
              </p>
            </div>
            <span className="bg-blue-50 text-blue-600 font-black px-3 py-1 rounded-lg text-xs uppercase">
              Estável
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-6 uppercase opacity-60">
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
            <h3 className="font-bold text-slate-800 text-sm mb-6 uppercase opacity-60">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {climaData.dimensoes.map((dim: any) => (
            <div
              key={dim.label}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-slate-700 text-sm">
                  {dim.label}
                </h4>
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${dim.color}`}
                >
                  {dim.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#064384] transition-all"
                    style={{ width: `${dim.score}%` }}
                  ></div>
                </div>
                <span className="font-black text-slate-800">{dim.score}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
