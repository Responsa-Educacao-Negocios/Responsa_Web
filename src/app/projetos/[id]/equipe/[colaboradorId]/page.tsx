"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Tipagem baseada no seu JSON
interface Funcionario {
  cd_funcionario: string;
  nm_completo: string;
  sg_perfil_disc: string;
  dt_admissao: string;
  ds_observacoes?: string;
  js_pontuacao_disc: {
    D: number;
    I: number;
    S: number;
    C: number;
    aderencia: number;
    competencias?: {
      label: string;
      valor: number;
      alvo: number;
      letra: string;
    }[];
  };
  CARGOS?: {
    nm_titulo: string;
  };
}

// Alvos fixos baseados no seu print para o gráfico 2 (Exigência do Meio)
const ALVOS_CARGO = { D: 90, I: 60, S: 40, C: 30 };

export default function RelatorioPsicometricoPage() {
  const params = useParams();
  const router = useRouter();
  const [colab, setColab] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const { data, error } = await supabase
          .from("FUNCIONARIOS")
          .select(`*, CARGOS(nm_titulo)`)
          .eq("cd_funcionario", params.colaboradorId)
          .single();

        if (error) throw error;
        setColab(data);
      } catch (err) {
        console.error("Erro ao carregar relatório:", err);
      } finally {
        setLoading(false);
      }
    };

    buscarDados();
  }, [params.colaboradorId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">
          progress_activity
        </span>
      </div>
    );
  }

  if (!colab || !colab.js_pontuacao_disc) {
    return (
      <div className="p-20 text-center font-medium text-slate-500 flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-4xl">error</span>
        Colaborador não encontrado ou teste ainda não realizado.
        <button
          onClick={() => router.back()}
          className="text-[#064384] underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Atalhos para não repetir código
  const disc = colab.js_pontuacao_disc;
  const getIniciais = (nome: string) => nome.substring(0, 2).toUpperCase();

  // String matemática para montar o Donut Chart colorido (Igual ao Print)
  const donutGradient = `conic-gradient(#EF4444 0% ${disc.D}%, #EAB308 ${disc.D}% ${disc.D + disc.I}%, #22C55E ${disc.D + disc.I}% ${disc.D + disc.I + disc.S}%, #3B82F6 ${disc.D + disc.I + disc.S}% 100%)`;

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col">
      {/* Header Superior */}
      <header className="flex items-center px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#064384] hover:text-[#064384]/80 text-sm font-medium mr-6 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Voltar
        </button>
      </header>

      {/* Perfil do Candidato */}
      <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-start shrink-0">
        <div className="flex gap-5 items-center">
          <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#064384] font-bold text-lg">
            {getIniciais(colab.nm_completo)}
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-800">
                {colab.nm_completo}
              </h1>
              <span className="text-[#064384] text-[9px] font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                Candidato
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">
                  calendar_today
                </span>
                {new Date(colab.dt_admissao).toLocaleDateString("pt-BR")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">
                  work_outline
                </span>
                {colab.CARGOS?.nm_titulo || "Sem Cargo"}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="text-[#064384] font-semibold uppercase tracking-widest opacity-80">
                Perfil Principal:
              </span>
              <span className="font-medium text-slate-800 text-sm">
                {colab.sg_perfil_disc || "Em Análise"}
              </span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              share
            </span>{" "}
            Compartilhar
          </button>
          <button className="flex items-center gap-2 bg-[#FF8323] px-4 py-2 rounded-lg text-xs font-bold text-white hover:bg-[#e5761f] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>{" "}
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-8 bg-white border-b border-slate-200 flex gap-10 shrink-0">
        {[
          { id: "overview", label: "Visão Geral", icon: "grid_view" },
          {
            id: "qualitative",
            label: "Análise Qualitativa",
            icon: "psychology",
          },
          {
            id: "competencies",
            label: "Matriz de Competências",
            icon: "format_list_bulleted",
          },
          { id: "pdi", label: "Plano de Adaptação", icon: "flag" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 text-[13px] font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#FF8323] text-[#FF8323]"
                : "border-transparent text-slate-400 hover:text-[#064384]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>{" "}
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 p-8 overflow-y-auto">
        {/* ================================== */}
        {/* ABA 1: VISÃO GERAL (O Gráfico de Rosca) */}
        {/* ================================== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            {/* CARD 1: Perfil Natural */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#064384] text-[13px]">
                  Perfil Natural (D-I-S-C)
                </h3>
                <span className="material-symbols-outlined text-slate-300 text-[18px]">
                  info
                </span>
              </div>

              {/* O Gráfico de Rosca Colorido */}
              <div className="flex flex-col items-center justify-center py-6 mb-8 relative">
                <div
                  className="size-56 rounded-full relative"
                  style={{ background: donutGradient }}
                >
                  <div className="absolute inset-8 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[40px] font-bold text-[#064384] tracking-tight leading-none">
                      {colab.sg_perfil_disc}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase mt-1">
                      Predominante
                    </span>
                  </div>
                </div>
              </div>

              {/* Legendas Coloridas */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-8 mt-auto">
                {[
                  { label: "Dominância", val: disc.D, color: "bg-[#EF4444]" },
                  { label: "Influência", val: disc.I, color: "bg-[#EAB308]" },
                  { label: "Estabilidade", val: disc.S, color: "bg-[#22C55E]" },
                  { label: "Conformidade", val: disc.C, color: "bg-[#3B82F6]" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`size-3 rounded-full ${item.color}`}
                      ></div>
                      <div className="flex flex-1 justify-between items-end">
                        <span className="text-xs text-slate-600 font-bold">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {item.val}%
                        </span>
                      </div>
                    </div>
                    {/* Linha Fina em Baixo */}
                    <div className="w-full h-[2px] bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${item.val}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 2: Perfil vs Exigência do Meio */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <h3 className="font-bold text-slate-800 text-[13px]">
                  Perfil vs. Exigência do Meio
                </h3>
                <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-[#064384]">
                    <div className="h-2 w-2 bg-[#064384] rounded-sm"></div>{" "}
                    Perfil Atual
                  </span>
                  <span className="flex items-center gap-1.5 text-[#EF4444]">
                    <div className="h-2 w-2 bg-[#EF4444] rounded-sm"></div>{" "}
                    Cargo
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-8 flex-1">
                {[
                  {
                    letter: "D",
                    val: disc.D,
                    target: ALVOS_CARGO.D,
                    color: "text-[#EF4444]",
                  },
                  {
                    letter: "I",
                    val: disc.I,
                    target: ALVOS_CARGO.I,
                    color: "text-[#EAB308]",
                  },
                  {
                    letter: "S",
                    val: disc.S,
                    target: ALVOS_CARGO.S,
                    color: "text-[#22C55E]",
                  },
                  {
                    letter: "C",
                    val: disc.C,
                    target: ALVOS_CARGO.C,
                    color: "text-[#3B82F6]",
                  },
                ].map((item) => (
                  <div key={item.letter} className="flex items-center gap-4">
                    <span className={`w-6 font-bold text-xl ${item.color}`}>
                      {item.letter}
                    </span>
                    <div className="flex-1 relative h-6 rounded flex items-center">
                      {/* Marcador Alvo (Cargo) - Rosa Claro Grosso */}
                      <div
                        className="absolute h-[24px] rounded-r-md bg-red-200 border-l-4 border-[#EF4444] z-0 transition-all duration-1000"
                        style={{ width: `${item.target}%`, left: 0 }}
                      ></div>
                      {/* Marcador Atual (Perfil) - Azul Escuro */}
                      <div
                        className="absolute h-[12px] bg-[#064384] rounded-md z-10 transition-all duration-1000 shadow-sm"
                        style={{ width: `${item.val}%`, left: 0 }}
                      ></div>
                    </div>
                    <span className="w-12 text-right text-xs text-slate-500 font-bold">
                      {item.val}/{item.target}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Aderência Geral
                  </p>
                  <p className="text-3xl font-light text-[#064384] tracking-tight">
                    {disc.aderencia}%
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_up
                  </span>
                  <span className="text-[11px] font-bold">
                    Alta Compatibilidade
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================== */}
        {/* ABA 2: ANÁLISE QUALITATIVA */}
        {/* ================================== */}
        {activeTab === "qualitative" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-[#EF4444] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-[#EF4444] uppercase tracking-[0.2em]">
                    Dominância
                  </span>
                  <span className="material-symbols-outlined text-[#EF4444] text-sm">
                    bolt
                  </span>
                </div>
                <h4 className="text-[#064384] font-extrabold text-lg">
                  Assertividade
                </h4>
                <p className="text-slate-500 text-[11px] mt-1 leading-tight">
                  Foco em resultados e rapidez na execução.
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-[#EAB308] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-[#EAB308] uppercase tracking-[0.2em]">
                    Influência
                  </span>
                  <span className="material-symbols-outlined text-[#EAB308] text-sm">
                    chat_bubble
                  </span>
                </div>
                <h4 className="text-[#064384] font-extrabold text-lg">
                  Persuasão
                </h4>
                <p className="text-slate-500 text-[11px] mt-1 leading-tight">
                  Habilidade em envolver e convencer pessoas.
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-[#22C55E] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-[#22C55E] uppercase tracking-[0.2em]">
                    Estabilidade
                  </span>
                  <span className="material-symbols-outlined text-[#22C55E] text-sm">
                    favorite
                  </span>
                </div>
                <h4 className="text-[#064384] font-extrabold text-lg">
                  Lealdade
                </h4>
                <p className="text-slate-500 text-[11px] mt-1 leading-tight">
                  Consistência e apoio aos processos de equipe.
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-[#3B82F6] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-[#3B82F6] uppercase tracking-[0.2em]">
                    Conformidade
                  </span>
                  <span className="material-symbols-outlined text-[#3B82F6] text-sm">
                    fact_check
                  </span>
                </div>
                <h4 className="text-[#064384] font-extrabold text-lg">
                  Precisão
                </h4>
                <p className="text-slate-500 text-[11px] mt-1 leading-tight">
                  Atenção minuciosa aos padrões e detalhes.
                </p>
              </div>
            </div>

            {/* TABELA DE PONTOS */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[#064384] font-extrabold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8323]">
                    analytics
                  </span>
                  Pontos Fortes vs. Pontos a Desenvolver
                </h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-4 w-1/3">Atributo</th>
                    <th className="px-8 py-4 w-1/2">Descrição</th>
                    <th className="px-8 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-8 py-5 text-sm font-bold text-[#064384]">
                      Orientação para Resultados
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600">
                      Capacidade superior de focar em metas e entregar
                      resultados acima do esperado em prazos curtos.
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="material-symbols-outlined text-[#22C55E]">
                        check_circle
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-8 py-5 text-sm font-bold text-[#064384]">
                      Escuta Ativa
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600">
                      Necessidade de desenvolver maior paciência para ouvir
                      feedbacks sem interromper.
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="material-symbols-outlined text-[#EAB308]">
                        warning
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ALERTA */}
            <div className="bg-[#FEF2F2] border border-red-100 rounded-xl p-8 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 text-red-500/5 pointer-events-none">
                <span className="material-symbols-outlined text-[160px]">
                  error_outline
                </span>
              </div>
              <div className="relative z-10 max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <span className="material-symbols-outlined font-bold">
                      release_alert
                    </span>
                  </div>
                  <h4 className="text-red-800 text-xl font-black uppercase tracking-tight">
                    Comportamento Sob Pressão
                  </h4>
                </div>
                <p className="text-red-900/90 text-sm leading-relaxed font-medium">
                  Sob condições de estresse elevado,{" "}
                  {colab.nm_completo.split(" ")[0]} tende a intensificar sua
                  Dominância. Isso pode resultar em comunicação ríspida e falta
                  de atenção aos detalhes do processo. Recomenda-se
                  monitoramento da carga de trabalho.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================== */}
        {/* ABA 3: MATRIZ DE COMPETÊNCIAS */}
        {/* ================================== */}
        {activeTab === "competencies" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#064384]">
                  Matriz de Competências
                </h2>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-6 bg-[#064384] rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Candidato
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-red-500 rounded-sm"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Cargo
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Dominância",
                  color: "#EF4444",
                  key: "D",
                  subtitle: "Foco em Resultados",
                },
                {
                  title: "Influência",
                  color: "#EAB308",
                  key: "I",
                  subtitle: "Foco em Pessoas",
                },
                {
                  title: "Estabilidade",
                  color: "#22C55E",
                  key: "S",
                  subtitle: "Foco em Processos",
                },
                {
                  title: "Conformidade",
                  color: "#3B82F6",
                  key: "C",
                  subtitle: "Foco em Qualidade",
                },
              ].map((perfil) => (
                <div
                  key={perfil.key}
                  className="bg-white rounded-xl border-x border-b border-slate-200 shadow-sm overflow-hidden"
                  style={{ borderTop: `4px solid ${perfil.color}` }}
                >
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h3
                      className="font-black flex items-center gap-2 text-[13px] uppercase tracking-widest"
                      style={{ color: perfil.color }}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: perfil.color }}
                      ></span>{" "}
                      {perfil.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {perfil.subtitle}
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Renderiza as competências baseadas no JSON */}
                    {disc.competencias
                      ?.filter((c) => c.letra === perfil.key)
                      .map((comp) => (
                        <div key={comp.label} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-[#064384]">
                              {comp.label}
                            </span>
                            <span className="text-[10px] font-black text-slate-400">
                              {comp.valor}%
                            </span>
                          </div>
                          <div className="relative h-2 bg-slate-100 rounded-full w-full">
                            <div
                              className="absolute h-full bg-[#064384] rounded-full transition-all duration-1000"
                              style={{ width: `${comp.valor}%` }}
                            ></div>
                            <div
                              className="absolute h-[18px] w-[3px] bg-red-500 rounded-sm z-10 transition-all duration-1000"
                              style={{ left: `${comp.alvo}%`, top: "-5px" }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================== */}
        {/* ABA 4: PLANO DE ADAPTAÇÃO */}
        {/* ================================== */}
        {activeTab === "pdi" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-[#FF8323] rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#064384] tracking-tight">
                    Quadro de Adaptações
                  </h2>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#064384] text-white">
                      <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest w-1/4">
                        Ação Necessária
                      </th>
                      <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest">
                        Comportamento Específico
                      </th>
                      <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-center w-40">
                        Direção
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="material-symbols-outlined text-[#FF8323] text-xl">
                            groups
                          </span>
                          <span className="font-bold text-[#064384]">
                            Gestão de Equipe
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top">
                        <p className="text-slate-600 leading-relaxed text-sm font-medium">
                          O candidato deve buscar uma escuta mais ativa e
                          aumentar feedbacks estruturados 1:1.
                        </p>
                      </td>
                      <td className="px-8 py-6 align-top text-center">
                        <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-4 py-2 rounded-full font-black text-[10px] uppercase border border-green-200 shadow-sm">
                          <span className="material-symbols-outlined text-sm font-black">
                            arrow_upward
                          </span>{" "}
                          Aumentar
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="material-symbols-outlined text-[#FF8323] text-xl">
                            speed
                          </span>
                          <span className="font-bold text-[#064384]">
                            Tomada de Decisão
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top">
                        <p className="text-slate-600 leading-relaxed text-sm font-medium">
                          Necessidade de mitigar a impulsividade em momentos
                          críticos.
                        </p>
                      </td>
                      <td className="px-8 py-6 align-top text-center">
                        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-4 py-2 rounded-full font-black text-[10px] uppercase border border-red-200 shadow-sm">
                          <span className="material-symbols-outlined text-sm font-black">
                            arrow_downward
                          </span>{" "}
                          Reduzir
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-[#064384] px-8 py-4 flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FF8323]">
                      edit_note
                    </span>{" "}
                    Recomendações do Consultor
                  </h3>
                </div>
                <div className="p-8">
                  <textarea
                    value={colab.ds_observacoes || ""}
                    onChange={(e) =>
                      setColab({ ...colab, ds_observacoes: e.target.value })
                    }
                    className="w-full min-h-[160px] p-6 text-slate-700 text-sm font-medium leading-relaxed border border-slate-200 rounded-lg bg-slate-50/50 focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF8323] outline-none resize-none"
                    placeholder="Anote o plano de desenvolvimento baseado no resultado deste candidato..."
                  />
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={async () => {
                        const { error } = await supabase
                          .from("FUNCIONARIOS")
                          .update({ ds_observacoes: colab.ds_observacoes })
                          .eq("cd_funcionario", colab.cd_funcionario);
                        if (!error) alert("Anotações salvas com sucesso!");
                      }}
                      className="bg-[#FF8323] hover:bg-[#e5761f] text-white px-8 py-2.5 rounded-lg text-sm font-extrabold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                      Salvar PDI{" "}
                      <span className="material-symbols-outlined text-lg">
                        check
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
