"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AvaliacaoNR1 {
  cd_avaliacao: string;
  ts_criacao: string;
  nm_empresa: string;
  nm_avaliado: string;
  tp_status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";
  js_respostas: Record<string, number>;
  ds_observacao: string;
}

export default function NR1AdminPage() {
  const router = useRouter();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoNR1[]>([]);
  const [loading, setLoading] = useState(true);

  const [novaEmpresa, setNovaEmpresa] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [pdiAtivo, setPdiAtivo] = useState<string | null>(null);
  const [pdiTexto, setPdiTexto] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      const { data } = await supabase
        .from("AVALIACOES_NR1_AVULSO")
        .select("*")
        .order("ts_criacao", { ascending: false });

      if (data) setAvaliacoes(data);
      setLoading(false);
    };
    carregarDados();
  }, []);

  const criarNovaAvaliacao = async () => {
    if (!novoNome)
      return alert("Digite pelo menos o Nome do Avaliado ou Setor!");
    setIsCreating(true);

    const { data, error } = await supabase
      .from("AVALIACOES_NR1_AVULSO")
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
    const link = `${window.location.origin}/pesquisa/nr1-avulso/${id}`;
    navigator.clipboard.writeText(link);
    alert("Link público copiado com sucesso!");
  };

  const salvarPDI = async (id: string) => {
    await supabase
      .from("AVALIACOES_NR1_AVULSO")
      .update({ ds_observacao: pdiTexto })
      .eq("cd_avaliacao", id);
    setAvaliacoes(
      avaliacoes.map((a) =>
        a.cd_avaliacao === id ? { ...a, ds_observacao: pdiTexto } : a,
      ),
    );
    setPdiAtivo(null);
    alert("Observações salvas com sucesso!");
  };

  const gerarPDF = (av: AvaliacaoNR1) => {
    if (av.tp_status !== "CONCLUIDO" || !av.js_respostas)
      return alert("Avaliação não concluída!");

    // CÁLCULO DA PONTUAÇÃO (Max = 60 perguntas * 5 pontos = 300)
    let totalScore = 0;
    Object.values(av.js_respostas).forEach((val) => (totalScore += val));
    const percentual = Math.round((totalScore / 300) * 100);

    // CONFIGURAÇÃO DO RESULTADO (Baseado nos seus textos)
    let config = { nivel: "", cor: "", diag: "", riscos: "", acoes: "" };

    if (percentual <= 40) {
      config = {
        nivel: "RISCO ALTO (Intervenção Imediata)",
        cor: "#dc2626", // Vermelho
        diag: "A organização apresenta alto nível de exposição a riscos psicossociais, evidenciando falhas na identificação, avaliação e controle desses riscos, conforme previsto na NR-1 dentro do Gerenciamento de Riscos Ocupacionais (GRO). Os dados indicam fragilidade na gestão de pessoas, liderança, organização do trabalho e ausência de mecanismos eficazes de prevenção.",
        riscos:
          "<li>Aumento significativo de processos trabalhistas (assédio moral, danos psicológicos)</li><li>Afastamentos por ansiedade, estresse e burnout</li><li>Turnover elevado</li><li>Queda de produtividade e desempenho</li><li>Ambiente propício a conflitos e adoecimento</li>",
        acoes:
          "<b>Liderança:</b> Treinamento urgente em gestão de pessoas e inteligência emocional. Alinhamento de condutas.<br><br><b>Organização do Trabalho:</b> Revisão imediata de metas e carga de trabalho. Redefinição de processos críticos.<br><br><b>Clima e Comunicação:</b> Implantação de canal de denúncia seguro. Diagnóstico aprofundado de clima.<br><br><b>Saúde Mental:</b> Criação de ações emergenciais de apoio psicológico. Campanhas de conscientização.<br><br><b>Benefícios:</b> Implementação de pacote mínimo e ações de valorização.",
      };
    } else if (percentual <= 70) {
      config = {
        nivel: "RISCO MÉDIO (Estruturação e Consistência)",
        cor: "#d97706", // Laranja/Amarelo
        diag: "A organização apresenta nível intermediário de maturidade, com práticas existentes, porém não estruturadas ou monitoradas de forma contínua, o que limita a efetividade do controle dos riscos psicossociais conforme diretrizes da NR-1. Há indícios de inconsistência na liderança, comunicação e gestão organizacional.",
        riscos:
          "<li>Problemas recorrentes de clima organizacional</li><li>Oscilações de desempenho</li><li>Liderança desalinhada</li><li>Riscos psicossociais não controlados de forma contínua</li><li>Dificuldade de sustentação das melhorias</li>",
        acoes:
          "<b>Liderança:</b> Programas contínuos de desenvolvimento de líderes e padronização de feedback.<br><br><b>Gestão e Processos:</b> Criação de plano estruturado de gestão psicossocial e definição clara de responsabilidades.<br><br><b>Indicadores:</b> Implantação de monitoramento (turnover, absenteísmo, clima).<br><br><b>Comunicação:</b> Fortalecimento da comunicação interna e estruturação de canais de escuta.<br><br><b>Benefícios:</b> Ajuste dos benefícios ao perfil da equipe e comunicação clara.",
      };
    } else {
      config = {
        nivel: "RISCO BAIXO (Performance e Evolução)",
        cor: "#059669", // Verde
        diag: "A organização demonstra boa aderência às diretrizes da NR-1, com práticas estruturadas e consistentes de identificação, avaliação e controle dos riscos psicossociais. A gestão apresenta maturidade organizacional e alinhamento entre liderança, processos e bem-estar.",
        riscos:
          "<li>Necessidade de manutenção e evolução contínua</li><li>Monitoramento constante para evitar regressões</li><li>Aperfeiçoamento estratégico contínuo</li>",
        acoes:
          "<b>Liderança:</b> Desenvolvimento de liderança estratégica e cultura de alta performance com equilíbrio.<br><br><b>Cultura Organizacional:</b> Fortalecimento de valores, propósito e programas de engajamento.<br><br><b>Dados e Inteligência:</b> Uso avançado de indicadores para tomada de decisão e análise preditiva.<br><br><b>Benefícios:</b> Personalização de benefícios e programas diferenciados de bem-estar.<br><br><b>Inovação:</b> Implantação de melhoria contínua e benchmarking com empresas de alta performance.",
      };
    }

    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    janela.document.write(`
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { color: #0f172a; font-size: 26px; font-weight: 900; margin: 0; text-transform: uppercase; }
            .subtitle { color: #64748b; font-size: 15px; margin-top: 8px; font-weight: 600; }
            
            .score-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
            .score-title { font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 800; margin: 0 0 5px 0; }
            .score-value { font-size: 64px; font-weight: 900; margin: 0; line-height: 1; color: ${config.cor}; }
            .score-level { font-size: 20px; font-weight: 800; margin: 15px 0 0 0; text-transform: uppercase; color: ${config.cor}; }

            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: 900; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; }
            
            .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
            .alert-box ul { margin: 5px 0 0 0; padding-left: 20px; color: #991b1b; font-weight: 600; font-size: 14px;}
            
            .action-plan { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 12px; font-size: 14.5px; color: #166534; }
            
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Diagnóstico de Riscos Psicossociais (NR-1)</h1>
            <div class="subtitle">Empresa: ${av.nm_empresa} &nbsp;|&nbsp; Avaliado/Setor: <span style="color:#0f172a;">${av.nm_avaliado}</span></div>
          </div>

          <div class="score-box">
            <p class="score-title">Índice de Maturidade & Adequação</p>
            <p class="score-value">${percentual}%</p>
            <p class="score-level">${config.nivel}</p>
          </div>

          <div class="section">
            <h3 class="section-title">Diagnóstico Técnico (Base GRO/NR-1)</h3>
            <p style="font-size: 15px; text-align: justify;">${config.diag}</p>
          </div>

          <div class="alert-box">
            <strong style="color: #991b1b; text-transform: uppercase; font-size: 14px;">${percentual <= 70 ? "⚠️ Principais Riscos Encontrados:" : "⚠️ Pontos de Atenção Contínua:"}</strong>
            <ul>${config.riscos}</ul>
          </div>

          <div class="section">
            <h3 class="section-title">Plano de Ação Recomendado</h3>
            <div class="action-plan">${config.acoes}</div>
          </div>

          ${
            av.ds_observacao
              ? `
            <div class="section" style="margin-top: 40px;">
              <h3 class="section-title">Observações Complementares do Consultor</h3>
              <div style="background: #f8fafc; border: 1px dashed #94a3b8; padding: 20px; border-radius: 8px; font-size: 14px; white-space: pre-wrap;">${av.ds_observacao}</div>
            </div>
          `
              : ""
          }
          
          <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">
            Metodologia NR-1/GRO | Gerado via Consultoria Wallison Branquinho
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
        </body>
      </html>
    `);
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
          <div className="size-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">
              health_and_safety
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#064384] tracking-tight">
              Riscos Psicossociais (NR-1)
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Mapeamento e Gerenciamento (GRO)
            </p>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
            <div>
              <h3 className="font-black text-slate-800 text-lg mb-1">
                Nova Avaliação NR-1
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Gere o link para os líderes ou setores responderem o
                diagnóstico.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Empresa (Opcional)"
                value={novaEmpresa}
                onChange={(e) => setNovaEmpresa(e.target.value)}
                className="px-5 py-3 border border-slate-200 rounded-xl outline-none focus:border-red-600 w-full sm:w-48 text-sm font-bold text-slate-700 bg-slate-50"
              />
              <input
                type="text"
                placeholder="Setor / Avaliado"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="px-5 py-3 border border-slate-200 rounded-xl outline-none focus:border-red-600 w-full sm:w-64 text-sm font-bold text-slate-700 bg-slate-50"
              />
              <button
                onClick={criarNovaAvaliacao}
                disabled={isCreating}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-black text-sm active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
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
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md hover:border-red-200 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg leading-tight">
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
                    className="mt-auto w-full bg-slate-50 text-slate-600 border border-slate-200 font-bold py-3.5 rounded-xl text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex justify-center items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      content_copy
                    </span>{" "}
                    Copiar Link Público
                  </button>
                ) : (
                  <div className="mt-auto space-y-3 pt-5 border-t border-slate-100">
                    {pdiAtivo === av.cd_avaliacao ? (
                      <div className="space-y-3">
                        <textarea
                          className="w-full text-sm p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 bg-slate-50 resize-none font-medium text-slate-700"
                          rows={4}
                          placeholder="Anotações complementares..."
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
                            Salvar
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
                          {av.ds_observacao
                            ? "Editar Observações"
                            : "Adicionar Notas"}
                        </button>
                        <button
                          onClick={() => gerarPDF(av)}
                          className="w-full bg-red-600 text-white font-black py-3 rounded-xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-red-900/20 hover:bg-red-700 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            picture_as_pdf
                          </span>{" "}
                          Gerar Relatório PDF
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
