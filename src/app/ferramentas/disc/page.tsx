"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Interface atualizada com a nova modelagem do banco de dados
interface AvaliacaoDISC {
  cd_avaliacao: string;
  ts_criacao: string;
  nm_empresa: string;
  nm_avaliado: string;
  tp_status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";
  js_respostas: any;
  ds_observacao: string;
}

export default function DiscAdminPage() {
  const router = useRouter();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDISC[]>([]);
  const [loading, setLoading] = useState(true);

  const [novaEmpresa, setNovaEmpresa] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [pdiAtivo, setPdiAtivo] = useState<string | null>(null);
  const [pdiTexto, setPdiTexto] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      const { data } = await supabase
        .from("AVALIACOES_DISC_AVULSO") // Nome novo da tabela
        .select("*")
        .order("ts_criacao", { ascending: false }); // Nova coluna de data

      if (data) setAvaliacoes(data);
      setLoading(false);
    };

    carregarDados();
  }, []);

  const criarNovaAvaliacao = async () => {
    if (!novoNome) return alert("Digite pelo menos o Nome do Avaliado!");
    setIsCreating(true);

    const { data, error } = await supabase
      .from("AVALIACOES_DISC_AVULSO")
      .insert([
        {
          nm_empresa: novaEmpresa || "Avulso",
          nm_avaliado: novoNome,
          // tp_status entra automático como 'PENDENTE' devido ao DEFAULT do banco
        },
      ])
      .select("*")
      .single();

    if (!error && data) {
      setAvaliacoes([data, ...avaliacoes]);
      setNovoNome("");
      copiarLink(data.cd_avaliacao); // Usando a nova chave primária
    } else {
      alert("Erro ao gerar link.");
      console.error(error);
    }
    setIsCreating(false);
  };

  const copiarLink = (id: string) => {
    const link = `${window.location.origin}/pesquisa/disc-avulso/${id}`;
    navigator.clipboard.writeText(link);
    alert(
      "Link público copiado com sucesso!\nEnvie para o candidato/cliente responder.",
    );
  };

  const salvarPDI = async (id: string) => {
    await supabase
      .from("AVALIACOES_DISC_AVULSO")
      .update({ ds_observacao: pdiTexto })
      .eq("cd_avaliacao", id); // Usando a nova chave primária

    setAvaliacoes(
      avaliacoes.map((a) =>
        a.cd_avaliacao === id ? { ...a, ds_observacao: pdiTexto } : a,
      ),
    );
    setPdiAtivo(null);
    alert("Observações (PDI) salvas com sucesso!");
  };

  // Algoritmo Simulado/Básico de Cálculo DISC para o PDF
  const calcularScoresDISC = (respostas: any) => {
    return { D: 65, I: 82, S: 35, C: 40 };
  };

  const gerarPDF = (av: AvaliacaoDISC) => {
    // Validação usando o novo ENUM maiúsculo
    if (av.tp_status !== "CONCLUIDO")
      return alert("A avaliação ainda não foi concluída pelo candidato!");

    const scores = calcularScoresDISC(av.js_respostas);
    const maiorScore = Math.max(scores.D, scores.I, scores.S, scores.C);

    let perfilPrincipal = "";
    let descricaoPerfil = "";

    if (maiorScore === scores.D) {
      perfilPrincipal = "Dominância (Executor)";
      descricaoPerfil =
        "Focado em resultados, direto, competitivo e movido a desafios. Tende a assumir a liderança rapidamente.";
    } else if (maiorScore === scores.I) {
      perfilPrincipal = "Influência (Comunicador)";
      descricaoPerfil =
        "Extrovertido, persuasivo, otimista e focado em pessoas. Excelente em networking e engajamento de equipes.";
    } else if (maiorScore === scores.S) {
      perfilPrincipal = "Estabilidade (Planejador)";
      descricaoPerfil =
        "Calmo, paciente, leal e excelente ouvinte. Gosta de rotinas bem estabelecidas e ambientes harmoniosos.";
    } else {
      perfilPrincipal = "Conformidade (Analista)";
      descricaoPerfil =
        "Preciso, detalhista, lógico e focado em regras e qualidade. Toma decisões baseadas em dados e fatos.";
    }

    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    janela.document.write(`
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { color: #064384; font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; }
            .subtitle { color: #64748b; font-size: 16px; margin-top: 8px; font-weight: 600; }
            
            .perfil-box { background: #f8fafc; border-left: 6px solid #064384; padding: 25px; border-radius: 0 12px 12px 0; margin-bottom: 40px; }
            .perfil-title { font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 800; margin: 0 0 5px 0; }
            .perfil-name { font-size: 32px; color: #0f172a; font-weight: 900; margin: 0 0 10px 0; }
            .perfil-desc { font-size: 16px; color: #475569; margin: 0; }

            .bar-container { margin-bottom: 25px; }
            .bar-header { display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; margin-bottom: 8px; }
            .bar-bg { height: 24px; background: #e2e8f0; border-radius: 12px; overflow: hidden; }
            .bar-fill { height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: bold; font-size: 12px; }
            
            .d-color { color: #ef4444; } .d-bg { background: #ef4444; }
            .i-color { color: #f59e0b; } .i-bg { background: #f59e0b; }
            .s-color { color: #10b981; } .s-bg { background: #10b981; }
            .c-color { color: #3b82f6; } .c-bg { background: #3b82f6; }

            .pdi-box { margin-top: 50px; background: #fff; border: 2px dashed #cbd5e1; padding: 25px; border-radius: 12px; }
            .pdi-title { color: #064384; font-size: 18px; font-weight: 800; margin-top: 0; }
            
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Mapeamento de Perfil DISC</h1>
            <div class="subtitle">Empresa: ${av.nm_empresa} &nbsp;|&nbsp; Avaliado(a): <span style="color:#0f172a;">${av.nm_avaliado}</span></div>
          </div>

          <div class="perfil-box">
            <p class="perfil-title">Perfil Comportamental Predominante</p>
            <h2 class="perfil-name">${perfilPrincipal}</h2>
            <p class="perfil-desc">${descricaoPerfil}</p>
          </div>

          <h3 style="color: #064384; font-size: 20px; font-weight: 900; margin-bottom: 20px;">Intensidade dos Fatores</h3>
          
          <div class="bar-container">
            <div class="bar-header"><span class="d-color">D - Dominância (Foco em Resultados)</span><span>${scores.D}%</span></div>
            <div class="bar-bg"><div class="bar-fill d-bg" style="width: ${scores.D}%;"></div></div>
          </div>
          
          <div class="bar-container">
            <div class="bar-header"><span class="i-color">I - Influência (Foco em Pessoas)</span><span>${scores.I}%</span></div>
            <div class="bar-bg"><div class="bar-fill i-bg" style="width: ${scores.I}%;"></div></div>
          </div>

          <div class="bar-container">
            <div class="bar-header"><span class="s-color">S - Estabilidade (Foco em Processos)</span><span>${scores.S}%</span></div>
            <div class="bar-bg"><div class="bar-fill s-bg" style="width: ${scores.S}%;"></div></div>
          </div>

          <div class="bar-container">
            <div class="bar-header"><span class="c-color">C - Conformidade (Foco em Regras)</span><span>${scores.C}%</span></div>
            <div class="bar-bg"><div class="bar-fill c-bg" style="width: ${scores.C}%;"></div></div>
          </div>

          ${
            av.ds_observacao
              ? `
            <div class="pdi-box">
              <h3 class="pdi-title">Observações do Consultor & Plano de Ação (PDI)</h3>
              <div style="font-size: 15px; color: #334155; white-space: pre-wrap;">${av.ds_observacao}</div>
            </div>
          `
              : ""
          }
          
          <div style="margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">
            Metodologia DISC | Gerado via Consultoria Wallison Branquinho
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
          <div className="size-12 bg-blue-50 text-[#064384] rounded-xl flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychology
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#064384] tracking-tight">
              Mapeamento DISC
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Ferramenta Avulsa de Análise Comportamental
            </p>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8">
          {/* Bloco de Criação */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
            <div>
              <h3 className="font-black text-slate-800 text-lg mb-1">
                Novo Link de Avaliação
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Gere um link público para candidatos ou clientes responderem o
                teste.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Empresa (Opcional)"
                value={novaEmpresa}
                onChange={(e) => setNovaEmpresa(e.target.value)}
                className="px-5 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#064384] focus:ring-1 focus:ring-[#064384] w-full sm:w-48 text-sm font-bold text-slate-700 bg-slate-50"
              />
              <input
                type="text"
                placeholder="Nome do Avaliado"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="px-5 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#064384] focus:ring-1 focus:ring-[#064384] w-full sm:w-64 text-sm font-bold text-slate-700 bg-slate-50"
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

          {/* Grid de Avaliações */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {avaliacoes.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-500 font-bold bg-white rounded-3xl border border-dashed border-slate-300">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                  inbox
                </span>
                <p>Nenhuma avaliação DISC gerada ainda.</p>
              </div>
            ) : (
              avaliacoes.map((av) => (
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
                    {/* Alteração das cores com base no novo ENUM */}
                    <span
                      className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-lg shrink-0 border 
                      ${
                        av.tp_status === "CONCLUIDO"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : av.tp_status === "EM_ANDAMENTO"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-orange-50 text-orange-600 border-orange-100"
                      }`}
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
                      </span>
                      Copiar Link Público
                    </button>
                  ) : (
                    <div className="mt-auto space-y-3 pt-5 border-t border-slate-100">
                      {pdiAtivo === av.cd_avaliacao ? (
                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          <textarea
                            className="w-full text-sm p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#064384] bg-slate-50 resize-none font-medium text-slate-700"
                            rows={4}
                            placeholder="Anotações de entrevista e plano de ação..."
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
                            </span>
                            {av.ds_observacao
                              ? "Editar Anotações"
                              : "Adicionar PDI"}
                          </button>
                          <button
                            onClick={() => gerarPDF(av)}
                            className="w-full bg-[#064384] text-white font-black py-3 rounded-xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 hover:bg-blue-900 active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              picture_as_pdf
                            </span>
                            Gerar Relatório PDF
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
