"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AREAS = [
  {
    id: "estilo_lideranca",
    nome: "Estilo de Liderança",
    perguntas: [
      "Você adapta seu estilo de liderança conforme as necessidades da equipe e da situação?",
      "Você promove um ambiente de trabalho colaborativo e inclusivo?",
      "Você delega tarefas de forma eficaz e confia na capacidade da equipe?",
      "Você demonstra coerência entre suas ações e palavras, sendo um exemplo para a equipe?",
    ],
  },
  {
    id: "comunicacao",
    nome: "Comunicação",
    perguntas: [
      "Você se comunica de forma clara e transparente com a equipe?",
      "Você escuta ativamente as preocupações e sugestões do seu time?",
      "Você fornece feedback construtivo regularmente?",
      "Você adapta sua comunicação ao estilo e necessidades das pessoas da equipe?",
    ],
  },
  {
    id: "tomada_decisao",
    nome: "Tomada de Decisão",
    perguntas: [
      "Você envolve a equipe no processo de tomada de decisão, quando apropriado?",
      "Você avalia os riscos e benefícios antes de tomar decisões importantes?",
      "Você toma decisões de forma ágil e assertiva em situações de pressão?",
      "Você revisa e ajusta decisões com base em novos dados e feedbacks?",
    ],
  },
  {
    id: "gestao_conflitos",
    nome: "Gestão de Conflitos",
    perguntas: [
      "Você consegue identificar rapidamente os sinais de conflito dentro da equipe?",
      "Você consegue mediar os conflitos de maneira justa e imparcial?",
      "Você promove a resolução de conflitos através da empatia e do diálogo aberto?",
      "Você utiliza estratégias para prevenir ou minimizar a recorrência de conflitos?",
    ],
  },
  {
    id: "motivacao_engajamento",
    nome: "Motivação e Engajamento",
    perguntas: [
      "Você reconhece e celebra as conquistas da equipe?",
      "Você incentiva o desenvolvimento profissional e pessoal dos membros da equipe?",
      "Você cria um ambiente de trabalho positivo que motiva a equipe a alcançar os objetivos?",
      "Você busca entender o que motiva individualmente cada pessoa da equipe e age baseado nesse entendimento?",
    ],
  },
];

const OPCOES = [
  { valor: 1, label: "NÃO / NUNCA", cor: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" },
  { valor: 2, label: "PARCIALMENTE / ÀS VEZES", cor: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100" },
  { valor: 3, label: "SIM / SEMPRE", cor: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" },
];

const NIVEIS = [
  { min: 0, max: 30, nome: "Início da Jornada", descricao: "A liderança está em desenvolvimento inicial. Recomenda-se investir em formação de liderança, coaching e mentoria estruturada para desenvolver as competências essenciais.", cor: "#ef4444" },
  { min: 31, max: 45, nome: "Em Desenvolvimento", descricao: "A liderança demonstra progresso e consciência das competências necessárias. Com ações direcionadas, é possível alcançar um nível de alto desempenho em curto prazo.", cor: "#f59e0b" },
  { min: 46, max: 60, nome: "Alto Desempenho", descricao: "A liderança apresenta alto nível de maturidade e competência. Pode servir como modelo para outros líderes e se beneficia de desafios estratégicos mais complexos.", cor: "#10b981" },
];

type Step = "ficha" | "diagnostico" | "resultado" | "melhoria" | "plano" | "relatorio";

interface Ficha {
  consultor: string;
  dataAtendimento: string;
  razaoSocial: string;
  nomeContato: string;
  celular: string;
  email: string;
  tempoOperacao: string;
  segmentoClientes: string;
  atividadeEconomica: string;
  desafiosAtuais: string;
}

interface MelhoriaManual {
  objetivosCliente: string;
  parar: string;
  continuar: string;
  comecar: string;
}

const MELHORIA_VAZIA: MelhoriaManual = { objetivosCliente: "", parar: "", continuar: "", comecar: "" };

interface PlanoItem {
  descricao: string;
  responsavel: string;
  prioridade: "Baixa" | "Média" | "Alta";
  dataInicio: string;
  dataTermino: string;
  recursos: string;
}

const PLANO_ITEM_VAZIO: PlanoItem = { descricao: "", responsavel: "", prioridade: "Média", dataInicio: "", dataTermino: "", recursos: "" };

export default function LiderancaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("ficha");

  const [ficha, setFicha] = useState<Ficha>({
    consultor: "",
    dataAtendimento: new Date().toISOString().split("T")[0],
    razaoSocial: "",
    nomeContato: "",
    celular: "",
    email: "",
    tempoOperacao: "",
    segmentoClientes: "",
    atividadeEconomica: "",
    desafiosAtuais: "",
  });

  const [respostas, setRespostas] = useState<Record<string, Record<number, number>>>({});
  const [melhoria, setMelhoria] = useState<MelhoriaManual>(MELHORIA_VAZIA);
  const [plano, setPlano] = useState<PlanoItem[]>([{ ...PLANO_ITEM_VAZIO }]);

  const addPlanoItem = () => setPlano([...plano, { ...PLANO_ITEM_VAZIO }]);
  const removePlanoItem = (i: number) => setPlano(plano.filter((_, idx) => idx !== i));
  const updatePlanoItem = (i: number, campo: keyof PlanoItem, valor: string) => {
    const novo = [...plano];
    novo[i] = { ...novo[i], [campo]: valor };
    setPlano(novo);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else setLoading(false);
    });
  }, [router]);

  const calcularSubtotal = (areaId: string) => {
    const r = respostas[areaId] || {};
    return Object.values(r).reduce((s, v) => s + v, 0);
  };

  const calcularTotal = () => AREAS.reduce((s, a) => s + calcularSubtotal(a.id), 0);
  const getNivel = (total: number) => NIVEIS.find((n) => total >= n.min && total <= n.max) || NIVEIS[0];

  const areasOrdenadas = () =>
    [...AREAS].map((a) => ({ ...a, subtotal: calcularSubtotal(a.id), pct: Math.round((calcularSubtotal(a.id) / 12) * 100) }))
      .sort((a, b) => a.subtotal - b.subtotal);

  const diagnosticoCompleto = AREAS.every((a) => Object.keys(respostas[a.id] || {}).length === 4);

  const gerarPDF = () => {
    const total = calcularTotal();
    const nivel = getNivel(total);
    const areas = areasOrdenadas();
    const dataFmt = new Date(ficha.dataAtendimento + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    const barras = areas.map((a) => `
      <div style="margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;">
          <span>${a.nome}</span><span>${a.pct}%</span>
        </div>
        <div style="height:24px;background:#e2e8f0;border-radius:8px;overflow:hidden;">
          <div style="height:100%;width:${a.pct}%;background:${a.pct >= 75 ? "#10b981" : a.pct >= 50 ? "#f59e0b" : "#ef4444"};border-radius:8px;"></div>
        </div>
      </div>`).join("");

    const planoPreenchido = plano.filter((p) => p.descricao.trim());
    const formatarDataPdf = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";
    const planoTabela = planoPreenchido.length === 0
      ? "<p style='color:#94a3b8;font-style:italic;'>Nenhuma recomendação registrada.</p>"
      : `<table>
          <tr><th>#</th><th>Recomendação</th><th>Responsável</th><th>Prioridade</th><th>Início</th><th>Término</th><th>Recursos</th></tr>
          ${planoPreenchido.map((p, i) => `<tr>
            <td>${i + 1}</td>
            <td>${p.descricao}</td>
            <td>${p.responsavel || "—"}</td>
            <td>${p.prioridade}</td>
            <td>${formatarDataPdf(p.dataInicio)}</td>
            <td>${formatarDataPdf(p.dataTermino)}</td>
            <td>${p.recursos || "—"}</td>
          </tr>`).join("")}
        </table>`;

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
    <title>Diagnóstico de Liderança — ${ficha.razaoSocial}</title>
    <style>
      @page{size:A4;margin:0} *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .cover{width:210mm;min-height:297mm;background:linear-gradient(135deg,#1e3a5f 0%,#064384 60%,#0a5caa 100%);display:flex;flex-direction:column;justify-content:space-between;padding:60px 50px;page-break-after:always}
      .cover-logo-text{color:white;font-size:22px;font-weight:900;letter-spacing:2px}
      .cover-center{text-align:center}
      .cover-badge{display:inline-block;background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.9);font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;padding:8px 20px;border-radius:30px;margin-bottom:32px}
      .cover-title{color:white;font-size:44px;font-weight:900;line-height:1.1;margin-bottom:12px}
      .cover-sub{color:rgba(255,255,255,0.75);font-size:18px;margin-bottom:40px}
      .cover-card{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:24px 32px;max-width:460px;margin:0 auto}
      .cover-card-label{color:rgba(255,255,255,0.6);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
      .cover-card-value{color:white;font-size:18px;font-weight:800;margin-bottom:14px}
      .cover-footer{text-align:center;color:rgba(255,255,255,0.5);font-size:11px}
      .page{width:210mm;min-height:297mm;padding:40px 50px;page-break-after:always}
      .page:last-child{page-break-after:auto}
      .ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;padding-bottom:12px;border-bottom:2px solid #e2e8f0}
      .ph-logo{font-size:13px;font-weight:900;color:#064384}
      .ph-info{font-size:11px;color:#94a3b8;font-weight:600}
      .st{font-size:11px;font-weight:800;color:#064384;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
      h2{font-size:22px;font-weight:900;color:#0f172a;margin-bottom:16px}
      p{font-size:14px;color:#475569;line-height:1.7;margin-bottom:12px}
      .nivel-box{border-radius:16px;padding:28px 32px;margin:20px 0;color:white}
      .score-big{font-size:64px;font-weight:900;line-height:1}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
      th{background:#064384;color:white;padding:10px 14px;text-align:left;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
      td{padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#334155}
      tr:nth-child(even) td{background:#f8fafc}
    </style></head><body>
    <div class="cover">
      <div><span class="cover-logo-text">RESPONSA</span></div>
      <div class="cover-center">
        <div class="cover-badge">Diagnóstico de Atendimento</div>
        <div class="cover-title">Avaliação de<br/>Liderança</div>
        <div class="cover-sub">Diagnóstico de Competências de Liderança</div>
        <div class="cover-card">
          <div class="cover-card-label">Empresa Atendida</div>
          <div class="cover-card-value">${ficha.razaoSocial}</div>
          <div class="cover-card-label">Contato</div>
          <div class="cover-card-value">${ficha.nomeContato}</div>
          <div class="cover-card-label">Data do Atendimento</div>
          <div class="cover-card-value" style="margin-bottom:0">${dataFmt}</div>
        </div>
      </div>
      <div class="cover-footer">Diagnóstico de Liderança · Gerado pela Plataforma RESPONSA · Confidencial</div>
    </div>

    <div class="page">
      <div class="ph"><span class="ph-logo">RESPONSA · Liderança</span><span class="ph-info">${ficha.razaoSocial} · ${dataFmt}</span></div>
      <div class="st">Seção 1 — Identificação</div>
      <h2>Ficha Cadastral</h2>
      <table>
        <tr><th>Campo</th><th>Informação</th></tr>
        <tr><td><strong>Consultor(a)</strong></td><td>${ficha.consultor || "—"}</td></tr>
        <tr><td><strong>Razão Social</strong></td><td>${ficha.razaoSocial}</td></tr>
        <tr><td><strong>Nome do Contato</strong></td><td>${ficha.nomeContato}</td></tr>
        <tr><td><strong>E-mail</strong></td><td>${ficha.email || "—"}</td></tr>
        <tr><td><strong>Celular</strong></td><td>${ficha.celular || "—"}</td></tr>
        <tr><td><strong>Atividade Econômica</strong></td><td>${ficha.atividadeEconomica || "—"}</td></tr>
        <tr><td><strong>Segmento de Clientes</strong></td><td>${ficha.segmentoClientes || "—"}</td></tr>
        <tr><td><strong>Tempo de Operação</strong></td><td>${ficha.tempoOperacao || "—"}</td></tr>
        <tr><td><strong>Desafios Atuais</strong></td><td>${ficha.desafiosAtuais || "—"}</td></tr>
      </table>
    </div>

    <div class="page">
      <div class="ph"><span class="ph-logo">RESPONSA · Liderança</span><span class="ph-info">${ficha.razaoSocial} · ${dataFmt}</span></div>
      <div class="st">Seção 2 — Resultado Geral</div>
      <h2>Pontuação e Nível de Desempenho</h2>
      <div class="nivel-box" style="background:${nivel.cor};">
        <div class="score-big">${total}<span style="font-size:24px;opacity:0.8;">/60</span></div>
        <div style="font-size:24px;font-weight:900;margin:8px 0;">${nivel.nome}</div>
        <div style="font-size:14px;opacity:0.9;">${nivel.descricao}</div>
      </div>

      <div class="st" style="margin-top:32px;">Seção 3 — Desempenho por Área</div>
      <h2>Resultados Detalhados</h2>
      <table>
        <tr><th>Área</th><th>Pontuação</th><th>Percentual</th><th>Nível</th></tr>
        ${areas.map(a => `<tr>
          <td><strong>${a.nome}</strong></td>
          <td>${a.subtotal}/12</td>
          <td>${a.pct}%</td>
          <td style="color:${a.pct >= 75 ? "#10b981" : a.pct >= 50 ? "#f59e0b" : "#ef4444"};font-weight:700;">${a.pct >= 75 ? "Alto" : a.pct >= 50 ? "Médio" : "Baixo"}</td>
        </tr>`).join("")}
      </table>
      <div style="margin-top:24px;">${barras}</div>

      <div class="st" style="margin-top:32px;">Seção 4 — Áreas Prioritárias</div>
      <h2>Ranking de Áreas para Aprofundamento</h2>
      <p>As áreas abaixo apresentam os menores índices de desempenho e devem receber atenção prioritária:</p>
      <table>
        <tr><th>#</th><th>Área</th><th>Pontuação</th><th>% de Aproveitamento</th></tr>
        ${areasOrdenadas().slice(0, 3).map((a, i) => `<tr>
          <td style="font-weight:900;color:#ef4444;">${i + 1}º</td>
          <td><strong>${a.nome}</strong></td>
          <td>${a.subtotal}/12</td>
          <td style="font-weight:700;color:#ef4444;">${a.pct}%</td>
        </tr>`).join("")}
      </table>
    </div>

    <div class="page">
      <div class="ph"><span class="ph-logo">RESPONSA · Liderança</span><span class="ph-info">${ficha.razaoSocial} · ${dataFmt}</span></div>
      <div class="st">Seção 5 — Área de Melhoria</div>
      <h2>Objetivos do Cliente e Direcionamento</h2>
      <p><strong>Objetivos do cliente:</strong><br/>${melhoria.objetivosCliente || "Não informado."}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:16px;">
        <div style="padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;">
          <strong style="font-size:11px;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">Parar de Fazer</strong>
          <p style="font-size:13px;color:#334155;margin-top:6px;">${melhoria.parar || "—"}</p>
        </div>
        <div style="padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
          <strong style="font-size:11px;color:#b45309;text-transform:uppercase;letter-spacing:1px;">Continuar Fazendo</strong>
          <p style="font-size:13px;color:#334155;margin-top:6px;">${melhoria.continuar || "—"}</p>
        </div>
        <div style="padding:14px 16px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;">
          <strong style="font-size:11px;color:#047857;text-transform:uppercase;letter-spacing:1px;">Começar a Fazer</strong>
          <p style="font-size:13px;color:#334155;margin-top:6px;">${melhoria.comecar || "—"}</p>
        </div>
      </div>

      <div class="st" style="margin-top:32px;">Seção 6 — Plano de Ação</div>
      <h2>Recomendações do Consultor</h2>
      ${planoTabela}

      <div style="margin-top:48px;text-align:center;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#94a3b8;font-weight:600;">
          Relatório gerado pela Plataforma <strong style="color:#064384;">RESPONSA</strong> · Diagnóstico de Liderança<br/>
          Documento confidencial · ${dataFmt} · Consultor(a): ${ficha.consultor || "—"}
        </p>
      </div>
    </div>
    <script>window.onload=function(){setTimeout(function(){window.print();},800);}</script>
    </body></html>`;

    const janela = window.open("", "_blank", "width=1200,height=900");
    if (!janela) { alert("Permita popups para gerar o PDF."); return; }
    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#064384]">
      <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
    </div>
  );

  const STEPS: { id: Step; label: string; icon: string }[] = [
    { id: "ficha", label: "Ficha Cadastral", icon: "assignment_ind" },
    { id: "diagnostico", label: "Diagnóstico", icon: "quiz" },
    { id: "resultado", label: "Resultado", icon: "bar_chart" },
    { id: "melhoria", label: "Área de Melhoria", icon: "edit_note" },
    { id: "plano", label: "Plano de Ação", icon: "task_alt" },
    { id: "relatorio", label: "Relatório", icon: "picture_as_pdf" },
  ];
  const stepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push("/login"); }} />

      <main className="flex-1 overflow-y-auto flex flex-col h-full">
        <header className="bg-white px-8 py-5 border-b border-slate-200 shadow-sm sticky top-0 z-10 flex items-center gap-4">
          <div className="size-12 bg-blue-50 text-[#064384] rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>supervisor_account</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-[#064384]">Atendimento — Liderança</h2>
            <p className="text-sm font-bold text-slate-500">Diagnóstico de Competências de Liderança</p>
          </div>
        </header>

        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => i < stepIdx && setStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${s.id === step ? "bg-[#064384] text-white" : i < stepIdx ? "text-[#064384] hover:bg-blue-50 cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}
                >
                  <span className="material-symbols-outlined text-[16px]">{i < stepIdx ? "check_circle" : s.icon}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <span className="text-slate-200 font-bold">›</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          {step === "ficha" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h3 className="text-xl font-black text-slate-800 mb-6">Ficha Cadastral da Empresa</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { key: "consultor", label: "Consultor(a)", type: "text", placeholder: "Nome do consultor" },
                  { key: "dataAtendimento", label: "Data do Atendimento", type: "date", placeholder: "" },
                  { key: "razaoSocial", label: "Razão Social *", type: "text", placeholder: "Nome da empresa" },
                  { key: "nomeContato", label: "Nome do Contato *", type: "text", placeholder: "Responsável pelo atendimento" },
                  { key: "celular", label: "Celular", type: "tel", placeholder: "(00) 00000-0000" },
                  { key: "email", label: "E-mail", type: "email", placeholder: "email@empresa.com.br" },
                  { key: "tempoOperacao", label: "Tempo de Operação", type: "text", placeholder: "Ex: 5 anos" },
                  { key: "segmentoClientes", label: "Segmento de Clientes", type: "text", placeholder: "Ex: B2B, B2C" },
                  { key: "atividadeEconomica", label: "Atividade Econômica", type: "text", placeholder: "Ex: Comércio varejista" },
                ].map((f) => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={(ficha as any)[f.key]}
                      onChange={(e) => setFicha({ ...ficha, [f.key]: e.target.value })}
                      className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none" />
                  </div>
                ))}
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Desafios Atuais</label>
                  <textarea rows={3} placeholder="Descreva os principais desafios da empresa..." value={ficha.desafiosAtuais}
                    onChange={(e) => setFicha({ ...ficha, desafiosAtuais: e.target.value })}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none resize-none" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => { if (!ficha.razaoSocial || !ficha.nomeContato) { alert("Preencha Razão Social e Nome do Contato."); return; } setStep("diagnostico"); }}
                  className="flex items-center gap-2 h-12 px-8 bg-[#064384] text-white font-black rounded-xl hover:bg-blue-900 transition-all shadow-md">
                  Iniciar Diagnóstico <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {step === "diagnostico" && (
            <div className="space-y-8">
              {AREAS.map((area) => (
                <div key={area.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#064384] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">supervisor_account</span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base">{area.nome}</h4>
                      <p className="text-xs text-slate-500 font-medium">{Object.keys(respostas[area.id] || {}).length}/4 respondidas{Object.keys(respostas[area.id] || {}).length === 4 && " ✓"}</p>
                    </div>
                    <div className="ml-auto font-black text-[#064384] text-lg">{calcularSubtotal(area.id)}/12</div>
                  </div>
                  <div className="space-y-5">
                    {area.perguntas.map((pergunta, pi) => (
                      <div key={pi} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                        <p className="text-sm font-semibold text-slate-700 mb-3">{pi + 1}. {pergunta}</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {OPCOES.map((op) => (
                            <button key={op.valor}
                              onClick={() => { const atual = respostas[area.id] || {}; setRespostas({ ...respostas, [area.id]: { ...atual, [pi]: op.valor } }); }}
                              className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-black transition-all ${(respostas[area.id] || {})[pi] === op.valor ? op.valor === 1 ? "bg-red-500 border-red-500 text-white" : op.valor === 2 ? "bg-yellow-400 border-yellow-400 text-white" : "bg-green-500 border-green-500 text-white" : op.cor}`}>
                              {op.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <button onClick={() => setStep("ficha")} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#064384] transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_back</span> Voltar</button>
                <button onClick={() => { if (!diagnosticoCompleto) { alert("Responda todas as perguntas antes de continuar."); return; } setStep("resultado"); }} disabled={!diagnosticoCompleto}
                  className="flex items-center gap-2 h-12 px-8 bg-[#064384] text-white font-black rounded-xl hover:bg-blue-900 transition-all shadow-md disabled:opacity-50">
                  Ver Resultado <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                </button>
              </div>
            </div>
          )}

          {step === "resultado" && (() => {
            const total = calcularTotal();
            const nivel = getNivel(total);
            return (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                  <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest mb-4">Pontuação Total</h3>
                  <div className="text-7xl font-black mb-2" style={{ color: nivel.cor }}>{total}</div>
                  <div className="text-slate-400 font-bold mb-4">de 60 pontos</div>
                  <div className="inline-block px-6 py-3 rounded-full text-white font-black text-xl" style={{ background: nivel.cor }}>{nivel.nome}</div>
                  <p className="text-slate-600 font-medium mt-4 max-w-lg mx-auto">{nivel.descricao}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h4 className="font-black text-slate-800 mb-4">Desempenho por Área</h4>
                  {AREAS.map((area) => {
                    const sub = calcularSubtotal(area.id);
                    const pct = Math.round((sub / 12) * 100);
                    return (
                      <div key={area.id} className="mb-4">
                        <div className="flex justify-between text-sm font-bold mb-1"><span className="text-slate-700">{area.nome}</span><span className="text-slate-500">{sub}/12 ({pct}%)</span></div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444" }} /></div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h4 className="font-black text-slate-800 mb-1">Ranking de Áreas para Aprofundamento</h4>
                  <p className="text-sm text-slate-500 font-medium mb-5">As áreas abaixo apresentaram os menores índices e devem ser priorizadas.</p>
                  <div className="space-y-4">
                    {areasOrdenadas().map((area, i) => (
                      <div key={area.id} className={`flex items-center gap-4 p-4 rounded-xl border ${i < 2 ? "border-red-100 bg-red-50" : i < 4 ? "border-yellow-100 bg-yellow-50" : "border-green-100 bg-green-50"}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0 ${i < 2 ? "bg-red-500" : i < 4 ? "bg-yellow-400" : "bg-green-500"}`}>{i + 1}º</div>
                        <div className="flex-1"><div className="font-black text-slate-800">{area.nome}</div><div className="text-xs text-slate-500 font-medium">{area.subtotal}/12 pontos — {area.pct}%</div></div>
                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${i < 2 ? "text-red-600 bg-red-100" : i < 4 ? "text-yellow-700 bg-yellow-100" : "text-green-700 bg-green-100"}`}>{i < 2 ? "Prioritária" : i < 4 ? "Importante" : "Satisfatória"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button onClick={() => setStep("diagnostico")} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#064384] transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_back</span> Voltar</button>
                  <button onClick={() => setStep("melhoria")} className="flex items-center gap-2 h-12 px-8 bg-[#064384] text-white font-black rounded-xl hover:bg-blue-900 transition-all shadow-md">Área de Melhoria <span className="material-symbols-outlined text-[18px]">edit_note</span></button>
                </div>
              </div>
            );
          })()}

          {step === "melhoria" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <h3 className="text-xl font-black text-slate-800 mb-2">Área de Melhoria</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">Registre a leitura do consultor sobre o cliente: objetivos e o que deve parar, continuar e começar a fazer.</p>
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700">Objetivos do Cliente</label>
                    <textarea rows={3} placeholder="O que o cliente espera alcançar com a consultoria..." value={melhoria.objetivosCliente}
                      onChange={(e) => setMelhoria({ ...melhoria, objetivosCliente: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-red-600">Parar de Fazer</label>
                      <textarea rows={5} placeholder="O que deve ser interrompido..." value={melhoria.parar}
                        onChange={(e) => setMelhoria({ ...melhoria, parar: e.target.value })}
                        className="w-full rounded-xl border border-red-100 bg-red-50/40 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:ring-1 focus:ring-red-200 outline-none resize-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-amber-600">Continuar Fazendo</label>
                      <textarea rows={5} placeholder="O que já funciona bem..." value={melhoria.continuar}
                        onChange={(e) => setMelhoria({ ...melhoria, continuar: e.target.value })}
                        className="w-full rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-300 focus:ring-1 focus:ring-amber-200 outline-none resize-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-emerald-600">Começar a Fazer</label>
                      <textarea rows={5} placeholder="O que precisa ser implementado..." value={melhoria.comecar}
                        onChange={(e) => setMelhoria({ ...melhoria, comecar: e.target.value })}
                        className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 outline-none resize-none" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => setStep("resultado")} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#064384] transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_back</span> Voltar</button>
                <button onClick={() => setStep("plano")} className="flex items-center gap-2 h-12 px-8 bg-[#064384] text-white font-black rounded-xl hover:bg-blue-900 transition-all shadow-md">Plano de Ação <span className="material-symbols-outlined text-[18px]">task_alt</span></button>
              </div>
            </div>
          )}

          {step === "plano" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">Plano de Ação</h3>
                    <p className="text-sm text-slate-500 font-medium">Registre as recomendações para o desenvolvimento das competências identificadas.</p>
                  </div>
                  <button type="button" onClick={addPlanoItem} className="flex items-center gap-1.5 text-sm font-bold text-[#064384] hover:bg-blue-50 px-3 py-2 rounded-lg shrink-0">
                    <span className="material-symbols-outlined text-[18px]">add_circle</span> Adicionar
                  </button>
                </div>
                <div className="space-y-6 mt-6">
                  {plano.map((item, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-5 relative">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black text-[#064384] uppercase tracking-wide">Recomendação {i + 1}</span>
                        {plano.length > 1 && (
                          <button type="button" onClick={() => removePlanoItem(i)} title="Remover" className="text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descrição da Recomendação</label>
                          <textarea rows={2} placeholder="Descreva a recomendação..." value={item.descricao}
                            onChange={(e) => updatePlanoItem(i, "descricao", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none resize-none" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Responsável</label>
                            <input value={item.responsavel} onChange={(e) => updatePlanoItem(i, "responsavel", e.target.value)}
                              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prioridade</label>
                            <select value={item.prioridade} onChange={(e) => updatePlanoItem(i, "prioridade", e.target.value)}
                              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none">
                              <option value="Baixa">Baixa</option>
                              <option value="Média">Média</option>
                              <option value="Alta">Alta</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Data de Início</label>
                            <input type="date" value={item.dataInicio} onChange={(e) => updatePlanoItem(i, "dataInicio", e.target.value)}
                              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Data de Término</label>
                            <input type="date" value={item.dataTermino} onChange={(e) => updatePlanoItem(i, "dataTermino", e.target.value)}
                              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Recursos Necessários</label>
                          <input placeholder="Ex: orçamento, treinamento, ferramenta..." value={item.recursos} onChange={(e) => updatePlanoItem(i, "recursos", e.target.value)}
                            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => setStep("melhoria")} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#064384] transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_back</span> Voltar</button>
                <button onClick={() => setStep("relatorio")} className="flex items-center gap-2 h-12 px-8 bg-[#064384] text-white font-black rounded-xl hover:bg-blue-900 transition-all shadow-md">Gerar Relatório <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span></button>
              </div>
            </div>
          )}

          {step === "relatorio" && (() => {
            const total = calcularTotal();
            const nivel = getNivel(total);
            return (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[48px] text-green-500">check_circle</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Diagnóstico Concluído!</h3>
                  <p className="text-slate-600 font-medium mb-6">{ficha.razaoSocial} · {total}/60 pontos · {nivel.nome}</p>
                  <button onClick={gerarPDF} className="flex items-center justify-center gap-2 h-14 px-10 bg-[#064384] text-white font-black rounded-xl hover:bg-blue-900 transition-all shadow-lg mx-auto">
                    <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span> Exportar Relatório PDF
                  </button>
                  <button onClick={() => { setStep("ficha"); setRespostas({}); setMelhoria(MELHORIA_VAZIA); setPlano([{ ...PLANO_ITEM_VAZIO }]); }} className="mt-4 flex items-center justify-center gap-2 h-12 px-8 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all mx-auto">
                    <span className="material-symbols-outlined text-[18px]">refresh</span> Novo Diagnóstico
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
