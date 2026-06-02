"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Categorias oficiais do PDF Krausz
const CATEGORIAS_TEMPO = [
  "A - Planejamento do tempo",
  "B - Administração por crises",
  "C - Organização pessoal e autodisciplina no trabalho",
  "D - Comunicação",
  "E - Tomada de decisões",
  "F - Diagnóstico de problemas",
  "G - Delegação",
  "H - Capacidade de dizer não",
  "I - Uso do telefone",
  "J - Delegação 'para cima'",
  "K - Estabelecimento de prioridades",
  "L - Utilização dos níveis de capacidade",
  "M - Perfeccionismo",
  "N - Objetivos pessoais",
  "O - Flexibilidade no trabalho",
  "P - Concentração",
];

interface AvaliacaoTempo {
  cd_avaliacao: string;
  ts_criacao: string;
  nm_empresa: string;
  nm_avaliado: string;
  tp_status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";
  js_respostas: boolean[];
  ds_observacao: string;
}

export default function GestaoTempoAdminPage() {
  const router = useRouter();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoTempo[]>([]);
  const [loading, setLoading] = useState(true);

  const [novaEmpresa, setNovaEmpresa] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [pdiAtivo, setPdiAtivo] = useState<string | null>(null);
  const [pdiTexto, setPdiTexto] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      const { data } = await supabase
        .from("AVALIACOES_TEMPO_AVULSO")
        .select("*")
        .order("ts_criacao", { ascending: false });

      if (data) setAvaliacoes(data);
      setLoading(false);
    };
    carregarDados();
  }, []);

  const criarNovaAvaliacao = async () => {
    if (!novoNome) return alert("Digite pelo menos o Nome do Avaliado!");
    setIsCreating(true);

    const { data, error } = await supabase
      .from("AVALIACOES_TEMPO_AVULSO")
      .insert([{ nm_empresa: novaEmpresa || "Avulso", nm_avaliado: novoNome }])
      .select("*")
      .single();

    if (!error && data) {
      setAvaliacoes([data, ...avaliacoes]);
      setNovoNome("");
      copiarLink(data.cd_avaliacao);
    } else {
      alert("Erro ao gerar link.");
    }
    setIsCreating(false);
  };

  const copiarLink = (id: string) => {
    const link = `${window.location.origin}/pesquisa/tempo-avulso/${id}`;
    navigator.clipboard.writeText(link);
    alert(
      "Link público copiado com sucesso!\nEnvie para o candidato responder.",
    );
  };

  const salvarPDI = async (id: string) => {
    await supabase
      .from("AVALIACOES_TEMPO_AVULSO")
      .update({ ds_observacao: pdiTexto })
      .eq("cd_avaliacao", id);
    setAvaliacoes(
      avaliacoes.map((a) =>
        a.cd_avaliacao === id ? { ...a, ds_observacao: pdiTexto } : a,
      ),
    );
    setPdiAtivo(null);
    alert("PDI salvo com sucesso!");
  };

  const gerarPDF = (av: AvaliacaoTempo) => {
    if (av.tp_status !== "CONCLUIDO" || !av.js_respostas)
      return alert("Avaliação não concluída!");

    const pontos = new Array(16).fill(0);
    let totalSIM = 0;
    av.js_respostas.forEach((sim, i) => {
      if (sim) { totalSIM++; pontos[i % 16]++; }
    });

    const aproveitamento = Math.round(((96 - totalSIM) / 96) * 100);
    const hoje = new Date().toLocaleDateString("pt-BR");

    let diagGeral = "", corGeral = "";
    if (totalSIM <= 16) { diagGeral = "Você administra bem o seu tempo."; corGeral = "#059669"; }
    else if (totalSIM <= 36) { diagGeral = "Você administra razoavelmente o seu tempo. Verifique as áreas de dificuldade que necessitam de melhoria."; corGeral = "#064384"; }
    else if (totalSIM <= 56) { diagGeral = "Você não administra adequadamente o seu tempo, podendo gerar desperdício do seu próprio tempo e das pessoas com as quais trabalha."; corGeral = "#d97706"; }
    else if (totalSIM <= 76) { diagGeral = "Você administra mal o seu tempo. Desperdiça seu próprio tempo e o das pessoas com as quais trabalha."; corGeral = "#dc2626"; }
    else { diagGeral = "Você não administra o seu tempo. Tem atuado de acordo com os acontecimentos prejudicando os resultados de seu trabalho e da equipe."; corGeral = "#991b1b"; }

    const getClass = (p: number) => {
      if (p === 0) return { label: "EXCELENTE", cor: "#059669" };
      if (p === 1) return { label: "BOM", cor: "#064384" };
      if (p <= 3) return { label: "SATISFATÓRIO", cor: "#d97706" };
      return { label: "NECESSITA DE MELHORIA", cor: "#dc2626" };
    };

    const LETRAS = "ABCDEFGHIJKLMNOP".split("");
    const NOMES = [
      "Planejamento do tempo", "Administração por crises",
      "Organização pessoal e autodisciplina", "Comunicação",
      "Tomada de decisões", "Diagnóstico de problemas",
      "Delegação", "Capacidade de dizer não",
      "Uso do telefone", 'Delegação "para cima"',
      "Estabelecimento de prioridades", "Utilização dos níveis de capacidade",
      "Perfeccionismo", "Objetivos pessoais",
      "Flexibilidade no trabalho", "Concentração",
    ];

    const INFO = [
      { bom: "Demonstra habilidade no planejamento do tempo, com rotinas eficientes e priorização estratégica de atividades.", sat: "Planeja o tempo de forma razoável, mas há espaço para maior consistência e antecipação de demandas futuras.", mel: "Dificuldades no planejamento resultam em sobrecarga, retrabalho e frequente perda de prazos.", rec: "Reserve os primeiros 15 minutos do dia para planejar e os últimos 10 para revisar. Utilize listas de prioridades, agenda semanal e blocos de tempo dedicados às atividades prioritárias." },
      { bom: "Gerencia situações de crise com controle e proatividade, respondendo às urgências sem comprometer as prioridades.", sat: "Lida razoavelmente com crises, mas tende a reagir de modo reativo em algumas situações, comprometendo o planejamento original.", mel: "Padrão predominantemente reativo: frequentemente consumido por crises e urgências que poderiam ser evitadas com planejamento preventivo.", rec: "Implemente revisão semanal para identificar gargalos antes de virarem crises. Use a Matriz de Eisenhower para separar urgente do importante e dedique 20% do tempo ao planejamento preventivo." },
      { bom: "Organização pessoal e autodisciplina são pontos fortes, garantindo ambiente ordenado e execução consistente das atividades.", sat: "Apresenta organização razoável, mas a autodisciplina pode ser fortalecida para maior consistência nas rotinas diárias.", mel: "Desafios em organização pessoal e autodisciplina geram retrabalho, perda de materiais e dificuldade em cumprir compromissos.", rec: "Estabeleça rotinas fixas de início e fim de expediente. Organize o espaço físico e digital com critérios claros. Experimente GTD (Getting Things Done) ou a Técnica Pomodoro." },
      { bom: "Comunica-se de forma clara e assertiva, economizando tempo próprio e das pessoas ao redor.", sat: "Comunicação satisfatória na maioria das situações, mas falta objetividade em alguns momentos, gerando necessidade de esclarecimentos.", mel: "Dificuldades de comunicação impactam na gestão do tempo, gerando mal-entendidos, retrabalho e reuniões improdutivas.", rec: "Prepare pauta e objetivos claros antes de toda reunião. Use comunicação escrita para demandas complexas e templates para e-mails frequentes. Pratique a assertividade e objetividade." },
      { bom: "Toma decisões com agilidade e assertividade, equilibrando análise e intuição sem deixar a indecisão comprometer o tempo.", sat: "Tomada de decisão satisfatória na maioria dos casos, mas análise excessiva ou hesitação podem atrasar processos em algumas situações.", mel: "Dificuldade em decidir com agilidade gera gargalos e dependência de terceiros para resolver questões que poderiam ser resolvidas autonomamente.", rec: "Defina critérios claros para situações recorrentes. Estabeleça prazos máximos para decidir e use o princípio do 'bom o suficiente' para decisões de menor impacto estratégico." },
      { bom: "Identifica a causa raiz dos problemas antes de agir, evitando soluções superficiais e retrabalho futuro.", sat: "Diagnostica problemas de forma satisfatória, mas por vezes parte para a solução sem análise completa das causas.", mel: "Tende a resolver sintomas em vez de causas, resultando na recorrência dos mesmos problemas e maior consumo de tempo.", rec: "Aplique os '5 Porquês' ou o Diagrama de Ishikawa antes de propor soluções. Reserve ao menos 15 minutos de análise diagnóstica antes de agir em problemas complexos." },
      { bom: "Delega tarefas com eficiência, confiando na equipe e liberando tempo para atividades estratégicas de maior valor.", sat: "Delega de forma razoável, mas em algumas situações executa pessoalmente tarefas que poderiam ser realizadas por outros.", mel: "Dificuldade em delegar leva à assunção de responsabilidades desnecessárias, comprometendo a capacidade de focar no estratégico.", rec: "Mapeie tarefas delegáveis e identifique pessoas capacitadas. Pratique a delegação progressiva com acompanhamento inicial. Lembre-se: delegar é desenvolver pessoas." },
      { bom: "Boa capacidade de estabelecer limites e recusar demandas que não se alinham com suas prioridades.", sat: "Consegue dizer não em diversas situações, mas por vezes aceita demandas adicionais mesmo com o calendário já comprometido.", mel: "Dificuldade em recusar solicitações leva à assunção de compromissos além da capacidade, gerando sobrecarga e atrasos.", rec: "Pratique o 'não assertivo': recuse com firmeza e respeito, oferecendo alternativas quando possível. Antes de aceitar compromissos, consulte sempre a agenda e avalie o impacto nas prioridades." },
      { bom: "Usa o telefone de forma eficiente, mantendo conversas objetivas e controlando interrupções para preservar a concentração.", sat: "Uso razoavelmente controlado, mas algumas conversas se estendem além do necessário ou interrupções afetam o foco.", mel: "O telefone representa consumo significativo de tempo, com conversas longas e interrupções frequentes que fragmentam o trabalho.", rec: "Estabeleça horários para retornar ligações e defina tempo máximo antes de cada chamada. Configure períodos de 'não interrupção' para tarefas que exigem concentração profunda." },
      { bom: "Resolve a maioria das situações no próprio nível, recorrendo a superiores apenas para questões genuinamente estratégicas.", sat: "Em geral administra bem a autonomia, mas às vezes transfere para cima decisões que poderiam ser resolvidas no próprio nível.", mel: "Tendência a transferir para superiores decisões dentro da própria alçada, consumindo o tempo deles e reduzindo sua autonomia.", rec: "Antes de escalar um problema, proponha ao menos duas alternativas de solução. Busque clareza sobre os limites da sua autoridade decisória e desenvolva progressivamente maior autonomia." },
      { bom: "Estabelece prioridades com clareza, focando em atividades de maior impacto e gerenciando bem urgente versus importante.", sat: "Define prioridades de forma razoável, mas por vezes perde-se em tarefas operacionais ou deixa o urgente sobrepor o importante.", mel: "Dificuldade em priorizar resulta em tempo excessivo em atividades de baixo valor enquanto as de maior impacto são adiadas.", rec: "Use a Matriz de Eisenhower diariamente. Comece sempre pelas atividades mais importantes. Revise suas prioridades ao final de cada semana para ajustar o plano." },
      { bom: "Usa bem os diferentes níveis de energia ao longo do dia, alocando tarefas complexas nos momentos de maior pico produtivo.", sat: "Aproveita razoavelmente os picos de energia, mas o alinhamento de tarefas ao nível de capacidade pode melhorar em algumas situações.", mel: "Não utiliza adequadamente os diferentes níveis de capacidade, executando tarefas exigentes em momentos de baixa energia.", rec: "Identifique seus horários de pico de produtividade. Aloque tarefas mais complexas nesses períodos e reserve atividades mecânicas para momentos de menor energia." },
      { bom: "Equilibra bem a busca pela qualidade com a eficiência, sem cair nas armadilhas do perfeccionismo excessivo.", sat: "Demonstra algum perfeccionismo que, embora resulte em qualidade, por vezes compromete prazos em tarefas que não exigem perfeição.", mel: "O perfeccionismo compromete a gestão do tempo, levando ao investimento excessivo em detalhes de baixo impacto no resultado final.", rec: "Defina critérios claros de 'pronto' para cada entrega. Pergunte-se: 'O tempo extra gera valor proporcional?' Pratique entregas incrementais e o conceito de mínimo produto viável." },
      { bom: "Tem clareza sobre objetivos pessoais e profissionais, guiando as decisões de alocação de tempo de forma estratégica.", sat: "Possui objetivos razoavelmente definidos, mas a conexão entre atividades diárias e metas de longo prazo pode ser mais clara.", mel: "Ausência de objetivos claros leva a alocação reativa do tempo, sem direção estratégica que priorize o que é verdadeiramente importante.", rec: "Defina objetivos SMART para os próximos 90 dias. Revise semanalmente como suas atividades diárias contribuem para essas metas de médio prazo." },
      { bom: "Demonstra boa flexibilidade, adaptando-se a mudanças sem perder o foco nas metas principais.", sat: "Possui razoável flexibilidade, mas imprevistos às vezes geram desorganização temporária que compromete a eficiência.", mel: "Dificuldade em adaptar-se a mudanças, seja por rigidez no planejamento ou por se deixar levar completamente pelo fluxo de demandas.", rec: "Reserve 20-30% da agenda para imprevistos e urgências legítimas. Desenvolva planos alternativos para atividades críticas. Pratique a resiliência como competência intencional." },
      { bom: "Excelente capacidade de concentração, gerenciando bem as distrações e mantendo foco por períodos adequados.", sat: "Concentração razoável, mas distrações internas ou externas às vezes comprometem o trabalho profundo e aumentam o tempo necessário.", mel: "Dificuldade significativa de concentração: frequentemente interrompido por distrações que fragmentam o tempo e reduzem a qualidade do trabalho.", rec: "Implemente a Técnica Pomodoro (25 min de foco + 5 min de pausa). Elimine notificações durante trabalho profundo. Comunique proativamente sua necessidade de períodos sem interrupção." },
    ];

    const piores4 = [...pontos].map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p).slice(0, 4);

    const rowsTabela = LETRAS.map((l, i) => {
      const { label, cor } = getClass(pontos[i]);
      return `<tr style="border-bottom:1px solid #f1f5f9;${i % 2 !== 0 ? "background:#f8fafc;" : ""}"><td style="padding:9px 12px;font-weight:900;color:#064384;text-align:center;">${l}</td><td style="padding:9px 12px;font-size:13px;color:#334155;">${NOMES[i]}</td><td style="padding:9px 12px;text-align:center;font-weight:700;color:#64748b;">${pontos[i]}/6</td><td style="padding:9px 12px;text-align:right;font-weight:900;color:${cor};font-size:12px;">${label}</td></tr>`;
    }).join("");

    const secoes = LETRAS.map((l, i) => {
      const { label, cor } = getClass(pontos[i]);
      const info = INFO[i];
      const diag = pontos[i] <= 1 ? info.bom : pontos[i] <= 3 ? info.sat : info.mel;
      return `<div style="margin-bottom:22px;page-break-inside:avoid;border-left:4px solid ${cor};padding:8px 14px;background:${cor}10;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;"><strong style="font-size:13.5px;color:#0f172a;">${l} — ${NOMES[i]} <span style="font-size:12px;font-weight:400;color:#64748b;">(${pontos[i]}/6)</span></strong><span style="font-size:11px;font-weight:900;color:${cor};">${label}</span></div><p style="margin:0 0 4px 0;font-size:12.5px;color:#334155;line-height:1.6;"><strong>Diagnóstico:</strong> ${diag}</p><p style="margin:0;font-size:12.5px;color:#475569;line-height:1.6;"><strong>Recomendação:</strong> ${info.rec}</p></div>`;
    }).join("");

    const prioridades = piores4.map((item, idx) => `<li style="margin-bottom:8px;font-size:13px;color:#334155;line-height:1.6;"><strong>Ação ${idx + 1} — Área ${LETRAS[item.i]} (${NOMES[item.i]}):</strong> ${INFO[item.i].rec}</li>`).join("");

    const conclusao = `Com base na análise das 16 áreas do Inventário, ${av.nm_avaliado} obteve ${totalSIM} respostas afirmativas (aproveitamento de ${aproveitamento}% na gestão eficiente do tempo). ${pontos.filter(p => p <= 1).length} área(s) apresenta(m) desempenho BOM ou EXCELENTE, enquanto ${pontos.filter(p => p >= 4).length} área(s) necessita(m) de atenção imediata. O desenvolvimento dessas competências exige autoconhecimento, disciplina e prática consistente. Recomenda-se implementar as prioridades abaixo de forma progressiva ao longo dos próximos 90 dias.`;

    const blocosPDI = av.ds_observacao ? `<div style="margin-top:18px;"><h3 style="font-size:13px;font-weight:900;color:#064384;margin:0 0 8px 0;">Plano de Desenvolvimento Individual (PDI)</h3><div style="background:#fffbeb;border:1px dashed #f59e0b;padding:14px;border-radius:6px;font-size:13px;line-height:1.7;color:#334155;">${av.ds_observacao.replace(/\n/g, "<br/>")}</div></div>` : "";

    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    janela.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;margin:0;padding:0;}@page{margin:14mm;size:A4;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.pg2{page-break-before:always;}}table{width:100%;border-collapse:collapse;}th{background:#064384;color:#fff;padding:10px 12px;font-size:12px;font-weight:900;text-align:left;}.pg{padding:34px;}</style></head><body>
<div class="pg">
<div style="text-align:center;border-bottom:3px solid #064384;padding-bottom:18px;margin-bottom:26px;">
<h1 style="margin:0;font-size:20px;font-weight:900;color:#064384;text-transform:uppercase;letter-spacing:2px;">Inventário de Administração do Tempo</h1>
<div style="display:flex;justify-content:center;gap:40px;margin-top:10px;font-size:14px;color:#475569;font-weight:600;"><span><strong>Empresa:</strong> ${av.nm_empresa}</span><span><strong>Avaliado(a):</strong> ${av.nm_avaliado}</span></div>
</div>
<div style="background:#f8fafc;border:2px solid #cbd5e1;border-radius:12px;text-align:center;padding:28px;margin-bottom:30px;page-break-inside:avoid;">
<p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;font-weight:900;color:#64748b;letter-spacing:1px;">Total de 'SIM' (Pontuação Geral)</p>
<div style="font-size:58px;font-weight:900;color:${corGeral};line-height:1;margin-bottom:10px;">${totalSIM}<span style="font-size:24px;color:#94a3b8;font-weight:600;"> / 96</span></div>
<p style="margin:0;font-weight:700;color:#0f172a;font-size:15px;max-width:600px;margin:0 auto;line-height:1.5;">${diagGeral}</p>
</div>
<h2 style="font-size:13px;font-weight:900;color:#064384;border-bottom:2px solid #064384;padding-bottom:7px;margin-bottom:0;text-transform:uppercase;letter-spacing:1px;">Análise por Área de Dificuldade</h2>
<table><thead><tr><th style="width:8%;text-align:center;">Letra</th><th style="width:52%;">Área</th><th style="width:15%;text-align:center;">Pontuação</th><th style="width:25%;text-align:right;">Classificação</th></tr></thead><tbody>${rowsTabela}</tbody></table>
</div>
<div class="pg pg2">
<div style="border-bottom:3px solid #064384;padding-bottom:14px;margin-bottom:22px;">
<h1 style="margin:0;font-size:18px;font-weight:900;color:#064384;text-transform:uppercase;letter-spacing:2px;">Diagnóstico de Administração do Tempo</h1>
<div style="display:flex;gap:32px;margin-top:8px;font-size:13px;color:#475569;font-weight:600;"><span><strong>Avaliado(a):</strong> ${av.nm_avaliado}</span><span><strong>Empresa:</strong> ${av.nm_empresa}</span><span><strong>Data:</strong> ${hoje}</span></div>
</div>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:22px;page-break-inside:avoid;">
<h2 style="margin:0 0 10px 0;font-size:12px;font-weight:900;color:#064384;text-transform:uppercase;letter-spacing:1px;">1. Resultado Geral</h2>
<div style="display:flex;gap:20px;margin-bottom:12px;">
<div style="text-align:center;flex:1;border-right:1px solid #e2e8f0;padding-right:20px;"><p style="margin:0 0 3px 0;font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Pontuação</p><p style="margin:0;font-size:24px;font-weight:900;color:${corGeral};">${totalSIM}<span style="font-size:14px;color:#94a3b8;">/96</span></p></div>
<div style="text-align:center;flex:1;border-right:1px solid #e2e8f0;padding-right:20px;"><p style="margin:0 0 3px 0;font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Aproveitamento</p><p style="margin:0;font-size:24px;font-weight:900;color:#064384;">${aproveitamento}%</p></div>
<div style="flex:2;"><p style="margin:0 0 3px 0;font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Resultado</p><p style="margin:0;font-size:13px;font-weight:700;color:#0f172a;line-height:1.4;">${diagGeral}</p></div>
</div>
<p style="margin:0;font-size:12.5px;color:#475569;line-height:1.7;border-top:1px solid #e2e8f0;padding-top:10px;">O Inventário de Administração do Tempo, desenvolvido por <strong>Rosa R. Krausz</strong>, examina 16 áreas distintas com 6 questões cada, totalizando 96 perguntas. A resposta &quot;SIM&quot; indica comportamentos que dificultam a gestão eficiente do tempo. O resultado obtido aponta oportunidades concretas de desenvolvimento que, quando trabalhadas sistematicamente, geram impacto direto na produtividade e nos resultados profissionais.</p>
</div>
<h2 style="font-size:12px;font-weight:900;color:#064384;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #064384;padding-bottom:7px;margin-bottom:16px;">2. Análise Detalhada por Área</h2>
${secoes}
<div style="margin-top:26px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;page-break-inside:avoid;">
<h2 style="margin:0 0 10px 0;font-size:12px;font-weight:900;color:#064384;text-transform:uppercase;letter-spacing:1px;">3. Conclusão e Plano de Ação</h2>
<p style="margin:0 0 12px 0;font-size:13px;color:#334155;line-height:1.7;">${conclusao}</p>
<h3 style="margin:0 0 8px 0;font-size:13px;font-weight:900;color:#064384;">Prioridades Imediatas (próximos 30 dias)</h3>
<ol style="margin:0;padding-left:20px;">${prioridades}</ol>
${blocosPDI}
</div>
<div style="margin-top:28px;text-align:center;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-top:1px solid #e2e8f0;padding-top:12px;">Metodologia: Rosa R. Krausz &nbsp;|&nbsp; Gerado via Consultoria Wallison Branquinho &nbsp;|&nbsp; ${hoje}</div>
</div>
<script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},600);};</script></body></html>`);

    janela.document.close();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar
        onLogout={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}
      />

      <main className="flex-1 overflow-y-auto flex flex-col h-full relative">
        <header className="bg-white/95 backdrop-blur-sm px-8 py-6 border-b border-slate-200 shadow-sm sticky top-0 z-10 w-full flex items-center gap-4 shrink-0">
          <div className="size-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              update
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#064384] tracking-tight">
              Gestão do Tempo
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Inventário Rosa Krausz (Avulso)
            </p>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
            <div>
              <h3 className="font-black text-slate-800 text-lg mb-1">
                Novo Link de Avaliação
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Gere um link para o cliente responder às 96 questões de tempo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Empresa (Opcional)"
                value={novaEmpresa}
                onChange={(e) => setNovaEmpresa(e.target.value)}
                className="px-5 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#064384] w-full sm:w-48 text-sm font-bold text-slate-700 bg-slate-50"
              />
              <input
                type="text"
                placeholder="Nome do Avaliado"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="px-5 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#064384] w-full sm:w-64 text-sm font-bold text-slate-700 bg-slate-50"
              />
              <button
                onClick={criarNovaAvaliacao}
                disabled={isCreating}
                className="bg-[#064384] hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-black text-sm active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    sync
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">
                    link
                  </span>
                )}
                {isCreating ? "Gerando..." : "Gerar Link"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {avaliacoes.map((av) => (
              <div
                key={av.cd_avaliacao}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md hover:border-[#064384]/30 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-[#064384] transition-colors">
                      {av.nm_avaliado}
                    </h3>
                    <span className="text-[10px] font-black text-[#FF8323] uppercase tracking-widest">
                      {av.nm_empresa}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-lg shrink-0 border ${av.tp_status === "CONCLUIDO" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : av.tp_status === "EM_ANDAMENTO" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}
                  >
                    {av.tp_status}
                  </span>
                </div>

                {av.tp_status !== "CONCLUIDO" ? (
                  <button
                    onClick={() => copiarLink(av.cd_avaliacao)}
                    className="mt-auto w-full bg-slate-50 text-slate-600 border border-slate-200 font-bold py-3.5 rounded-xl text-sm hover:bg-[#064384] hover:text-white hover:border-[#064384] transition-all flex justify-center items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      content_copy
                    </span>{" "}
                    Copiar Link Público
                  </button>
                ) : (
                  <div className="mt-auto space-y-3 pt-5 border-t border-slate-100">
                    {pdiAtivo === av.cd_avaliacao ? (
                      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                        <textarea
                          className="w-full text-sm p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#064384] bg-slate-50 resize-none font-medium text-slate-700"
                          rows={4}
                          placeholder="Plano de ação..."
                          value={pdiTexto}
                          onChange={(e) => setPdiTexto(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPdiAtivo(null)}
                            className="w-1/3 bg-white border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => salvarPDI(av.cd_avaliacao)}
                            className="w-2/3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors"
                          >
                            Salvar PDI
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setPdiTexto(av.ds_observacao || "");
                            setPdiAtivo(av.cd_avaliacao);
                          }}
                          className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors flex justify-center items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {av.ds_observacao ? "edit" : "add_comment"}
                          </span>{" "}
                          {av.ds_observacao ? "Editar PDI" : "Adicionar PDI"}
                        </button>
                        <button
                          onClick={() => gerarPDF(av)}
                          className="w-full bg-[#064384] text-white font-black py-3 rounded-xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 hover:bg-blue-900 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            picture_as_pdf
                          </span>{" "}
                          Gerar Relatório
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
