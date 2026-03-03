"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// --- METODOLOGIA: GESTÃO DE PESSOAS 360º ---
const DOMINIOS = [
  {
    id: "lideranca",
    titulo: "Liderança",
    icon: "engineering",
    perguntas: [
      "Meu líder demonstra respeito no trato com a equipe.",
      "Recebo orientações claras sobre minhas atividades.",
      "Meu líder dá feedbacks construtivos.",
      "Meu líder reconhece bons resultados.",
      "Posso conversar com meu líder quando tenho dificuldades.",
      "As decisões da liderança são justas.",
      "Sinto confiança na liderança da empresa.",
    ],
  },
  {
    id: "comunicac",
    titulo: "Comunicação",
    icon: "forum",
    perguntas: [
      "As informações importantes chegam até mim com clareza.",
      "Existe transparência nas decisões da empresa.",
      "Sei o que a empresa espera de mim.",
      "A comunicação entre setores funciona bem.",
      "Tenho espaço para dar sugestões.",
      "Mudanças são comunicadas com antecedência.",
    ],
  },
  {
    id: "reconhecir",
    titulo: "Reconhecimento",
    icon: "workspace_premium",
    perguntas: [
      "Meu esforço é valorizado.",
      "Existe reconhecimento por bom desempenho.",
      "As promoções seguem critérios claros.",
      "O salário é compatível com minha função.",
      "Sinto que meu trabalho é importante para a empresa.",
      "A empresa demonstra valorização pelos colaboradores.",
    ],
  },
  {
    id: "desenvolvi",
    titulo: "Desenvolvimento",
    icon: "trending_up",
    perguntas: [
      "Tenho oportunidades de crescimento.",
      "Recebo treinamentos quando necessário.",
      "A empresa investe no desenvolvimento da equipe.",
      "Tenho clareza sobre como posso evoluir profissionalmente aqui.",
      "Recebo orientações para melhorar meu desempenho.",
      "Sinto que estou aprendendo coisas novas.",
    ],
  },
  {
    id: "ambiente",
    titulo: "Ambiente de Trabalho",
    icon: "emoji_nature",
    perguntas: [
      "O ambiente físico é adequado.",
      "Existe respeito entre colegas.",
      "O clima entre os setores é positivo.",
      "Há cooperação entre a equipe.",
      "Conflitos são resolvidos de forma adequada.",
      "Sinto segurança no ambiente de trabalho.",
    ],
  },
  {
    id: "engajamen",
    titulo: "Engajamento",
    icon: "favorite",
    perguntas: [
      "Tenho orgulho de trabalhar nesta empresa.",
      "Recomendo esta empresa como um bom lugar para trabalhar.",
      "Sinto motivação para entregar bons resultados.",
      "Pretendo permanecer na empresa nos próximos anos.",
      "A empresa me inspira a dar o meu melhor.",
      "Sinto que faço parte de algo importante.",
    ],
  },
];

const PERGUNTAS_ABERTAS = [
  { id: "q1", label: "O que a empresa faz muito bem?" },
  { id: "q2", label: "O que precisa melhorar com urgência?" },
  { id: "q3", label: "O que faria você se sentir mais valorizado?" },
];

export default function PesquisaClimaPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [empresaNome, setEmpresaNome] = useState("");
  const [projetoValido, setProjetoValido] = useState(false);

  // Controle de Telas (0 = Intro, 1 a 6 = Domínios, 7 = Abertas, 8 = Sucesso)
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Estados das Respostas
  const [respostasQuant, setRespostasQuant] = useState<Record<string, number>>(
    {},
  );
  const [respostasQuali, setRespostasQuali] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const validarProjeto = async () => {
      try {
        const projetoId = params.id as string;

        // Verifica se o projeto existe e se a pesquisa está ATIVA
        const { data: proj } = await supabase
          .from("PROJETOS")
          .select("EMPRESAS(nm_fantasia)")
          .eq("cd_projeto", projetoId)
          .single();

        if (proj) {
          const empresa = Array.isArray(proj.EMPRESAS)
            ? proj.EMPRESAS[0]
            : proj.EMPRESAS;
          setEmpresaNome(empresa?.nm_fantasia || "a Empresa");
          setProjetoValido(true);

          // Inicializa todas as respostas quantitativas com 50% (Neutro)
          const iniciais: Record<string, number> = {};
          DOMINIOS.forEach((d) => {
            d.perguntas.forEach((_, i) => {
              iniciais[`${d.id}_${i}`] = 50;
            });
          });
          setRespostasQuant(iniciais);
        }
      } catch (error) {
        console.error("Erro ao validar:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) validarProjeto();
  }, [params.id]);

  const handleSliderChange = (
    dominioId: string,
    perguntaIndex: number,
    valor: number,
  ) => {
    setRespostasQuant((prev) => ({
      ...prev,
      [`${dominioId}_${perguntaIndex}`]: valor,
    }));
  };

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep((curr) => curr + 1);
  };

  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep((curr) => curr - 1);
  };

  const finalizarPesquisa = async () => {
    setIsSaving(true);
    const projetoId = params.id as string;

    // Calcula a média de cada domínio para salvar no banco exatamente como o Relatório espera
    const medias: Record<string, number> = {};
    DOMINIOS.forEach((d) => {
      let soma = 0;
      d.perguntas.forEach((_, i) => {
        soma += respostasQuant[`${d.id}_${i}`] || 50;
      });
      medias[d.id] = Math.round(soma / d.perguntas.length);
    });

    const payload = {
      cd_projeto: projetoId,
      nr_lideranca: medias["lideranca"],
      nr_comunicac: medias["comunicac"],
      nr_reconhecir: medias["reconhecir"],
      nr_desenvolvi: medias["desenvolvi"],
      nr_ambiente: medias["ambiente"],
      nr_engajamen: medias["engajamen"],
      js_respostas_abertas: respostasQuali,
    };

    try {
      const { error } = await supabase
        .from("RESPOSTAS_INDIVIDUAIS_CLIMA")
        .insert([payload]);
      if (error) throw error;

      setCurrentStep(8); // Tela de Sucesso
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Houve um erro ao enviar sua pesquisa. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#064384] font-bold animate-pulse">
        Carregando pesquisa...
      </div>
    );
  }

  if (!projetoValido) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-red-500 font-bold">
        Link de pesquisa inválido ou expirado.
      </div>
    );
  }

  // --- TELA DE SUCESSO ---
  if (currentStep === 8) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
          <span className="material-symbols-outlined text-4xl">
            check_circle
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">
          Pesquisa Concluída!
        </h1>
        <p className="text-slate-500 max-w-md">
          Suas respostas foram enviadas com sucesso de forma 100% anônima.
          Agradecemos sua sinceridade, ela é fundamental para melhorarmos nosso
          ambiente.
        </p>
      </div>
    );
  }

  // --- TELA DE INTRODUÇÃO ---
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] font-sans flex flex-col">
        <header className="bg-[#064384] text-white p-6 text-center shadow-md">
          <h1 className="text-xl font-black uppercase tracking-widest">
            Pesquisa de Clima
          </h1>
          <p className="text-blue-200 text-sm font-medium mt-1">
            {empresaNome}
          </p>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 text-center border border-slate-200">
            <div className="size-16 bg-blue-50 text-[#064384] mx-auto rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">
                psychology_alt
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4">
              Sua voz importa.
            </h2>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Esta pesquisa é{" "}
              <strong className="text-slate-800">100% anônima</strong> e tem
              como objetivo melhorar o nosso ambiente de trabalho.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl mb-8 text-left border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Como responder:
              </p>
              <ul className="text-sm text-slate-600 space-y-2 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-black">0%</span> Totalmente
                  insatisfeito
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-orange-500 font-black">50%</span> Neutro
                  (Nem sim, nem não)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-black">100%</span>{" "}
                  Totalmente satisfeito
                </li>
              </ul>
            </div>
            <button
              onClick={handleNext}
              className="w-full bg-[#FF8323] hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              Começar Agora{" "}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- TELAS DOS DOMÍNIOS (1 a 6) ---
  if (currentStep >= 1 && currentStep <= 6) {
    const dominioIndex = currentStep - 1;
    const dominio = DOMINIOS[dominioIndex];
    const progresso = (currentStep / 7) * 100;

    return (
      <div className="min-h-screen bg-[#F1F5F9] font-sans flex flex-col pb-24">
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
          <div
            className="h-full bg-[#FF8323] transition-all duration-500"
            style={{ width: `${progresso}%` }}
          ></div>
        </div>

        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 sticky top-1.5 z-40 shadow-sm">
          <div className="size-10 bg-blue-50 text-[#064384] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined">{dominio.icon}</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Domínio {currentStep} de 6
            </p>
            <h2 className="text-lg font-black text-slate-800">
              {dominio.titulo}
            </h2>
          </div>
        </header>

        <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6 mt-4">
          {dominio.perguntas.map((pergunta, index) => {
            const val = respostasQuant[`${dominio.id}_${index}`];
            let corBarra = "accent-[#FF8323]"; // Laranja (Neutro)
            if (val < 40) corBarra = "accent-red-500"; // Crítico
            if (val >= 70) corBarra = "accent-green-500"; // Positivo

            return (
              <div
                key={index}
                className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5"
              >
                <p className="text-sm sm:text-base font-bold text-slate-700">
                  {pergunta}
                </p>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl font-black text-[#064384]">
                      {val}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={val}
                    onChange={(e) =>
                      handleSliderChange(
                        dominio.id,
                        index,
                        parseInt(e.target.value),
                      )
                    }
                    className={`w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer ${corBarra}`}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                    <span>Insatisfeito</span>
                    <span>Neutro</span>
                    <span>Satisfeito</span>
                  </div>
                </div>
              </div>
            );
          })}
        </main>

        {/* Rodapé Flutuante de Navegação */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 px-6 flex justify-between items-center z-50">
          <button
            onClick={handlePrev}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleNext}
            className="bg-[#064384] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
          >
            Próximo{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    );
  }

  // --- TELA DE PERGUNTAS ABERTAS (Passo 7) ---
  if (currentStep === 7) {
    const progresso = 100;
    return (
      <div className="min-h-screen bg-[#F1F5F9] font-sans flex flex-col pb-24">
        <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progresso}%` }}
          ></div>
        </div>

        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 sticky top-1.5 z-40 shadow-sm">
          <div className="size-10 bg-orange-50 text-[#FF8323] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined">edit_note</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Etapa Final
            </p>
            <h2 className="text-lg font-black text-slate-800">Sua Opinião</h2>
          </div>
        </header>

        <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6 mt-4">
          <div className="bg-blue-50 text-[#064384] p-4 rounded-xl text-sm font-medium border border-blue-100">
            Responda com suas próprias palavras. Sinta-se à vontade para não
            responder caso não queira.
          </div>

          {PERGUNTAS_ABERTAS.map((pergunta) => (
            <div
              key={pergunta.id}
              className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3"
            >
              <label className="text-sm font-bold text-slate-700">
                {pergunta.label}
              </label>
              <textarea
                rows={3}
                placeholder="Escreva sua resposta aqui..."
                value={respostasQuali[pergunta.id] || ""}
                onChange={(e) =>
                  setRespostasQuali({
                    ...respostasQuali,
                    [pergunta.id]: e.target.value,
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-[#FF8323]/50 transition-all text-sm resize-none"
              ></textarea>
            </div>
          ))}
        </main>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 px-6 flex justify-between items-center z-50">
          <button
            onClick={handlePrev}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={finalizarPesquisa}
            disabled={isSaving}
            className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <span className="material-symbols-outlined animate-spin text-sm">
                sync
              </span>
            ) : (
              <span className="material-symbols-outlined text-sm">
                check_circle
              </span>
            )}
            Finalizar
          </button>
        </div>
      </div>
    );
  }

  return null;
}
