"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// --- DADOS DA METODOLOGIA ---
const BLOCOS_QUANTITATIVOS = [
  {
    id: "B1",
    titulo: "Estrutura Organizacional e Cargos",
    consultoriaSugerida: "Descrição e Análise de Cargos",
    perguntas: [
      "A empresa possui descrição formal de todos os cargos?",
      "As responsabilidades estão claramente definidas por função?",
      "Existe organograma atualizado?",
      "As competências técnicas e comportamentais estão definidas por cargo?",
      "Há critérios objetivos para promoção ou mudança de função?",
      "Existe sobreposição de funções entre colaboradores?",
      "Os cargos estão alinhados à estratégia da empresa?",
    ],
  },
  {
    id: "B2",
    titulo: "Atração e Seleção",
    consultoriaSugerida: "Atração e Seleção de Talentos",
    perguntas: [
      "Existe processo estruturado de recrutamento?",
      "Há modelo padrão de anúncio de vaga?",
      "Existe roteiro estruturado de entrevista?",
      "São avaliadas competências técnicas e comportamentais?",
      "Existe planilha comparativa de candidatos?",
      "Há processo formal de onboarding?",
      "A empresa mede rotatividade (turnover)?",
    ],
  },
  {
    id: "B3",
    titulo: "Gestão de Desempenho",
    consultoriaSugerida: "Gestão de Desempenho",
    perguntas: [
      "Existem metas claras por cargo?",
      "Os colaboradores sabem o que é esperado deles?",
      "Existe avaliação formal de desempenho?",
      "A empresa realiza feedback estruturado?",
      "Há plano de desenvolvimento individual (PDI)?",
      "Existe reconhecimento por desempenho?",
      "A avaliação influencia decisões salariais?",
    ],
  },
  {
    id: "B4",
    titulo: "Treinamento e Desenvolvimento",
    consultoriaSugerida: "Programas de T&D",
    perguntas: [
      "Existe levantamento de necessidades de treinamento (LNT)?",
      "Os treinamentos são planejados ou apenas reativos?",
      "Existe trilha de desenvolvimento por cargo?",
      "A empresa avalia eficácia dos treinamentos?",
      "Há registro das capacitações realizadas?",
      "Os líderes desenvolvem suas equipes de forma estruturada?",
    ],
  },
  {
    id: "B5",
    titulo: "Plano de Cargos e Salários",
    consultoriaSugerida: "Plano de Cargos e Salários",
    perguntas: [
      "Existe política salarial formalizada?",
      "Há critérios claros para aumento salarial?",
      "A empresa possui faixas salariais estruturadas?",
      "Já foi realizada pesquisa salarial de mercado?",
      "Existem distorções salariais internas?",
      "A política está alinhada à legislação?",
    ],
  },
  {
    id: "B6",
    titulo: "Clima Organizacional",
    consultoriaSugerida: "Pesquisa de Clima Organizacional",
    perguntas: [
      "A empresa já realizou pesquisa de clima?",
      "Existem canais formais de escuta?",
      "Os colaboradores sentem-se reconhecidos?",
      "Existe transparência na comunicação interna?",
      "Há conflitos frequentes?",
      "Os líderes são bem avaliados pela equipe?",
      "Existe plano de ação pós-clima?",
    ],
  },
  {
    id: "B7",
    titulo: "Gestão de Pessoas 360º",
    consultoriaSugerida: "Gestão de Pessoas 360°",
    perguntas: [
      "Os processos de RH são integrados entre si?",
      "Existe planejamento anual de gestão de pessoas?",
      "Há indicadores de RH acompanhados mensalmente?",
      "A liderança é preparada para gerir pessoas?",
      "Existe cultura de feedback contínuo?",
      "A empresa tem estratégia para retenção de talentos?",
      "O RH contribui para decisões estratégicas?",
    ],
  },
];

const BLOCO_QUALITATIVO = {
  id: "B8",
  titulo: "Diagnóstico Estratégico do Empresário",
  perguntas: [
    "Qual sua maior dor hoje em relação à equipe?",
    "Onde você sente maior desgaste na gestão?",
    "Se pudesse resolver um único problema agora, qual seria?",
    "Você sente que sua equipe está no nível ideal?",
    "Você sente que paga corretamente sua equipe?",
    "Sua empresa está preparada para crescer com a equipe atual?",
  ],
};

const ESCALA = [
  { valor: 1, label: "Não existe" },
  { valor: 2, label: "Informal" },
  { valor: 3, label: "Parcial" },
  { valor: 4, label: "Estruturado" },
  { valor: 5, label: "Aplicado" },
];

export default function DiagnosticoInicialPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [empresaNome, setEmpresaNome] = useState("");
  const [registroExiste, setRegistroExiste] = useState(false);

  const [respostasQuant, setRespostasQuant] = useState<Record<string, number>>(
    {},
  );
  const [respostasQuali, setRespostasQuali] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const projetoId = params.id as string;

        const { data: projData } = await supabase
          .from("PROJETOS")
          .select("EMPRESAS ( nm_fantasia )")
          .eq("cd_projeto", projetoId)
          .single();
        if (projData) {
          const empresa = Array.isArray(projData.EMPRESAS)
            ? projData.EMPRESAS[0]
            : projData.EMPRESAS;
          setEmpresaNome(empresa?.nm_fantasia || "Empresa");
        }

        // Busca dados na tabela INDICADORES_RH
        const { data: indData } = await supabase
          .from("INDICADORES_RH")
          .select("*")
          .eq("cd_projeto", projetoId)
          .maybeSingle();

        console.log(projetoId);

        if (indData) {
          setRegistroExiste(true);
          if (indData.js_diagnostico) {
            let diag = indData.js_diagnostico;
            if (typeof diag === "string") diag = JSON.parse(diag);

            // Preenche os estados com o que veio do banco
            setRespostasQuant(diag.quantitativas || {});
            setRespostasQuali(diag.qualitativas || {});
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) carregarDados();
  }, [params.id]);

  const calcularResultados = () => {
    const pilarScores: Record<string, number> = {};
    let somaGeral = 0;
    let totalRespondidas = 0;

    BLOCOS_QUANTITATIVOS.forEach((bloco) => {
      let somaBloco = 0;
      let qtdBloco = 0;
      bloco.perguntas.forEach((_, qIndex) => {
        const key = `${bloco.id}_${qIndex}`;
        if (respostasQuant[key]) {
          const percentual = (respostasQuant[key] - 1) * 25;
          somaBloco += percentual;
          somaGeral += percentual;
          qtdBloco++;
          totalRespondidas++;
        }
      });
      pilarScores[bloco.id] =
        qtdBloco > 0 ? Math.round(somaBloco / qtdBloco) : 0;
    });

    const indiceGeral =
      totalRespondidas > 0 ? Math.round(somaGeral / totalRespondidas) : 0;
    const riscoTrabalhista =
      100 -
      Math.round(((pilarScores["B1"] || 0) + (pilarScores["B5"] || 0)) / 2);
    const riscoTurnover =
      100 -
      Math.round(
        ((pilarScores["B2"] || 0) +
          (pilarScores["B4"] || 0) +
          (pilarScores["B6"] || 0)) /
          3,
      );
    const ranking = BLOCOS_QUANTITATIVOS.map((b) => ({
      id: b.id,
      titulo: b.titulo,
      consultoria: b.consultoriaSugerida,
      score: pilarScores[b.id] || 0,
    })).sort((a, b) => a.score - b.score);

    let categoria = {
      label: "Gestão Informal e Reativa",
      color: "text-red-600 bg-red-50",
      icon: "warning",
    };
    if (indiceGeral > 25)
      categoria = {
        label: "Gestão em Estruturação",
        color: "text-orange-600 bg-orange-50",
        icon: "construction",
      };
    if (indiceGeral > 50)
      categoria = {
        label: "Gestão Estruturada",
        color: "text-yellow-600 bg-yellow-50",
        icon: "domain_verification",
      };
    if (indiceGeral > 75)
      categoria = {
        label: "Gestão Estratégica",
        color: "text-green-600 bg-green-50",
        icon: "diamond",
      };

    return {
      indiceGeral,
      pilarScores,
      riscoTrabalhista,
      riscoTurnover,
      ranking,
      categoria,
    };
  };

  const resultados = calcularResultados();

  const handleSave = async () => {
    setSaving(true);
    const payloadDb = {
      cd_projeto: params.id,
      nr_maturidade_rh: resultados.indiceGeral,
      nr_risco_trabalhista: resultados.riscoTrabalhista,
      js_diagnostico: {
        quantitativas: respostasQuant,
        qualitativas: respostasQuali,
        resultados_calculados: resultados,
      },
    };
    try {
      if (registroExiste)
        await supabase
          .from("INDICADORES_RH")
          .update(payloadDb)
          .eq("cd_projeto", params.id);
      else {
        await supabase.from("INDICADORES_RH").insert([payloadDb]);
        setRegistroExiste(true);
      }
      alert("Diagnóstico Estratégico salvo com sucesso!");
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    const rankingHtml = resultados.ranking
      .map(
        (item) => `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
        <span style="font-size: 14px;">${item.titulo}</span>
        <span style="font-weight: bold; color: ${item.score < 50 ? "#dc2626" : "#16a34a"};">${item.score}%</span>
      </div>`,
      )
      .join("");

    const qualitativoHtml = BLOCO_QUALITATIVO.perguntas
      .map(
        (p, i) => `
      <div style="margin-bottom: 15px; page-break-inside: avoid;">
        <p style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">${p}</p>
        <p style="font-size: 14px; color: #1e293b; background: #f8fafc; padding: 10px; border-radius: 8px; border-left: 4px solid #064384;">
          ${respostasQuali[`Q_${i}`] || "Não informado."}
        </p>
      </div>`,
      )
      .join("");

    janela.document.write(`
      <html>
        <head>
          <title>Diagnóstico RH - ${empresaNome}</title>
          <style>
            body { font-family: sans-serif; color: #334155; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 4px solid #064384; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 24px; font-weight: 900; color: #064384; margin: 0; text-transform: uppercase; }
            .grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { background: #f1f5f9; padding: 20px; border-radius: 12px; text-align: center; }
            .card-val { font-size: 28px; font-weight: 900; color: #064384; display: block; }
            .card-lab { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; }
            .status-banner { background: #064384; color: white; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .section-title { font-size: 16px; font-weight: bold; color: #064384; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 30px 0 15px 0; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1 class="title">Relatório de Diagnóstico RH</h1><span>Maturidade de Gestão 360º</span></div>
            <div style="text-align: right;"><strong>${empresaNome}</strong><br><small>${new Date().toLocaleDateString("pt-BR")}</small></div>
          </div>
          <div class="grid">
            <div class="card"><span class="card-lab">Maturidade Geral</span><span class="card-val">${resultados.indiceGeral}%</span></div>
            <div class="card" style="background:#fef2f2"><span class="card-lab" style="color:#ef4444">Risco Trabalhista</span><span class="card-val" style="color:#dc2626">${resultados.riscoTrabalhista}%</span></div>
            <div class="card" style="background:#fff7ed"><span class="card-lab" style="color:#f97316">Risco Turnover</span><span class="card-val" style="color:#ea580c">${resultados.riscoTurnover}%</span></div>
          </div>
          <div class="status-banner">
            <div><small>Cenário Atual:</small><br><strong>${resultados.categoria.label}</strong></div>
            <div style="text-align: right;"><small>Prioridade Estratégica:</small><br><strong>${resultados.ranking[0].consultoria}</strong></div>
          </div>
          <h2 class="section-title">Desempenho por Pilar</h2>
          ${rankingHtml}
          <h2 class="section-title">Análise Qualitativa</h2>
          ${qualitativoHtml}
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>`);
    janela.document.close();
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <span className="animate-spin text-[#064384] material-symbols-outlined text-4xl">
          progress_activity
        </span>
      </div>
    );

  return (
    <div className="bg-[#F1F5F9] min-h-screen font-sans flex flex-col pb-20">
      <header className="bg-white/95 backdrop-blur-sm px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 shadow-sm sticky top-0 z-10 w-full">
        <div>
          <h2 className="text-2xl font-black text-primary tracking-tight">
            Diagnóstico 360°
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Análise de Maturidade em Gestão de Pessoas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF8323] hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 disabled:opacity-50 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "sync" : "save"}
            </span>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto w-full px-6 py-8 space-y-6">
        {/* DASHBOARD EM TEMPO REAL */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-4 flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF8323]">
                monitoring
              </span>{" "}
              Resultados em Tempo Real
            </h2>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest ${resultados.categoria.color}`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {resultados.categoria.icon}
              </span>
              {resultados.categoria.label}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Maturidade Geral
            </span>
            <span className="text-4xl font-black text-[#064384]">
              {resultados.indiceGeral}%
            </span>
          </div>
          <div className="flex flex-col gap-1 border-l border-slate-100 pl-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Risco Trabalhista
            </span>
            <span
              className={`text-2xl font-black ${resultados.riscoTrabalhista > 50 ? "text-red-500" : "text-slate-700"}`}
            >
              {resultados.riscoTrabalhista}%
            </span>
          </div>
          <div className="flex flex-col gap-1 border-l border-slate-100 pl-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Risco Turnover
            </span>
            <span
              className={`text-2xl font-black ${resultados.riscoTurnover > 50 ? "text-red-500" : "text-slate-700"}`}
            >
              {resultados.riscoTurnover}%
            </span>
          </div>
          <div className="flex flex-col gap-1 border-l border-slate-100 pl-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Prioridade
            </span>
            <span className="text-sm font-bold text-[#FF8323] leading-tight mt-1">
              {resultados.ranking[0].consultoria}
            </span>
          </div>
        </section>

        {/* PERGUNTAS QUANTITATIVAS */}
        <div className="space-y-8">
          {BLOCOS_QUANTITATIVOS.map((bloco) => (
            <section
              key={bloco.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                  {bloco.id} - {bloco.titulo}
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                  Score: {resultados.pilarScores[bloco.id] || 0}%
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {bloco.perguntas.map((pergunta, qIndex) => {
                  const key = `${bloco.id}_${qIndex}`;
                  const val = respostasQuant[key];
                  return (
                    <div
                      key={key}
                      className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-700 max-w-[500px] leading-relaxed">
                        {pergunta}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ESCALA.map((item) => (
                          <button
                            key={item.valor}
                            onClick={() =>
                              setRespostasQuant({
                                ...respostasQuant,
                                [key]: item.valor,
                              })
                            }
                            className={`size-10 rounded-lg text-sm font-black transition-all flex items-center justify-center border-2 
                              ${val === item.valor ? "bg-[#064384] border-[#064384] text-white shadow-md scale-110" : "bg-white border-slate-200 text-slate-400 hover:border-[#064384]/50 hover:text-[#064384]"}`}
                          >
                            {item.valor}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* ENTREVISTA QUALITATIVA */}
        <section className="bg-[#064384] rounded-2xl shadow-xl border border-blue-900 overflow-hidden mt-12">
          <div className="bg-blue-900/50 px-6 py-4 border-b border-white/10 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#FF8323]">
              record_voice_over
            </span>
            <h3 className="font-black text-white text-sm uppercase tracking-widest">
              {BLOCO_QUALITATIVO.id} - {BLOCO_QUALITATIVO.titulo}
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {BLOCO_QUALITATIVO.perguntas.map((pergunta, qIndex) => (
              <div key={qIndex} className="space-y-2">
                <label className="text-xs font-bold text-blue-200">
                  {pergunta}
                </label>
                <textarea
                  rows={3}
                  value={respostasQuali[`Q_${qIndex}`] || ""}
                  onChange={(e) =>
                    setRespostasQuali({
                      ...respostasQuali,
                      [`Q_${qIndex}`]: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-blue-300/50 rounded-xl focus:ring-2 focus:ring-[#FF8323] outline-none transition-all text-sm resize-none"
                ></textarea>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
