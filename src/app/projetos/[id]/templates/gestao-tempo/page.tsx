"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Áreas de Dificuldade da Rosa Krausz [cite: 213]
const CATEGORIAS_TEMPO = [
  "Planejamento do tempo",
  "Administração por crises",
  "Organização pessoal e autodisciplina no trabalho",
  "Comunicação",
  "Tomada de decisões",
  "Diagnóstico de problemas",
  "Delegação",
  "Capacidade de dizer não",
  "Uso do telefone",
  'Delegação "para cima"',
  "Estabelecimento de prioridades",
  "Utilização dos níveis de capacidade do uso do tempo",
  "Perfeccionismo",
  "Objetivos pessoais",
  "Flexibilidade no trabalho",
  "Concentração",
];

interface AvaliacaoTempo {
  id: string;
  created_at: string;
  nm_avaliado: string;
  cd_status: string;
  js_respostas: boolean[];
  ds_observacao: string;
}

export default function GestaoTempoProjetoPage() {
  const router = useRouter();
  const params = useParams();
  const projetoId = params.id as string;

  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoTempo[]>([]);
  const [empresaNome, setEmpresaNome] = useState("");
  const [loading, setLoading] = useState(true);

  const [novoNome, setNovoNome] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [pdiAtivo, setPdiAtivo] = useState<string | null>(null);
  const [pdiTexto, setPdiTexto] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      // 1. Busca o nome da Empresa vinculada a este Projeto
      const { data: projData } = await supabase
        .from("PROJETOS")
        .select("EMPRESAS(nm_fantasia)")
        .eq("cd_projeto", projetoId)
        .maybeSingle();

      if (projData) {
        const nomeEmp = Array.isArray(projData.EMPRESAS)
          ? projData.EMPRESAS[0]?.nm_fantasia
          : projData.EMPRESAS?.nm_fantasia;
        setEmpresaNome(nomeEmp || "Empresa não informada");
      }

      // 2. Busca APENAS as avaliações deste projeto
      const { data: avData } = await supabase
        .from("AVALIACAO_TEMPO")
        .select("*")
        .eq("cd_projeto", projetoId)
        .order("created_at", { ascending: false });

      if (avData) setAvaliacoes(avData);
      setLoading(false);
    };

    carregarDados();
  }, [projetoId]);

  const criarNovaAvaliacao = async () => {
    if (!novoNome) return alert("Digite o Nome do Avaliado!");
    setIsCreating(true);

    const { data, error } = await supabase
      .from("AVALIACAO_TEMPO")
      .insert([{ cd_projeto: projetoId, nm_avaliado: novoNome }])
      .select("*")
      .single();

    if (!error && data) {
      setAvaliacoes([data, ...avaliacoes]);
      setNovoNome("");
      copiarLink(data.id);
    } else {
      alert("Erro ao gerar link.");
      console.error(error);
    }
    setIsCreating(false);
  };

  const copiarLink = (id: string) => {
    const link = `${window.location.origin}/pesquisa/tempo/${id}`;
    navigator.clipboard.writeText(link);
    alert("Link público copiado com sucesso!\nEnvie para o gestor responder.");
  };

  const salvarPDI = async (id: string) => {
    await supabase
      .from("AVALIACAO_TEMPO")
      .update({ ds_observacao: pdiTexto })
      .eq("id", id);
    setAvaliacoes(
      avaliacoes.map((a) =>
        a.id === id ? { ...a, ds_observacao: pdiTexto } : a,
      ),
    );
    setPdiAtivo(null);
    alert("Plano de Desenvolvimento (PDI) salvo!");
  };

  const gerarPDF = (av: AvaliacaoTempo) => {
    if (av.cd_status !== "concluido" || !av.js_respostas)
      return alert("Avaliação não concluída!");

    const pontosPorCategoria = new Array(16).fill(0);
    let totalSIM = 0;

    // A lógica matemática exata do Inventário: a cada 16 perguntas, o ciclo das categorias se repete
    av.js_respostas.forEach((respostaSim: boolean, index: number) => {
      if (respostaSim) {
        totalSIM++;
        const categoriaIndex = index % 16;
        pontosPorCategoria[categoriaIndex]++;
      }
    });

    // Diagnóstico Geral da Rosa Krausz [cite: 207]
    let diagGeral = "";
    if (totalSIM <= 16) diagGeral = "Você administra bem o seu tempo.";
    else if (totalSIM <= 36)
      diagGeral =
        "Você administra razoavelmente o seu tempo. Veja as áreas de dificuldades nas quais necessita melhoria.";
    else if (totalSIM <= 56)
      diagGeral =
        "Você não administra adequadamente o seu tempo, podendo gerar desperdício do seu próprio tempo e das pessoas com as quais trabalha.";
    else if (totalSIM <= 76)
      diagGeral =
        "Você administra mal o seu tempo. Desperdiça seu próprio tempo e o das pessoas com as quais trabalha.";
    else
      diagGeral =
        "Você não administra o seu tempo. Tem atuado de acordo com os acontecimentos prejudicando os resultados de seu trabalho e da equipe.";

    const janela = window.open("", "", "width=1200,height=900");
    if (!janela) return;

    const detalhesHTML = CATEGORIAS_TEMPO.map((cat, i) => {
      const pontos = pontosPorCategoria[i];
      let conceito = "BOM";
      let cor = "#059669"; // 0 a 1 [cite: 210]
      if (pontos >= 2 && pontos <= 3) {
        conceito = "REGULAR";
        cor = "#f97316";
      } // 2 a 3 [cite: 211]
      if (pontos >= 4) {
        conceito = "NECESSITA DE MELHORIA";
        cor = "#dc2626";
      } // 4 a 6 [cite: 212]
      return `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0; font-size: 14px;">
          <strong style="width: 50%; color: #334155;">${cat}</strong>
          <span style="width: 20%; text-align: center;">${pontos} / 6</span>
          <span style="width: 30%; text-align: right; font-weight: bold; color: ${cor};">${conceito}</span>
        </div>`;
    }).join("");

    janela.document.write(`
      <html>
        <head><style>body{font-family: Arial, sans-serif; padding: 40px; color: #1e293b;}</style></head>
        <body>
          <h1 style="color: #064384; text-align: center; margin-bottom: 5px;">Inventário de Administração do Tempo</h1>
          <h3 style="text-align: center; color: #64748b; margin-top: 0;">Empresa: ${empresaNome} | Avaliado: ${av.nm_avaliado}</h3>
          
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; text-transform: uppercase; font-weight: bold; color: #64748b;">Total de SIM (Pontuação Geral)</p>
            <h1 style="font-size: 56px; margin: 10px 0; color: #FF8323;">${totalSIM} <span style="font-size: 24px; color: #94a3b8;">/ 96</span></h1>
            <p style="font-weight: bold; color: #0f172a; max-width: 600px; margin: 0 auto;">${diagGeral}</p>
          </div>

          <h3 style="color: #064384; border-bottom: 2px solid #064384; padding-bottom: 5px; margin-top: 40px;">Análise por Área de Dificuldade</h3>
          <div style="margin-bottom: 30px;">${detalhesHTML}</div>

          ${
            av.ds_observacao
              ? `
            <h3 style="color: #064384; border-bottom: 2px solid #064384; padding-bottom: 5px; margin-top: 40px;">Plano de Desenvolvimento (PDI)</h3>
            <div style="background: #fffbeb; border: 1px dashed #f59e0b; padding: 20px; border-radius: 8px; font-size: 14px; line-height: 1.6;">
              ${av.ds_observacao.replace(/\n/g, "<br/>")}
            </div>
          `
              : ""
          }
          
          <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">
            Metodologia: Rosa Krausz | Gerado via Consultoria Wallison Branquinho
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col pb-20">
      <header className="bg-white/95 backdrop-blur-sm px-6 py-5 border-b border-slate-200 shadow-sm sticky top-0 z-10 w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/projetos/${projetoId}/templates`)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-[#064384] tracking-tight">
              Inventário de Gestão do Tempo
            </h2>
            <p className="text-xs text-[#FF8323] font-bold uppercase tracking-widest">
              {empresaNome}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-6 py-10">
        {/* Bloco de Criação */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">
              Novo Avaliado
            </h3>
            <p className="text-sm text-slate-500">
              Gere um link público exclusivo para um gestor responder as 96
              questões.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Nome do Avaliado"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-[#064384] focus:ring-1 focus:ring-[#064384] w-full sm:w-64 text-sm font-medium"
            />
            <button
              onClick={criarNovaAvaliacao}
              disabled={isCreating}
              className="bg-[#064384] hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap active:scale-95 transition-all shadow-sm"
            >
              {isCreating ? "Gerando..." : "Gerar Link"}
            </button>
          </div>
        </div>

        {/* Grid de Avaliações Deste Projeto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {avaliacoes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
              Nenhum inventário gerado para este projeto ainda.
            </div>
          ) : (
            avaliacoes.map((av) => (
              <div
                key={av.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight pr-2">
                    {av.nm_avaliado}
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-black px-2 py-1 rounded shrink-0 ${av.cd_status === "concluido" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                  >
                    {av.cd_status}
                  </span>
                </div>

                {av.cd_status === "pendente" ? (
                  <button
                    onClick={() => copiarLink(av.id)}
                    className="mt-auto w-full bg-orange-50 text-[#FF8323] border border-orange-200 font-bold py-3 rounded-xl text-sm hover:bg-[#FF8323] hover:text-white transition-all flex justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      content_copy
                    </span>
                    Copiar Link Público
                  </button>
                ) : (
                  <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
                    {pdiAtivo === av.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#064384] bg-slate-50"
                          rows={4}
                          placeholder="Digite as observações e o plano de ação..."
                          value={pdiTexto}
                          onChange={(e) => setPdiTexto(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPdiAtivo(null)}
                            className="w-1/3 bg-slate-100 text-slate-600 font-bold py-2 rounded-lg text-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => salvarPDI(av.id)}
                            className="w-2/3 bg-green-500 text-white font-bold py-2 rounded-lg text-sm"
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
                            setPdiAtivo(av.id);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-colors flex justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit_note
                          </span>
                          {av.ds_observacao ? "Editar PDI" : "Adicionar PDI"}
                        </button>
                        <button
                          onClick={() => gerarPDF(av)}
                          className="w-full bg-[#064384] text-white font-bold py-3 rounded-xl text-sm flex justify-center items-center gap-2 shadow-sm hover:bg-blue-900 active:scale-95 transition-all"
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
      </main>
    </div>
  );
}
