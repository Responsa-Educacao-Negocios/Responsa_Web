"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// LISTA COMPLETA DE 50 PERGUNTAS EXTRAÍDAS DO CSV [cite: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]
const discQuestions = [
  // PARTE 1: PERFIL NATURAL (1-25) [cite: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]
  { id: 1, words: ["FOCADO", "ARTICULADO", "COMPREENSIVO", "CUIDADOSO"] },
  { id: 2, words: ["PODEROSO", "ESPONTÂNEO", "TOLERANTE", "DETALHISTA"] },
  { id: 3, words: ["COMPETITIVO", "AMIGÁVEL", "COLABORADOR", "PRECAVIDO"] },
  { id: 4, words: ["DIRETO", "VISIONÁRIO", "PACIENTE", "LÓGICO"] },
  { id: 5, words: ["INOVADOR", "ENTUSIASMADO", "PREVISÍVEL", "DISCIPLINADO"] },
  { id: 6, words: ["OBJETIVO", "EXPRESSIVO", "SENSÍVEL", "ATENTO"] },
  { id: 7, words: ["ASSERTIVO", "SOCIÁVEL", "CONFIÁVEL", "CAUTELOSO"] },
  { id: 8, words: ["AMBICIOSO", "CARISMÁTICO", "HARMONIOSO", "OBSERVADOR"] },
  { id: 9, words: ["AUTOCONFIANTE", "CRIATIVO", "TRANQUILO", "INVESTIGATIVO"] },
  { id: 10, words: ["INDEPENDENTE", "ALEGRE", "CONSERVADOR", "CRITERIOSO"] },
  { id: 11, words: ["DETERMINADO", "EXTROVERTIDO", "GENEROSO", "DESCONFIADO"] },
  { id: 12, words: ["PERSUASIVO", "DINÂMICO", "CALMO", "PERFECCIONISTA"] },
  { id: 13, words: ["ENERGÉTICO", "ENVOLVENTE", "COMPANHEIRO", "TÉCNICO"] },
  { id: 14, words: ["DESAFIADOR", "INSPIRADOR", "HUMILDE", "CRÍTICO"] },
  { id: 15, words: ["PIONEIRO", "MOTIVADOR", "ESTÁVEL", "SISTEMÁTICO"] },
  { id: 16, words: ["FIRME", "COMUNICATIVO", "APOIADOR", "IMERSO"] },
  { id: 17, words: ["DECIDIDO", "OTIMISTA", "SENSATO", "PRECISO"] },
  { id: 18, words: ["AGRESSIVO", "CATIVANTE", "LEAL", "RESERVADO"] },
  { id: 19, words: ["AUTÔNOMO", "PERSPICAZ", "GENTIL", "SÁBIO"] },
  { id: 20, words: ["INCISIVO", "ANIMADO", "DIPLOMÁTICO", "ESTRATÉGICO"] },
  { id: 21, words: ["CONTROLADOR", "CONVINCENTE", "AMOROSO", "ENVOLVIDO"] },
  { id: 22, words: ["DESENVOLVEDOR", "FLEXÍVEL", "PONDERADO", "MINUCIOSO"] },
  { id: 23, words: ["CONFRONTADOR", "POLÍTICO", "AGRADÁVEL", "EQUILIBRADO"] },
  { id: 24, words: ["IMPONENTE", "IDEALISTA", "PACÍFICO", "PROCESSUAL"] },
  { id: 25, words: ["AUDACIOSO", "EXAGERADO", "CONSISTENTE", "EXATO"] },

  // PARTE 2: PERCEPÇÃO EXTERNA (26-50) [cite: 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 124]
  { id: 26, words: ["DESCONFIADO", "EXTROVERTIDO", "DETERMINADO", "GENEROSO"] },
  { id: 27, words: ["PERFECCIONISTA", "DINÂMICO", "PERSUASIVO", "CALMO"] },
  { id: 28, words: ["TÉCNICO", "ENVOLVENTE", "ENERGÉTICO", "COMPANHEIRO"] },
  { id: 29, words: ["CRÍTICO", "INSPIRADOR", "DESAFIADOR", "HUMILDE"] },
  { id: 30, words: ["SISTEMÁTICO", "MOTIVADOR", "PIONEIRO", "ESTÁVEL"] },
  { id: 31, words: ["ENVOLVIDO", "CONVINCENTE", "CONTROLADOR", "AMOROSO"] },
  { id: 32, words: ["MINUCIOSO", "FLEXÍVEL", "DESENVOLVEDOR", "PONDERADO"] },
  { id: 33, words: ["EQUILIBRADO", "POLÍTICO", "CONFRONTADOR", "AGRADÁVEL"] },
  { id: 34, words: ["PROCESSUAL", "IDEALISTA", "IMPONENTE", "PACÍFICO"] },
  { id: 35, words: ["EXATO", "EXAGERADO", "AUDACIOSO", "CONSISTENTE"] },
  { id: 36, words: ["CUIDADOSO", "ARTICULADO", "FOCADO", "COMPREENSIVO"] },
  { id: 37, words: ["DETALHISTA", "ESPONTÂNEO", "PODEROSO", "TOLERANTE"] },
  { id: 38, words: ["PRECAVIDO", "AMIGÁVEL", "COMPETITIVO", "COLABORADOR"] },
  { id: 39, words: ["LÓGICO", "VISIONÁRIO", "DIRETO", "PACIENTE"] },
  { id: 40, words: ["DISCIPLINADO", "ENTUSIASMADO", "INOVADOR", "PREVISÍVEL"] },
  { id: 41, words: ["IMERSO", "COMUNICATIVO", "FIRME", "APOIADOR"] },
  { id: 42, words: ["PRECISO", "OTIMISTA", "DECIDIDO", "SENSATO"] },
  { id: 43, words: ["RESERVADO", "CATIVANTE", "AGRESSIVO", "LEAL"] },
  { id: 44, words: ["SÁBIO", "PERSPICAZ", "AUTÔNOMO", "GENTIL"] },
  { id: 45, words: ["ESTRATÉGICO", "ANIMADO", "INCISIVO", "DIPLOMÁTICO"] },
  { id: 46, words: ["ATENTO", "EXPRESSIVO", "OBJETIVO", "SENSÍVEL"] },
  { id: 47, words: ["CAUTELOSO", "SOCIÁVEL", "ASSERTIVO", "CONFIÁVEL"] },
  { id: 48, words: ["OBSERVADOR", "CARISMÁTICO", "AMBICIOSO", "HARMONIOSO"] },
  {
    id: 49,
    words: ["INVESTIGATIVO", "CRIATIVO", "AUTOCONFIANTE", "TRANQUILO"],
  },
  { id: 50, words: ["CRITERIOSO", "ALEGRE", "INDEPENDENTE", "CONSERVADOR"] },
];

export default function PesquisaDiscPage() {
  const params = useParams();
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [funcionario, setFuncionario] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorNotFound, setErrorNotFound] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const [answers, setAnswers] = useState<
    Record<number, Record<string, number>>
  >({});

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from("FUNCIONARIOS")
        .select("nm_completo, cd_empresa, js_pontuacao_disc")
        .eq("cd_funcionario", params.id)
        .maybeSingle();

      if (error || !data) {
        setErrorNotFound(true);
        return;
      }

      setFuncionario(data);
      if (data.js_pontuacao_disc?.respostas_brutas) {
        setAnswers(data.js_pontuacao_disc.respostas_brutas);
        const answeredSteps = Object.keys(
          data.js_pontuacao_disc.respostas_brutas,
        ).length;
        if (answeredSteps > 0) setIsStarted(true); // Se já começou, pula a tela inicial
        if (answeredSteps < discQuestions.length) {
          setCurrentStep(answeredSteps);
        }
      }
    };
    if (params.id) fetchUser();
  }, [params.id]);

  const currentGroup = discQuestions[currentStep];
  const currentAnswers = answers[currentGroup?.id] || {};

  const handleSelect = (word: string, rank: number) => {
    const newAnswers = { ...currentAnswers };
    Object.keys(newAnswers).forEach((key) => {
      if (newAnswers[key] === rank) delete newAnswers[key];
    });
    newAnswers[word] = rank;
    setAnswers({ ...answers, [currentGroup.id]: newAnswers });
  };

  const canGoNext = Object.keys(currentAnswers).length === 4;

  const handleNext = async () => {
    if (!canGoNext) return;
    setIsSaving(true);

    try {
      await supabase
        .from("FUNCIONARIOS")
        .update({
          js_pontuacao_disc: {
            ...(funcionario.js_pontuacao_disc || {}),
            respostas_brutas: answers,
          },
        })
        .eq("cd_funcionario", params.id);

      if (currentStep === 24) {
        setShowTransition(true);
      } else if (currentStep < discQuestions.length - 1) {
        setCurrentStep((curr) => curr + 1);
      } else {
        alert("Análise finalizada com sucesso!");
        router.push("/sucesso");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((curr) => curr - 1);
  };

  if (errorNotFound)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4 uppercase">
          Link Inválido
        </h1>
        <p className="text-slate-500 font-medium">
          Não encontramos os dados para este acesso. Por favor, verifique o link
          enviado.
        </p>
      </div>
    );

  if (!funcionario)
    return (
      <div className="min-h-screen flex items-center justify-center text-primary font-bold animate-pulse uppercase tracking-widest">
        Carregando...
      </div>
    );

  // TELA DE BOAS-VINDAS E INSTRUÇÕES
  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-2xl w-full bg-white rounded-[2.5rem] p-10 sm:p-14 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500 text-center">
          <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-8">
            <span className="material-symbols-outlined text-5xl">
              psychology
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-6 uppercase tracking-tight leading-tight">
            Análise de Perfil Comportamental
          </h1>
          <div className="space-y-6 text-slate-600 text-lg leading-relaxed text-left mb-10">
            <p className="font-bold border-l-4 border-primary pl-4">
              Você agora fará uma análise sobre o seu perfil comportamental. É
              importante que esteja em um ambiente tranquilo, onde consiga
              prestar total atenção ao que está realizando.
            </p>
            <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
              <p className="text-sm font-black text-primary uppercase tracking-widest">
                Como funciona:
              </p>
              <ul className="text-sm space-y-3 font-medium">
                <li className="flex gap-3">
                  <span className="text-primary font-black">01.</span>
                  As primeiras 25 perguntas referem-se a como você se enxerga
                  atualmente.
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-black">02.</span>
                  As outras 25 perguntas referem-se a como você acha que as
                  pessoas ao seu redor esperam que você se comporte.
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setIsStarted(true)}
            className="w-full bg-[#FF8323] hover:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
          >
            Estou pronto para iniciar
          </button>
        </div>
      </div>
    );
  }

  // TELA DE TRANSIÇÃO (ENTRE QUESTÃO 25 E 26)
  if (showTransition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-12 shadow-2xl text-center border border-slate-100 animate-in fade-in slide-in-from-bottom-8">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">
              diversity_3
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tight">
            Percepção Externa
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-10 font-medium">
            Primeira parte concluída! Agora, responda de acordo com o que você
            acredita ser a{" "}
            <strong className="text-primary uppercase">
              avaliação das outras pessoas
            </strong>{" "}
            sobre como você deveria ser no ambiente profissional.
          </p>
          <button
            onClick={() => {
              setShowTransition(false);
              setCurrentStep(25);
            }}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Continuar para a Parte 2
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / discQuestions.length) * 100;

  return (
    <div className="bg-background-light min-h-screen flex flex-col relative overflow-hidden">
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <span className="font-black text-lg text-primary uppercase tracking-tighter">
          Responsa Edu
        </span>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Analista: {funcionario.nm_completo}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="px-8 pt-10 pb-4">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                {currentStep < 25
                  ? "Módulo: Perfil Natural"
                  : "Módulo: Perfil Adaptado"}
              </span>
              <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">
                {currentStep + 1} / 50
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="px-8 py-8 space-y-4">
            {currentGroup.words.map((word) => (
              <div
                key={word}
                className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100 rounded-[1.25rem] hover:bg-white hover:border-primary/30 transition-all duration-300"
              >
                <span className="font-black text-slate-700 uppercase text-sm tracking-tight">
                  {word}
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => {
                    const isSelected = currentAnswers[word] === num;
                    return (
                      <button
                        key={num}
                        onClick={() => handleSelect(word, num)}
                        className={`size-11 sm:size-12 rounded-xl font-black text-sm transition-all border-2 
                            ${isSelected ? "bg-[#FF8323] border-[#FF8323] text-white scale-110 shadow-lg shadow-orange-500/20" : "bg-white border-slate-200 text-slate-400 hover:border-primary/50"}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="px-8 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-xs font-black text-slate-400 hover:text-primary transition-colors disabled:opacity-30 uppercase tracking-widest"
            >
              Anterior
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext || isSaving}
              className={`px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all 
                ${canGoNext ? "bg-[#064384] text-white shadow-xl shadow-blue-900/20 active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
            >
              {isSaving
                ? "Gravando..."
                : currentStep === 49
                  ? "Finalizar"
                  : "Próximo Passo"}
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span className="material-symbols-outlined text-sm text-green-500">
            verified_user
          </span>
          Seus dados estão protegidos e criptografados
        </div>
      </main>
    </div>
  );
}
