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
        <span className="material-symbols-outlined animate-spin text-4xl text-[#064384]">
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
          className="text-[#064384] underline font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Relatório DISC - ${colab.nm_completo}`,
          text: `Confira o mapeamento de perfil de ${colab.nm_completo}`,
          url: url,
        });
      } catch (error) {
        console.log("Compartilhamento cancelado", error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link do relatório copiado para a área de transferência!");
    }
  };

  // --- FUNÇÃO DE IMPRESSÃO (NOVO FORMATO PDF PROFISSIONAL) ---
  const handlePrint = () => {
    const janela = window.open("", "", "width=1100,height=900");
    if (!janela) return;

    const disc = colab.js_pontuacao_disc;
    const dataAvaliacao = new Date(colab.dt_admissao).toLocaleDateString(
      "pt-BR",
    );

    // Monta o HTML das competências com o gráfico de "Atual" vs "Exigência"
    const competenciasHtml =
      disc.competencias
        ?.map(
          (c) => `
      <div style="margin-bottom: 35px; page-break-inside: avoid;">
        <h3 style="font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 5px;">${c.label}</h3>
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 8px;">
          <span style="color: #064384;">Atual: ${c.valor}%</span>
          <span style="color: #EF4444;">Exigência do Meio: ${c.alvo}%</span>
        </div>
        <div style="position: relative; height: 24px; background: #f1f5f9; border-radius: 4px; width: 100%;">
          <div style="position: absolute; left: 0; top: 0; height: 100%; background: #fee2e2; border-left: 4px solid #EF4444; width: ${c.alvo}%; border-radius: 4px 0 0 4px;"></div>
          <div style="position: absolute; left: 0; top: 6px; height: 12px; background: #064384; width: ${c.valor}%; border-radius: 4px;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-top: 5px; font-weight: bold;">
          <span>0%</span><span>10%</span><span>20%</span><span>30%</span><span>40%</span><span>50%</span><span>60%</span><span>70%</span><span>80%</span><span>90%</span><span>100%</span>
        </div>
      </div>
    `,
        )
        .join("") || "";

    janela.document.write(`
      <html>
        <head>
          <title>Relatório DISC - ${colab.nm_completo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; color: #334155; line-height: 1.5; margin: 0; padding: 0; }
            @media print {
              @page { margin: 15mm; size: A4; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break { page-break-before: always; }
            }
            .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center; background: #fff; }
            .cover-header { position: absolute; top: 40px; left: 40px; font-size: 12px; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
            .content-page { padding: 40px; }
            .title-small { font-size: 16px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
            .title-large { font-size: 70px; font-weight: 900; color: #064384; margin: 0; letter-spacing: -2px; }
            .name-title { font-size: 24px; font-weight: 800; color: #1e293b; margin-top: 50px; }
            
            .section-title { font-size: 22px; font-weight: 900; color: #064384; border-bottom: 3px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 30px; text-transform: uppercase; }
            
            .disc-bar-container { margin-bottom: 25px; }
            .disc-bar-header { display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; margin-bottom: 5px; }
            .disc-bar-bg { background: #f1f5f9; height: 24px; border-radius: 12px; width: 100%; position: relative; overflow: hidden; }
            .disc-bar-target { position: absolute; height: 100%; border-left: 3px solid #EF4444; background: #fee2e2; z-index: 1; }
            .disc-bar-fill { height: 10px; position: absolute; left: 0; top: 7px; border-radius: 5px; z-index: 2; background: #064384; }
            
            .box-insight { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-top: 30px; }
            .label-insight { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; display: block; }
          </style>
        </head>
        <body>
          <div class="cover">
            <div class="cover-header">Relatório DISC: ${colab.nm_completo}</div>
            <div class="title-small">Relatório de Perfil Comportamental</div>
            <div class="title-large">DISC</div>
            <div class="name-title">Nome: ${colab.nm_completo}</div>
            <div style="margin-top: auto; padding-bottom: 40px; color: #64748b; font-weight: bold;">
              DATA DA AVALIAÇÃO: ${dataAvaliacao}
            </div>
          </div>

          <div class="page-break content-page">
            <h2 class="section-title">Objetivo e Perfil</h2>
            
            <div style="background: #f8fafc; padding: 25px; border-left: 6px solid #064384; border-radius: 8px; margin-bottom: 40px;">
              <p style="font-size: 14px; margin: 0; color: #64748b; font-weight: 600;">Perfil Predominante:</p>
              <p style="font-size: 32px; font-weight: 900; color: #064384; margin: 5px 0 0 0;">${colab.sg_perfil_disc}</p>
              <p style="font-size: 13px; font-weight: 700; color: #475569; margin-top: 10px;">Aderência ao Cargo: ${disc.aderencia}%</p>
            </div>

            <h2 class="section-title">Análise de Tendências (D-I-S-C)</h2>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 30px;">
              As barras <span style="color:#064384; font-weight:bold;">azuis</span> representam o score atual. 
              As áreas <span style="color:#EF4444; font-weight:bold;">vermelhas</span> indicam a exigência ideal para a função.
            </p>
            
            <div class="disc-bar-container">
              <div class="disc-bar-header"><span>DOMINÂNCIA (D)</span><span>${disc.D}% / ${dynamicTargets.D}%</span></div>
              <div class="disc-bar-bg">
                <div class="disc-bar-target" style="width: ${dynamicTargets.D}%;"></div>
                <div class="disc-bar-fill" style="width: ${disc.D}%;"></div>
              </div>
            </div>
            <div class="disc-bar-container">
              <div class="disc-bar-header"><span>INFLUÊNCIA (I)</span><span>${disc.I}% / ${dynamicTargets.I}%</span></div>
              <div class="disc-bar-bg">
                <div class="disc-bar-target" style="width: ${dynamicTargets.I}%;"></div>
                <div class="disc-bar-fill" style="width: ${disc.I}%;"></div>
              </div>
            </div>
            <div class="disc-bar-container">
              <div class="disc-bar-header"><span>ESTABILIDADE (S)</span><span>${disc.S}% / ${dynamicTargets.S}%</span></div>
              <div class="disc-bar-bg">
                <div class="disc-bar-target" style="width: ${dynamicTargets.S}%;"></div>
                <div class="disc-bar-fill" style="width: ${disc.S}%;"></div>
              </div>
            </div>
            <div class="disc-bar-container">
              <div class="disc-bar-header"><span>CONFORMIDADE (C)</span><span>${disc.C}% / ${dynamicTargets.C}%</span></div>
              <div class="disc-bar-bg">
                <div class="disc-bar-target" style="width: ${dynamicTargets.C}%;"></div>
                <div class="disc-bar-fill" style="width: ${disc.C}%;"></div>
              </div>
            </div>

            <div class="box-insight" style="border-left: 6px solid #ef4444; background: #fff5f5;">
              <span class="label-insight" style="color: #b91c1c;">⚠️ Comportamento Sob Pressão</span>
              <p style="font-size: 14px; color: #7f1d1d; font-weight: 600; margin: 0;">
                Em situações de estresse elevado, ${colab.nm_completo.split(" ")[0]} ${infoPerfil.pressao}
              </p>
            </div>
          </div>

          <div class="page-break content-page">
            <h2 class="section-title">Análise de Competências</h2>
            ${competenciasHtml}
          </div>

          <div class="page-break content-page">
            <h2 class="section-title">Plano de Desenvolvimento (PDI)</h2>
            <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 400px; color: #334155; font-size: 14px; white-space: pre-wrap;">
${colab.ds_observacoes || "<i>Nenhum plano de desenvolvimento registrado.</i>"}
            </div>
          </div>

          <script>
            window.onload = () => { 
              setTimeout(() => { window.print(); window.close(); }, 800); 
            };
          </script>
        </body>
      </html>
    `);
    janela.document.close();
  };

  const disc = colab.js_pontuacao_disc;

  // --- LÓGICA DE INTERPRETAÇÃO DINÂMICA ---
  const perfilPrincipal = colab.sg_perfil_disc?.[0] || "D";
  const INTERPRETACAO: Record<string, any> = {
    D: {
      pressao: "tende a intensificar sua Dominância. Isso pode resultar em comunicação ríspida, impaciência com processos lentos e foco excessivo em resultados rápidos, às vezes ignorando o impacto nas pessoas.",
      cor: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      icon: "bolt"
    },
    I: {
      pressao: "tende a se tornar excessivamente emocional ou desorganizado. Pode tentar resolver conflitos através da persuasão excessiva ou buscar aprovação constante, perdendo o foco na execução técnica.",
      cor: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: "chat_bubble"
    },
    S: {
      pressao: "tende a se retrair ou apresentar resistência passiva a mudanças bruscas. Pode ter dificuldade em tomar decisões rápidas sob estresse, preferindo manter o status quo para evitar conflitos.",
      cor: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
      icon: "favorite"
    },
    C: {
      pressao: "tende a se tornar excessivamente crítico e perfeccionista. Pode se isolar para analisar dados exaustivamente, gerando lentidão na entrega (paralisia por análise) por medo de cometer erros.",
      cor: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: "fact_check"
    }
  };

  const infoPerfil = INTERPRETACAO[perfilPrincipal] || INTERPRETACAO["D"];

  // Calcula alvos dinâmicos baseados na média das competências se existirem
  const getAlvoMedio = (letra: string) => {
    const comps = disc.competencias?.filter(c => c.letra === letra) || [];
    if (comps.length === 0) return letra === "D" ? 90 : letra === "I" ? 60 : letra === "S" ? 40 : 30; // Fallback
    return Math.round(comps.reduce((acc, curr) => acc + curr.alvo, 0) / comps.length);
  };

  const dynamicTargets = {
    D: getAlvoMedio("D"),
    I: getAlvoMedio("I"),
    S: getAlvoMedio("S"),
    C: getAlvoMedio("C")
  };

  const getIniciais = (nome: string) => nome.substring(0, 2).toUpperCase();
  const donutGradient = `conic-gradient(#EF4444 0% ${disc.D}%, #EAB308 ${disc.D}% ${disc.D + disc.I}%, #22C55E ${disc.D + disc.I}% ${disc.D + disc.I + disc.S}%, #3B82F6 ${disc.D + disc.I + disc.S}% 100%)`;

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col h-screen overflow-hidden">
      {/* HEADER SUPERIOR */}
      <header className="bg-white px-4 sm:px-8 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-[#064384] text-sm font-bold transition-colors pl-12 lg:pl-0"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
          Voltar ao Mapa
        </button>
      </header>

      {/* PERFIL DO CANDIDATO E BOTÕES DE EXPORTAÇÃO */}
      <div className="bg-white px-4 sm:px-8 py-5 sm:py-6 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
        <div className="flex gap-4 sm:gap-5 items-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#064384] font-black text-lg shrink-0">
            {getIniciais(colab.nm_completo)}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate">
                {colab.nm_completo}
              </h1>
              <span className="text-[#064384] text-[9px] font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Candidato
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="material-symbols-outlined text-[14px]">
                  calendar_today
                </span>
                {new Date(colab.dt_admissao).toLocaleDateString("pt-BR")}
              </span>
              <span className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[14px]">
                  work
                </span>
                {colab.CARGOS?.nm_titulo || "Sem Cargo"}
              </span>
            </div>
          </div>
        </div>

        {/* Ações Mobile e Desktop */}
        <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto">
          <button
            className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={handleShare}
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span className="hidden xs:inline">Compartilhar</span>
          </button>
          {/* BOTÃO DE GERAR PDF COM O NOVO LAYOUT */}
          <button
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#FF8323] px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95"
            onClick={handlePrint}
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            <span className="hidden xs:inline">Exportar PDF Oficial</span>
            <span className="xs:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="px-4 sm:px-8 bg-white border-b border-slate-200 flex gap-6 sm:gap-10 shrink-0 overflow-x-auto scrollbar-hide whitespace-nowrap">
        {[
          { id: "overview", label: "Visão Geral", icon: "grid_view" },
          {
            id: "qualitative",
            label: "Análise Qualitativa",
            icon: "psychology",
          },
          {
            id: "competencies",
            label: "Competências",
            icon: "format_list_bulleted",
          },
          { id: "pdi", label: "Plano PDI", icon: "flag" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 text-[12px] sm:text-[13px] font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors outline-none ${
              activeTab === tab.id
                ? "border-[#FF8323] text-[#FF8323]"
                : "border-transparent text-slate-400 hover:text-[#064384]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      <main
        className="flex-1 p-4 sm:p-8 overflow-y-auto scrollbar-hide max-w-[1200px] mx-auto w-full"
        id="area-relatorio"
      >
        {/* ================= ABA 1: VISÃO GERAL ================= */}
        <div
          className={`aba-container ${activeTab === "overview" ? "block" : "hidden"}`}
        >
          <h2 className="text-lg sm:text-xl font-black text-[#064384] titulo-impressao border-b border-slate-100 pb-2 mb-6">
            Visão Geral do Perfil
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-300">
            {/* CARD 1: Perfil Natural */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-[#064384] text-xs sm:text-[13px] uppercase tracking-widest">
                  Perfil Natural (D-I-S-C)
                </h3>
              </div>
              <div className="flex flex-col items-center justify-center py-4 mb-8 relative">
                <div
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-full relative"
                  style={{ background: donutGradient }}
                >
                  <div className="absolute inset-6 sm:inset-8 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="text-3xl sm:text-[40px] font-black text-[#064384] tracking-tight leading-none">
                      {colab.sg_perfil_disc}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase mt-1">
                      Predominante
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 sm:gap-y-8 mt-auto">
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
                        <span className="text-[10px] sm:text-xs text-slate-600 font-bold uppercase tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-black">
                          {item.val}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${item.val}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 2: Perfil vs Cargo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-10">
                <h3 className="font-black text-slate-800 text-xs sm:text-[13px] uppercase tracking-widest">
                  Perfil vs. Exigência
                </h3>
                <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-[#064384]">
                    <div className="h-2 w-2 bg-[#064384] rounded-sm"></div>{" "}
                    Atual
                  </span>
                  <span className="flex items-center gap-1.5 text-[#EF4444]">
                    <div className="h-2 w-2 bg-[#EF4444] rounded-sm"></div>{" "}
                    Cargo
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-6 sm:gap-8 flex-1">
                {[
                  {
                    letter: "D",
                    val: disc.D,
                    target: dynamicTargets.D,
                    color: "text-[#EF4444]",
                  },
                  {
                    letter: "I",
                    val: disc.I,
                    target: dynamicTargets.I,
                    color: "text-[#EAB308]",
                  },
                  {
                    letter: "S",
                    val: disc.S,
                    target: dynamicTargets.S,
                    color: "text-[#22C55E]",
                  },
                  {
                    letter: "C",
                    val: disc.C,
                    target: dynamicTargets.C,
                    color: "text-[#3B82F6]",
                  },
                ].map((item) => (
                  <div
                    key={item.letter}
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    <span
                      className={`w-6 font-black text-xl sm:text-2xl ${item.color}`}
                    >
                      {item.letter}
                    </span>
                    <div className="flex-1 relative h-6 rounded flex items-center">
                      <div
                        className="absolute h-[24px] rounded-r-md bg-red-100 border-l-4 border-[#EF4444] z-0"
                        style={{ width: `${item.target}%`, left: 0 }}
                      ></div>
                      <div
                        className="absolute h-[12px] bg-[#064384] rounded-md z-10 shadow-sm"
                        style={{ width: `${item.val}%`, left: 0 }}
                      ></div>
                    </div>
                    <span className="w-12 text-right text-[10px] sm:text-xs text-slate-500 font-bold">
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
                  <p className="text-3xl font-black text-[#064384] tracking-tight">
                    {disc.aderencia}%
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_up
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                    Compatível
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ABA 2: ANÁLISE QUALITATIVA ================= */}
        <div
          className={`aba-container ${activeTab === "qualitative" ? "block" : "hidden"}`}
        >
          <h2 className="text-lg sm:text-xl font-black text-[#064384] titulo-impressao border-b border-slate-100 pb-2 mb-6">
            Análise Qualitativa
          </h2>
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Dominância",
                  icon: "bolt",
                  attr: "Assertividade",
                  desc: "Foco em resultados e rapidez na execução.",
                  color: "#EF4444",
                },
                {
                  title: "Influência",
                  icon: "chat_bubble",
                  attr: "Persuasão",
                  desc: "Habilidade em envolver e convencer pessoas.",
                  color: "#EAB308",
                },
                {
                  title: "Estabilidade",
                  icon: "favorite",
                  attr: "Lealdade",
                  desc: "Consistência e apoio aos processos de equipe.",
                  color: "#22C55E",
                },
                {
                  title: "Conformidade",
                  icon: "fact_check",
                  attr: "Precisão",
                  desc: "Atenção minuciosa aos padrões e detalhes.",
                  color: "#3B82F6",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: item.color,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{ color: item.color }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <h4 className="text-[#064384] font-black text-lg">
                    {item.attr}
                  </h4>
                  <p className="text-slate-500 text-xs mt-1 leading-tight font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={`${infoPerfil.bg} border ${infoPerfil.border} rounded-2xl p-6 sm:p-8 relative overflow-hidden`}
            >
              <div
                className={`absolute -right-4 -top-4 sm:-right-8 sm:-top-8 ${infoPerfil.cor} opacity-5 pointer-events-none`}
              >
                <span className="material-symbols-outlined text-[100px] sm:text-[160px]">
                  {infoPerfil.icon}
                </span>
              </div>
              <div className="relative z-10 max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`size-10 rounded-xl ${infoPerfil.bg} border ${infoPerfil.border} flex items-center justify-center ${infoPerfil.cor}`}
                  >
                    <span className="material-symbols-outlined font-bold">
                      release_alert
                    </span>
                  </div>
                  <h4
                    className={`${infoPerfil.cor} text-lg sm:text-xl font-black uppercase tracking-tight`}
                  >
                    Sob Pressão
                  </h4>
                </div>
                <p
                  className={`${infoPerfil.cor} brightness-50 text-sm leading-relaxed font-medium`}
                >
                  Sob condições de estresse elevado,{" "}
                  {colab.nm_completo.split(" ")[0]} {infoPerfil.pressao}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ABA 3: MATRIZ DE COMPETÊNCIAS ================= */}
        <div
          className={`aba-container ${activeTab === "competencies" ? "block" : "hidden"}`}
        >
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-black text-[#064384] titulo-impressao border-b border-slate-100 pb-2">
                Matriz de Competências
              </h2>
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex gap-6 shadow-sm w-full sm:w-auto justify-center">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  style={{
                    borderTopWidth: "4px",
                    borderTopColor: perfil.color,
                  }}
                >
                  <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h3
                      className="font-black flex items-center gap-2 text-[11px] sm:text-[13px] uppercase tracking-widest"
                      style={{ color: perfil.color }}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: perfil.color }}
                      ></span>{" "}
                      {perfil.title}
                    </h3>
                  </div>
                  <div className="p-5 sm:p-6 space-y-5">
                    {disc.competencias
                      ?.filter((c) => c.letra === perfil.key)
                      .map((comp) => (
                        <div key={comp.label} className="space-y-1.5">
                          <div className="flex justify-between items-end">
                            <span className="text-[11px] sm:text-xs font-bold text-[#064384] truncate pr-2">
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
                              className="absolute h-[18px] w-[3px] bg-red-500 rounded-sm z-10"
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
        </div>

        {/* ================= ABA 4: PLANO PDI ================= */}
        <div
          className={`aba-container ${activeTab === "pdi" ? "block" : "hidden"}`}
        >
          <div className="space-y-8 animate-in fade-in duration-300">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-[#064384] px-6 py-4">
                <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8323]">
                    edit_note
                  </span>{" "}
                  Recomendações (PDI)
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <textarea
                  value={colab.ds_observacoes || ""}
                  onChange={(e) =>
                    setColab({ ...colab, ds_observacoes: e.target.value })
                  }
                  className="w-full min-h-[160px] p-4 sm:p-6 text-slate-700 text-sm font-medium leading-relaxed border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF8323] outline-none resize-none"
                  placeholder="Anote o plano de desenvolvimento baseado no resultado deste candidato..."
                />
                <div className="mt-4 sm:mt-6 flex justify-end">
                  <button
                    onClick={async () => {
                      const { error } = await supabase
                        .from("FUNCIONARIOS")
                        .update({ ds_observacoes: colab.ds_observacoes })
                        .eq("cd_funcionario", colab.cd_funcionario);
                      if (!error) alert("Anotações salvas com sucesso!");
                    }}
                    className="w-full sm:w-auto bg-[#FF8323] hover:bg-[#e5761f] text-white px-8 py-3 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                  >
                    Gravar PDI
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
