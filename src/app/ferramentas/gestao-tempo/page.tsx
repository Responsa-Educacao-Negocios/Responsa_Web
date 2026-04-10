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

    // Algoritmo Krausz: soma de SIM e divisão modular por 16
    const pontosPorCategoria = new Array(16).fill(0);
    let totalSIM = 0;

    av.js_respostas.forEach((respostaSim, index) => {
      if (respostaSim) {
        totalSIM++;
        const categoriaIndex = index % 16;
        pontosPorCategoria[categoriaIndex]++;
      }
    });

    // Diagnóstico Global (Extrato do PDF Original)
    let diagGeral = "";
    let corGeral = "";
    if (totalSIM <= 16) {
      diagGeral = "Você administra bem o seu tempo.";
      corGeral = "#059669";
    } else if (totalSIM <= 36) {
      diagGeral =
        "Você administra razoavelmente o seu tempo. Veja as áreas de dificuldades nas quais necessita melhoria.";
      corGeral = "#064384";
    } else if (totalSIM <= 56) {
      diagGeral =
        "Você não administra adequadamente o seu tempo, podendo gerar desperdício do seu próprio tempo e das pessoas com as quais trabalha.";
      corGeral = "#d97706";
    } else if (totalSIM <= 76) {
      diagGeral =
        "Você administra mal o seu tempo. Desperdiça seu próprio tempo e o das pessoas com as quais trabalha.";
      corGeral = "#dc2626";
    } else {
      diagGeral =
        "Você não administra o seu tempo. Tem atuado de acordo com os acontecimentos prejudicando os resultados de seu trabalho e da equipe.";
      corGeral = "#991b1b";
    }

    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    // Linhas de cada Categoria
    const detalhesHTML = CATEGORIAS_TEMPO.map((cat, i) => {
      const pontos = pontosPorCategoria[i];
      let conceito = "BOM";
      let cor = "#059669";
      if (pontos >= 2 && pontos <= 3) {
        conceito = "REGULAR";
        cor = "#d97706";
      }
      if (pontos >= 4) {
        conceito = "NECESSITA DE MELHORIA";
        cor = "#dc2626";
      }

      return `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 12px 0; font-size: 14px;">
          <strong style="width: 55%; color: #334155;">${cat}</strong>
          <span style="width: 15%; text-align: center; color: #64748b;">${pontos} pontos</span>
          <span style="width: 30%; text-align: right; font-weight: 900; color: ${cor};">${conceito}</span>
        </div>`;
    }).join("");

    janela.document.write(`
      <html>
        <head>
          <style>
            body{font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6;}
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1 style="color: #064384; text-align: center; margin-bottom: 5px; font-weight: 900; text-transform: uppercase;">Inventário de Administração do Tempo</h1>
          <h3 style="text-align: center; color: #64748b; margin-top: 0;">Empresa: ${av.nm_empresa} | Avaliado(a): ${av.nm_avaliado}</h3>
          
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 30px; border-radius: 12px; text-align: center; margin: 40px 0;">
            <p style="margin: 0; font-size: 14px; text-transform: uppercase; font-weight: bold; color: #64748b;">Total de 'SIM' (Pontuação Geral)</p>
            <h1 style="font-size: 64px; margin: 10px 0; color: ${corGeral};">${totalSIM} <span style="font-size: 24px; color: #94a3b8;">/ 96</span></h1>
            <p style="font-weight: bold; color: #0f172a; max-width: 700px; margin: 0 auto; font-size: 18px;">${diagGeral}</p>
          </div>

          <h3 style="color: #064384; border-bottom: 2px solid #064384; padding-bottom: 5px; margin-top: 40px; text-transform: uppercase; font-size: 16px;">Análise por Área de Dificuldade</h3>
          <div style="margin-bottom: 30px;">${detalhesHTML}</div>

          ${
            av.ds_observacao
              ? `
            <h3 style="color: #064384; border-bottom: 2px solid #064384; padding-bottom: 5px; margin-top: 40px; text-transform: uppercase; font-size: 16px;">Plano de Desenvolvimento (PDI)</h3>
            <div style="background: #fffbeb; border: 1px dashed #f59e0b; padding: 20px; border-radius: 8px; font-size: 15px; line-height: 1.6; color: #334155;">
              ${av.ds_observacao.replace(/\n/g, "<br/>")}
            </div>
          `
              : ""
          }
          
          <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">
            Metodologia: Rosa R. Krausz | Gerado via Consultoria Wallison Branquinho
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
