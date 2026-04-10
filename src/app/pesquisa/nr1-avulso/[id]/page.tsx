"use client";

import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const BLOCOS_NR1 = [
  {
    id: "B1",
    titulo: "Liderança",
    perguntas: [
      "A definição de metas ocorre de forma equilibrada, considerando a capacidade real da equipe, ou há pressão excessiva que gera estresse?",
      "Os colaboradores possuem clareza sobre suas responsabilidades, metas e expectativas no dia a dia?",
      "Os líderes realizam feedbacks estruturados, frequentes e construtivos, ou apenas apontam erros?",
      "Os líderes demonstram preparo emocional para lidar com conflitos, pressão e gestão de pessoas?",
      "Existe tratamento justo e isonômico entre os colaboradores ou há sinais de favoritismo?",
      "Os colaboradores se sentem seguros para expressar opiniões, dúvidas ou erros sem medo de punição?",
      "A liderança atua mais como suporte ou como fonte de pressão constante?",
    ],
  },
  {
    id: "B2",
    titulo: "Fatores de Risco Psicossocial",
    perguntas: [
      "A carga de trabalho é compatível com o tempo disponível ou há sobrecarga frequente?",
      "Há recorrência de horas extras ou jornadas prolongadas além do previsto?",
      "Os colaboradores possuem autonomia para executar suas atividades ou há excesso de controle?",
      "Existe reconhecimento pelo trabalho realizado (financeiro ou não)?",
      "Há conflitos frequentes entre colaboradores ou equipes?",
      "Existem comportamentos que podem caracterizar assédio moral (pressão excessiva, exposição, constrangimento)?",
      "As metas e cobranças são realistas ou frequentemente inatingíveis?",
      "Os colaboradores relatam sensação constante de pressão ou esgotamento?",
    ],
  },
  {
    id: "B3",
    titulo: "Organização do Trabalho",
    perguntas: [
      "Os processos de trabalho são claros, definidos e padronizados ou há improvisação constante?",
      "Existe retrabalho frequente devido a falhas de comunicação ou execução?",
      "As atividades possuem fluxos organizados ou há desorganização operacional?",
      "A comunicação entre setores funciona de forma eficiente ou gera ruídos e conflitos?",
      "Mudanças na empresa são planejadas e comunicadas ou ocorrem de forma abrupta?",
      "Os colaboradores sabem exatamente como executar suas atividades ou aprendem 'no erro'?",
    ],
  },
  {
    id: "B4",
    titulo: "Clima Organizacional",
    perguntas: [
      "Existe um ambiente de confiança entre colaboradores e liderança?",
      "Os colaboradores sentem que podem dialogar abertamente com seus gestores?",
      "Há liberdade para opinar sem medo de represálias?",
      "Existem conflitos não resolvidos que impactam o ambiente?",
      "O ambiente é mais colaborativo ou competitivo de forma prejudicial?",
      "Os colaboradores demonstram satisfação ou desmotivação no trabalho?",
    ],
  },
  {
    id: "B5",
    titulo: "Comunicação e Canais",
    perguntas: [
      "Existe um canal formal para denúncias ou relatos de problemas?",
      "Os colaboradores confiam nesse canal ou têm receio de utilizá-lo?",
      "As denúncias ou problemas relatados são investigados e resolvidos?",
      "A comunicação da empresa é clara, transparente e acessível?",
      "Informações importantes chegam a todos os colaboradores?",
      "Existe retorno (feedback institucional) sobre decisões e mudanças?",
    ],
  },
  {
    id: "B6",
    titulo: "Indicadores (Dados Reais)",
    perguntas: [
      "A empresa monitora e analisa índices de absenteísmo?",
      "Há controle sobre afastamentos por motivos de saúde mental?",
      "O turnover é acompanhado e analisado estrategicamente?",
      "A empresa mede produtividade de forma estruturada?",
      "Os dados coletados são utilizados para tomada de decisão?",
      "Existem relatórios ou indicadores periódicos sobre pessoas?",
    ],
  },
  {
    id: "B7",
    titulo: "Prevenção",
    perguntas: [
      "A empresa realiza ações voltadas ao bem-estar dos colaboradores?",
      "Existem treinamentos sobre saúde mental, comportamento ou liderança?",
      "Essas ações são contínuas ou acontecem apenas pontualmente?",
      "Existe algum tipo de suporte psicológico ou orientação emocional?",
      "A empresa possui política formal relacionada à saúde mental e bem-estar?",
      "Há ações preventivas ou apenas corretivas?",
    ],
  },
  {
    id: "B8",
    titulo: "Maturidade Organizacional",
    perguntas: [
      "A empresa realiza pesquisa de clima organizacional com frequência?",
      "Os resultados dessas pesquisas são analisados e utilizados?",
      "Existe um plano estruturado para melhoria do ambiente de trabalho?",
      "A liderança participa ativamente das ações de melhoria?",
      "A empresa demonstra evolução ou repete os mesmos problemas?",
      "Existe cultura de melhoria contínua?",
    ],
  },
  {
    id: "B9",
    titulo: "Benefícios e Suporte",
    perguntas: [
      "A empresa oferece plano de saúde acessível e adequado?",
      "Oferece plano odontológico ou benefícios similares?",
      "Possui benefícios adicionais (vale alimentação, bônus, incentivos)?",
      "Os benefícios oferecidos são compatíveis com o mercado?",
      "Os colaboradores percebem valor real nesses benefícios?",
      "Existe apoio voltado à saúde mental (interno ou externo)?",
      "A empresa promove ações de qualidade de vida (eventos, campanhas, etc.)?",
      "Existe flexibilidade de jornada ou alternativas de trabalho?",
      "A empresa reconhece e valoriza os colaboradores de forma clara?",
    ],
  },
];

const ESCALA = [
  { v: 0, l: "Não existe" },
  { v: 1, l: "Informal" },
  { v: 2, l: "Parcial" },
  { v: 3, l: "Implementado" },
  { v: 4, l: "Monitorado" },
  { v: 5, l: "Otimizado" },
];

export default function PesquisaNR1Publica() {
  const params = useParams();
  const [avaliado, setAvaliado] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorNotFound, setErrorNotFound] = useState(false);

  const [currentBlock, setCurrentBlock] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const buscarAvaliado = async () => {
      const { data, error } = await supabase
        .from("AVALIACOES_NR1_AVULSO")
        .select("*")
        .eq("cd_avaliacao", params.id)
        .maybeSingle();

      if (error || !data) {
        setErrorNotFound(true);
        setLoading(false);
        return;
      }

      setAvaliado(data);
      if (data.js_respostas && Object.keys(data.js_respostas).length > 0) {
        setRespostas(data.js_respostas);
      }
      setLoading(false);
    };
    buscarAvaliado();
  }, [params.id]);

  const marcarResposta = (chave: string, valor: number) => {
    setRespostas((prev) => ({ ...prev, [chave]: valor }));
  };

  const proximoBloco = async () => {
    // Salva o progresso no banco a cada mudança de bloco
    await supabase
      .from("AVALIACOES_NR1_AVULSO")
      .update({
        tp_status: "EM_ANDAMENTO",
        js_respostas: respostas,
      })
      .eq("cd_avaliacao", params.id);

    window.scrollTo(0, 0);
    setCurrentBlock((curr) => curr + 1);
  };

  const enviarPesquisa = async () => {
    setIsSaving(true);
    try {
      await supabase
        .from("AVALIACOES_NR1_AVULSO")
        .update({
          tp_status: "CONCLUIDO",
          js_respostas: respostas,
        })
        .eq("cd_avaliacao", params.id);

      setAvaliado({ ...avaliado, tp_status: "CONCLUIDO" });
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-red-600 animate-pulse">
        Carregando...
      </div>
    );
  if (errorNotFound)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Link Inválido</h1>
        <p className="text-slate-500 text-center">
          Verifique se o link está correto.
        </p>
      </div>
    );

  if (avaliado.tp_status === "CONCLUIDO") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="size-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
          <span className="material-symbols-outlined text-4xl">
            check_circle
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">
          Diagnóstico Concluído!
        </h1>
        <p className="text-slate-500 max-w-md">
          A avaliação de <b>{avaliado.nm_avaliado}</b> foi registrada com
          sucesso e os dados já foram enviados para análise.
        </p>
      </div>
    );
  }

  const blocoAtual = BLOCOS_NR1[currentBlock];
  // Verifica se todas as perguntas do bloco atual foram respondidas
  const todasRespondidasNoBloco = blocoAtual.perguntas.every(
    (_, i) => respostas[`${blocoAtual.id}_${i}`] !== undefined,
  );
  const progresso = Math.round((Object.keys(respostas).length / 60) * 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
        <div
          className="h-full bg-red-600 transition-all duration-300"
          style={{ width: `${progresso}%` }}
        ></div>
      </div>

      <header className="bg-white border-b border-slate-200 p-6 text-center sticky top-1.5 z-40 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 tracking-tight">
          Riscos Psicossociais (NR-1)
        </h2>
        <div className="mt-2 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-widest font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
            {avaliado.nm_empresa} - {avaliado.nm_avaliado}
          </span>
        </div>

        {/* Lenda da Escala (Ajuda visual constante) */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {ESCALA.map((e) => (
            <div
              key={e.v}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500"
            >
              <span className="bg-slate-200 text-slate-700 px-1.5 rounded">
                {e.v}
              </span>{" "}
              {e.l}
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 mt-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-black">
            {currentBlock + 1}
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {blocoAtual.titulo}
          </h3>
        </div>

        {blocoAtual.perguntas.map((pergunta, index) => {
          const key = `${blocoAtual.id}_${index}`;
          const valorSelecionado = respostas[key];

          return (
            <div
              key={key}
              className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4"
            >
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                {pergunta}
              </p>

              <div className="flex flex-wrap gap-2">
                {ESCALA.map((item) => {
                  const isSelected = valorSelecionado === item.v;
                  return (
                    <button
                      key={item.v}
                      onClick={() => marcarResposta(key, item.v)}
                      className={`flex-1 min-w-[40px] py-3 rounded-xl font-black text-lg transition-all border-2
                        ${
                          isSelected
                            ? "bg-red-600 border-red-600 text-white shadow-md scale-105"
                            : "bg-slate-50 border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500"
                        }`}
                    >
                      {item.v}
                    </button>
                  );
                })}
              </div>

              {/* Mostra o significado do número quando selecionado para reforço */}
              {valorSelecionado !== undefined && (
                <div className="text-right text-[11px] font-bold text-red-600 uppercase tracking-widest animate-in fade-in">
                  Selecionado: {ESCALA.find((e) => e.v === valorSelecionado)?.l}
                </div>
              )}
            </div>
          );
        })}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-sm border-t border-slate-200 p-4 px-6 flex justify-between gap-4 z-50">
        <button
          onClick={() => {
            window.scrollTo(0, 0);
            setCurrentBlock((c) => c - 1);
          }}
          disabled={currentBlock === 0}
          className="px-6 py-4 font-bold text-slate-500 disabled:opacity-30 uppercase text-xs tracking-widest"
        >
          Voltar
        </button>

        {currentBlock < BLOCOS_NR1.length - 1 ? (
          <button
            onClick={proximoBloco}
            disabled={!todasRespondidasNoBloco}
            className="flex-1 max-w-sm bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg disabled:opacity-50 disabled:bg-slate-300 transition-all"
          >
            Próximo Bloco
          </button>
        ) : (
          <button
            onClick={enviarPesquisa}
            disabled={!todasRespondidasNoBloco || isSaving}
            className="flex-1 max-w-sm bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? "Processando..." : "Finalizar Diagnóstico"}
          </button>
        )}
      </div>
    </div>
  );
}
