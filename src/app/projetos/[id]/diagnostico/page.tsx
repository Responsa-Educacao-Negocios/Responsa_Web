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

  // Estados de Respostas
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

        // 1. Busca nome da empresa para o cabeçalho
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

        // 2. Busca o diagnóstico existente
        const { data: indData } = await supabase
          .from("INDICADORES_RH")
          .select("*")
          .eq("cd_projeto", projetoId)
          .maybeSingle();

        // SE O REGISTRO EXISTE NO BANCO, TEMOS QUE MARCAR PARA FAZER 'UPDATE' (E não Insert)
        if (indData) {
          setRegistroExiste(true);

          // Se já tem o JSON salvo, nós preenchemos a tela!
          if (indData.js_diagnostico) {
            // Garante que será lido corretamente (mesmo se o Supabase mandar como string)
            let diag = indData.js_diagnostico;
            if (typeof diag === "string") {
              try {
                diag = JSON.parse(diag);
              } catch (e) {
                console.error("Erro ao ler JSON");
              }
            }

            setRespostasQuant(diag.quantitativas || {});
            setRespostasQuali(diag.qualitativas || {});
          }
        }
      } catch (error) {
        console.error("Erro ao carregar diagnóstico:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) carregarDados();
  }, [params.id]);

  // --- MOTOR DE CÁLCULO DA METODOLOGIA ---
  const calcularResultados = () => {
    const pilarScores: Record<string, number> = {};
    let somaGeral = 0;
    let totalRespondidas = 0;

    // Calcula a pontuação de cada pilar (0 a 100%)
    // Fórmula: (Valor - 1) * 25. Ex: Nota 1 = 0%, Nota 3 = 50%, Nota 5 = 100%
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

    // Riscos Específicos (Fórmula Inversa da Maturidade das áreas correspondentes)
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
    const riscoClima = 100 - (pilarScores["B6"] || 0);

    // Ranking de Prioridade (Do Pior para o Melhor)
    const ranking = BLOCOS_QUANTITATIVOS.map((b) => ({
      id: b.id,
      titulo: b.titulo,
      consultoria: b.consultoriaSugerida,
      score: pilarScores[b.id] || 0,
    })).sort((a, b) => a.score - b.score);

    const consultoriaSugerida =
      ranking.length > 0 && totalRespondidas > 10
        ? ranking[0].consultoria
        : "Aguardando Respostas";

    // Categoria Geral
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
      riscoClima,
      ranking,
      consultoriaSugerida,
      categoria,
    };
  };

  const resultados = calcularResultados();

  // --- SALVAMENTO ---
  const handleSave = async () => {
    setSaving(true);
    const projetoId = params.id as string;

    const payloadJSON = {
      quantitativas: respostasQuant,
      qualitativas: respostasQuali,
      resultados_calculados: resultados,
    };

    const payloadDb = {
      cd_projeto: projetoId,
      nr_maturidade_rh: resultados.indiceGeral,
      nr_risco_trabalhista: resultados.riscoTrabalhista,
      js_diagnostico: payloadJSON,
    };

    try {
      if (registroExiste) {
        await supabase
          .from("INDICADORES_RH")
          .update(payloadDb)
          .eq("cd_projeto", projetoId);
      } else {
        await supabase.from("INDICADORES_RH").insert([payloadDb]);
        setRegistroExiste(true);
      }
      alert("Diagnóstico Estratégico salvo com sucesso!");
      router.back();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Ocorreu um erro ao salvar o diagnóstico.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4 text-[#064384]">
          <span className="material-symbols-outlined animate-spin text-4xl">
            progress_activity
          </span>
          <span className="font-bold">Carregando metodologia...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F1F5F9] min-h-screen font-sans flex flex-col pb-20">
      <header className="bg-white/95 backdrop-blur-sm pt-8 pb-6 px-8 flex justify-between items-end border-b border-slate-200 shadow-sm sticky top-0 z-10 shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold text-primary tracking-tight">
            Diagnostico 360°
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Diagnóstico estratégico para identificar pontos de melhoria e
            oportunidades de crescimento na gestão de pessoas da sua empresa.
          </p>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto w-full px-6 py-8 space-y-6">
        {/* DASHBOARD DE RESULTADOS (Tempo Real) */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-4 flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF8323]">
                monitoring
              </span>
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
              Índice Geral (Maturidade)
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
              Risco de Turnover
            </span>
            <span
              className={`text-2xl font-black ${resultados.riscoTurnover > 50 ? "text-red-500" : "text-slate-700"}`}
            >
              {resultados.riscoTurnover}%
            </span>
          </div>
          <div className="flex flex-col gap-1 border-l border-slate-100 pl-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Ação Prioritária (Sugerida)
            </span>
            <span className="text-sm font-bold text-[#FF8323] leading-tight mt-1">
              {resultados.consultoriaSugerida}
            </span>
          </div>
        </section>

        {/* FORMULÁRIO QUANTITATIVO */}
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
                            title={item.label}
                            className={`size-10 rounded-lg text-sm font-black transition-all flex items-center justify-center border-2
                              ${
                                val === item.valor
                                  ? "bg-[#064384] border-[#064384] text-white shadow-md scale-110"
                                  : "bg-white border-slate-200 text-slate-400 hover:border-[#064384]/50 hover:text-[#064384]"
                              }
                            `}
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

        {/* FORMULÁRIO QUALITATIVO (BLOCO 8) */}
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
            {BLOCO_QUALITATIVO.perguntas.map((pergunta, qIndex) => {
              const key = `Q_${qIndex}`;
              return (
                <div key={key} className="space-y-2">
                  <label className="text-xs font-bold text-blue-200">
                    {pergunta}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Anotações da entrevista..."
                    value={respostasQuali[key] || ""}
                    onChange={(e) =>
                      setRespostasQuali({
                        ...respostasQuali,
                        [key]: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-blue-300/50 rounded-xl focus:ring-2 focus:ring-[#FF8323] outline-none transition-all text-sm resize-none"
                  ></textarea>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
