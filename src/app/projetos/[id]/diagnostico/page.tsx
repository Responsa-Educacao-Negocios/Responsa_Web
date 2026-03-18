"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// --- DADOS DA METODOLOGIA ---
const BLOCOS_QUANTITATIVOS = [
  {
    id: "B1",
    titulo: "Estrutura Organizacional",
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
          setEmpresaNome(empresa?.nm_fantasia || "Empresa Não Identificada");
        }

        const { data: indData } = await supabase
          .from("INDICADORES_RH")
          .select("*")
          .eq("cd_projeto", projetoId)
          .maybeSingle();

        if (indData) {
          setRegistroExiste(true);
          if (indData.js_diagnostico) {
            let diag = indData.js_diagnostico;
            if (typeof diag === "string") diag = JSON.parse(diag);

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
    })).sort((a, b) => b.score - a.score); // Ordena do maior para o menor

    let categoria = {
      label: "Gestão Informal e Reativa",
      color: "text-red-600 bg-red-50",
      icon: "warning",
      desc: "Ausência de processos estruturados de RH. Alta dependência do dono. Baixa previsibilidade de resultados. Forte exposição a riscos legais e financeiros.",
    };
    if (indiceGeral > 25)
      categoria = {
        label: "Gestão em Estruturação",
        color: "text-orange-600 bg-orange-50",
        icon: "construction",
        desc: "Processos iniciados, mas ainda fragmentados. Risco moderado.",
      };
    if (indiceGeral > 50)
      categoria = {
        label: "Gestão Estruturada",
        color: "text-yellow-600 bg-yellow-50",
        icon: "domain_verification",
        desc: "Práticas de RH estabelecidas. Foco em otimização.",
      };
    if (indiceGeral > 75)
      categoria = {
        label: "Gestão Estratégica",
        color: "text-green-600 bg-green-50",
        icon: "diamond",
        desc: "RH atua como parceiro estratégico do negócio.",
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

  // --- GERADOR DE RELATÓRIO ROBUSTO ---
  const handlePrint = () => {
    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    // Lógicas de Velocímetro Dinâmicas
    const matLabel =
      resultados.indiceGeral < 25
        ? "🔴 Extremamente baixa"
        : resultados.indiceGeral < 50
          ? "🟠 Baixa"
          : "🟢 Estruturada";
    const rtLabel =
      resultados.riscoTrabalhista > 75
        ? "🔴 Extremamente alto"
        : resultados.riscoTrabalhista > 40
          ? "🟠 Alto"
          : "🟢 Baixo";
    const rtoLabel =
      resultados.riscoTurnover > 75
        ? "🔴 Extremamente alto"
        : resultados.riscoTurnover > 40
          ? "🟠 Alto"
          : "🟢 Baixo";

    // Agrupamento para "Análise Profunda"
    const rankingInvertido = [...resultados.ranking].sort(
      (a, b) => a.score - b.score,
    );
    const criticos = rankingInvertido.filter((r) => r.score <= 10);
    const mtBaixos = rankingInvertido.filter(
      (r) => r.score > 10 && r.score <= 20,
    );
    const baixos = rankingInvertido.filter(
      (r) => r.score > 20 && r.score <= 30,
    );

    const formatGroup = (group: any[], color: string, explanation: string) => {
      if (group.length === 0) return "";
      return `
        <div style="margin-bottom: 15px;">
          <h4 style="color: ${color}; font-weight: 900; font-size: 14px; margin-bottom: 8px;">${color === "#ef4444" ? "🔴 Críticos (0% a 10%)" : color === "#f97316" ? "🟠 Muito baixos (11% a 20%)" : "🟡 Baixos (21% a 30%)"}</h4>
          <ul style="list-style: none; padding: 0; margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #334155;">
            ${group.map((g) => `<li style="margin-bottom: 4px;">• ${g.titulo} (${g.score}%)</li>`).join("")}
          </ul>
          <p style="margin: 0; font-size: 13px; color: #64748b; font-style: italic; border-left: 2px solid ${color}; padding-left: 8px;">👉 ${explanation}</p>
        </div>
      `;
    };

    // Barra Visual do Ranking
    const rankingHtml = resultados.ranking
      .map(
        (item) => `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; margin-bottom: 4px; color: #334155;">
          <span>${item.titulo}</span>
          <span>${item.score}%</span>
        </div>
        <div style="height: 14px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${item.score}%; background: ${item.score <= 20 ? "#ef4444" : item.score <= 50 ? "#f59e0b" : "#22c55e"};"></div>
        </div>
      </div>
    `,
      )
      .join("");

    janela.document.write(`
      <html>
        <head>
          <title>Diagnóstico Gestão de Pessoas - ${empresaNome}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; line-height: 1.6; }
            @media print {
              @page { margin: 15mm; size: A4; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break { page-break-before: always; }
            }
            .section-title { font-size: 18px; font-weight: 900; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 30px 0 20px 0; display: flex; align-items: center; gap: 8px;}
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .box-critical { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .highlight-text { font-size: 15px; font-weight: 800; color: #0f172a; }
            .label-text { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
            .metric-big { font-size: 36px; font-weight: 900; line-height: 1; margin: 10px 0; }
          </style>
        </head>
        <body class="p-8">
          
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase;">📊 DIAGNÓSTICO DE GESTÃO DE PESSOAS</h1>
            <p style="font-size: 16px; font-weight: 800; color: #475569; margin-top: 5px;">Empresa: ${empresaNome}</p>
          </div>

          <h2 class="section-title">📈 1. VISÃO GERAL DOS INDICADORES</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="box">
              <span class="label-text">🔢 Indicadores Principais</span>
              <div style="margin-top: 15px;">
                <p style="margin: 0; font-weight: 800; font-size: 14px;">Maturidade Geral: <span style="color: #064384; font-size: 18px;">${resultados.indiceGeral}%</span></p>
                <p style="margin: 8px 0; font-weight: 800; font-size: 14px;">Risco Trabalhista: <span style="color: #ef4444; font-size: 18px;">${resultados.riscoTrabalhista}%</span></p>
                <p style="margin: 0; font-weight: 800; font-size: 14px;">Risco de Turnover: <span style="color: #ef4444; font-size: 18px;">${resultados.riscoTurnover}%</span></p>
              </div>
            </div>
            
            <div class="box">
              <span class="label-text">📊 Interpretação (Gráfico Mental Velocímetro)</span>
              <div style="margin-top: 15px; font-weight: bold; font-size: 14px; line-height: 1.8;">
                <p style="margin: 0;">Maturidade: ${matLabel}</p>
                <p style="margin: 0;">Risco Trabalhista: ${rtLabel}</p>
                <p style="margin: 0;">Turnover: ${rtoLabel}</p>
              </div>
            </div>
          </div>

          <div class="box-critical" style="border-left: 6px solid #ef4444;">
            <span class="label-text" style="color: #991b1b;">🧠 Análise Estratégica Geral</span>
            <p style="margin: 10px 0 5px 0; font-size: 16px; font-weight: 800; color: #7f1d1d;">A empresa se encontra em um nível de: ${resultados.categoria.label.toUpperCase()}</p>
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #991b1b;">Isso indica: ${resultados.categoria.desc}</p>
          </div>

          <h2 class="section-title">📉 2. ANÁLISE POR PILAR</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div>
              <span class="label-text" style="display: block; margin-bottom: 15px;">📈 Desempenho por Área (Ranking)</span>
              ${rankingHtml}
            </div>
            <div>
              <span class="label-text" style="display: block; margin-bottom: 15px;">🧠 Análise Profunda dos Gaps</span>
              ${formatGroup(criticos, "#ef4444", "A empresa praticamente não tem processos nestas áreas. Risco extremo.")}
              ${formatGroup(mtBaixos, "#f97316", "Contrata e organiza de forma muito improvisada e perigosa.")}
              ${formatGroup(baixos, "#eab308", "Existem sinais de tentativa, mas sem estrutura ou padronização.")}
              ${criticos.length === 0 && mtBaixos.length === 0 ? '<p style="font-weight:bold; color:#16a34a;">Sua empresa não possui pilares em nível crítico extremo.</p>' : ""}
            </div>
          </div>

          <div class="page-break"></div>
          <h2 class="section-title">🧠 3. ANÁLISE QUALITATIVA (VISÃO DO EMPRESÁRIO)</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="box" style="background: #eff6ff; border-color: #bfdbfe;">
              <p class="label-text" style="color: #1e3a8a;">💬 Principais Dores Relatadas</p>
              <div style="margin-top: 15px;">
                <p style="font-size: 13px; font-weight: bold; color: #475569; margin: 0;">🔥 Dor central:</p>
                <p style="font-size: 14px; font-weight: 900; color: #1e3a8a; margin: 2px 0 15px 0;">👉 "${respostasQuali["Q_0"] || "Não relatada"}"</p>
                
                <p style="font-size: 13px; font-weight: bold; color: #475569; margin: 0;">💥 Desgaste principal:</p>
                <p style="font-size: 14px; font-weight: 900; color: #1e3a8a; margin: 2px 0 15px 0;">👉 "${respostasQuali["Q_1"] || "Não relatado"}"</p>
                
                <p style="font-size: 13px; font-weight: bold; color: #475569; margin: 0;">🎯 Problema prioritário:</p>
                <p style="font-size: 14px; font-weight: 900; color: #1e3a8a; margin: 2px 0 0 0;">👉 "${respostasQuali["Q_2"] || "Não definido"}"</p>
              </div>
            </div>

            <div class="box-critical">
              <p class="label-text" style="color: #991b1b;">⚠️ Diagnóstico Oculto (Insight do Consultor)</p>
              <div style="margin-top: 15px; font-size: 14px; font-weight: bold; color: #7f1d1d;">
                <p style="margin: 0 0 5px 0;">O empresário acredita que:</p>
                <p style="font-weight: 900; font-size: 16px; margin: 0 0 15px 0;">👉 "${respostasQuali["Q_4"] || "A remuneração é adequada"}"</p>
                
                <p style="margin: 0 0 5px 0;">Mas ao mesmo tempo a equipe apresenta problemas.</p>
                
                <div style="background: #fef2f2; padding: 10px; border-left: 4px solid #ef4444; margin-top: 15px;">
                  <p style="margin: 0; color: #991b1b;">💡 <b>Isso indica:</b> O problema não é só financeiro. Há uma clara falta de gestão, reconhecimento e liderança estruturada no dia a dia.</p>
                </div>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h2 class="section-title">🚨 4. DIAGNÓSTICO FINAL</h2>
              <div class="box">
                <p style="font-weight: 800; font-size: 14px; margin: 0 0 10px 0;">A empresa apresenta um cenário de:</p>
                <p style="font-weight: 900; font-size: 18px; color: #ef4444; margin: 0 0 15px 0;">🔴 DESORGANIZAÇÃO ESTRUTURAL</p>
                <ul style="font-size: 13px; font-weight: bold; color: #475569; padding-left: 20px; margin: 0;">
                  <li>Falta de liderança estruturada</li>
                  <li>Ausência de processos</li>
                  <li>Falta de clareza de papéis</li>
                </ul>
              </div>
            </div>
            <div>
              <h2 class="section-title">🎯 5. CAUSA RAIZ</h2>
              <div class="box" style="background: #1e293b; color: white; border: none; height: 100%; display: flex; flex-direction: column; justify-content: center;">
                <p style="font-size: 16px; font-weight: 600; opacity: 0.9; margin: 0 0 10px 0;">O problema relatado não é a causa real.</p>
                <p style="font-size: 22px; font-weight: 900; color: #fbbf24; margin: 0; line-height: 1.3;">👉 É a ausência de um Sistema Integrado de Gestão de Pessoas.</p>
              </div>
            </div>
          </div>

          <div class="page-break"></div>
          <h2 class="section-title">🔧 6. PRIORIDADE ESTRATÉGICA (PLANO DE AÇÃO)</h2>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px;">
            <p style="font-size: 18px; font-weight: 900; color: #064384; margin: 0 0 20px 0; text-transform: uppercase;">🚀 Ação 1: Implantar GESTÃO 360°</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
              <div style="display: flex; gap: 15px; align-items: flex-start;">
                <div style="background: #0f172a; color: white; font-weight: 900; padding: 5px 12px; border-radius: 6px;">1</div>
                <div>
                  <p style="font-weight: 800; font-size: 15px; margin: 0; color: #0f172a;">Estrutura Básica (Urgente)</p>
                  <p style="font-size: 13px; color: #64748b; margin: 2px 0 0 0;">Descrição de cargos, organograma e clareza de responsabilidades operacionais.</p>
                </div>
              </div>
              <div style="display: flex; gap: 15px; align-items: flex-start;">
                <div style="background: #334155; color: white; font-weight: 900; padding: 5px 12px; border-radius: 6px;">2</div>
                <div>
                  <p style="font-weight: 800; font-size: 15px; margin: 0; color: #0f172a;">Liderança e Desempenho</p>
                  <p style="font-size: 13px; color: #64748b; margin: 2px 0 0 0;">Metas claras por função, feedback estruturado e rotina de acompanhamento 1:1.</p>
                </div>
              </div>
              <div style="display: flex; gap: 15px; align-items: flex-start;">
                <div style="background: #475569; color: white; font-weight: 900; padding: 5px 12px; border-radius: 6px;">3</div>
                <div>
                  <p style="font-weight: 800; font-size: 15px; margin: 0; color: #0f172a;">Estruturação do RH (Atração e Retenção)</p>
                  <p style="font-size: 13px; color: #64748b; margin: 2px 0 0 0;">Recrutamento organizado, Onboarding técnico e Treinamentos mapeados.</p>
                </div>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px;">
            <div>
              <h2 class="section-title">📊 7. LEITURA EXECUTIVA</h2>
              <div class="box" style="font-size: 14px; font-weight: 600; color: #334155; font-style: italic; line-height: 1.6; border-left: 4px solid #064384;">
                "Hoje sua empresa está operando com apenas ${resultados.indiceGeral}% de maturidade em gestão de pessoas. Isso significa que praticamente não existe um sistema estruturado de gestão, o que explica diretamente a desmotivação da equipe, o desgaste na liderança e o risco alto de rotatividade.<br/><br/>
                O principal problema não é apenas a motivação, mas sim a ausência de processos claros de gestão, acompanhamento e desenvolvimento da equipe."
              </div>
            </div>
            
            <div>
              <h2 class="section-title">🔥 8. OPORTUNIDADE DE CONSULTORIA</h2>
              <div class="box" style="background: #fffbeb; border-color: #fde68a;">
                <p style="font-size: 13px; font-weight: 800; color: #d97706; margin: 0 0 15px 0; text-transform: uppercase;">Módulos de Implantação Recomendados:</p>
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px; font-weight: 900; color: #92400e; line-height: 2;">
                  <li>👉 Implantação de Gestão de Pessoas 360º</li>
                  <li>👉 Estruturação Organizacional (Cargos)</li>
                  <li>👉 Sistema de Avaliação de Desempenho</li>
                  <li>👉 Programa de Liderança e Engajamento</li>
                </ul>
              </div>
            </div>
          </div>

          <div style="margin-top: 50px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 20px;">
            <p style="font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Gerado pelo Sistema Integrado de Diagnóstico Estratégico.</p>
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
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">
              workspace_premium
            </span>
            Gerar Relatório Executivo
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF8323] hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 disabled:opacity-50 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "sync" : "save"}
            </span>
            {saving ? "Salvando..." : "Salvar Dados"}
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
