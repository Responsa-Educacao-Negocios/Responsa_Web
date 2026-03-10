"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// LISTA COMPLETA DE 50 PERGUNTAS EXTRAÍDAS DO CSV [cite: 1]
const discQuestions = [
  // PARTE 1: PERFIL NATURAL (1-25) [cite: 1]
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

  // PARTE 2: PERCEPÇÃO EXTERNA (26-50) [cite: 1]
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
  const [currentStep, setCurrentStep] = useState(0);
  const [funcionario, setFuncionario] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorNotFound, setErrorNotFound] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const [answers, setAnswers] = useState<
    Record<number, Record<string, number>>
  >({});

  // 1. CARREGAMENTO COM TRATAMENTO DE ERRO (RESOLVE PGRST116)
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from("FUNCIONARIOS")
        .select("nm_completo, cd_empresa, js_pontuacao_disc")
        .eq("cd_funcionario", params.id)
        .maybeSingle(); // Troquei .single() por .maybeSingle() para evitar erro 406

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
        if (answeredSteps < discQuestions.length) {
          setCurrentStep(answeredSteps);
        }
      }
    };
    if (params.id) fetchUser();
  }, [params.id]);

  const currentGroup = discQuestions[currentStep];
  const currentAnswers = answers[currentGroup.id] || {};

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
      // Salva progresso
      await supabase
        .from("FUNCIONARIOS")
        .update({
          js_pontuacao_disc: {
            ...(funcionario.js_pontuacao_disc || {}),
            respostas_brutas: answers,
          },
        })
        .eq("cd_funcionario", params.id);

      // LÓGICA DE TRANSIÇÃO (APÓS QUESTÃO 25)
      if (currentStep === 24) {
        setShowTransition(true);
      } else if (currentStep < discQuestions.length - 1) {
        setCurrentStep((curr) => curr + 1);
      } else {
        // Finalização (Redirecionamento)
        alert("Teste Finalizado com Sucesso!");
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
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Funcionário não encontrado
        </h1>
        <p className="text-slate-500">
          O link utilizado é inválido ou o funcionário foi removido.
        </p>
      </div>
    );

  if (!funcionario)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando seu teste...
      </div>
    );

  // TELA DE TRANSIÇÃO: PERGUNTAS PESSOAIS/EXTERNAS
  if (showTransition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl p-10 shadow-2xl text-center border border-slate-100 animate-in fade-in zoom-in-95">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">
              visibility
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tight">
            Percepção Externa
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-8">
            Você concluiu a primeira parte. Agora, responda de acordo com o que
            você acredita ser a
            <strong className="text-primary">
              {" "}
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
            Começar Segunda Parte
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / discQuestions.length) * 100;

  return (
    <div className="bg-background-light min-h-screen flex flex-col relative overflow-hidden">
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <span className="font-black text-lg text-primary uppercase">
          Responsa Edu
        </span>
        <div className="text-sm font-medium text-slate-600">
          Olá, {funcionario.nm_completo.split(" ")[0]}!
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col">
          <div className="px-8 pt-8 pb-4">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {currentStep < 25
                  ? "PARTE 1: PERFIL NATURAL"
                  : "PARTE 2: PERFIL ADAPTADO"}
              </span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {currentStep + 1} de 50
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-4">
            {currentGroup.words.map((word) => (
              <div
                key={word}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"
              >
                <span className="font-extrabold text-slate-700 tracking-tight">
                  {word}
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => {
                    const isSelected = currentAnswers[word] === num;
                    return (
                      <button
                        key={num}
                        onClick={() => handleSelect(word, num)}
                        className={`size-12 rounded-lg font-black text-sm transition-all border-2 
                            ${isSelected ? "bg-primary border-primary text-white scale-105 shadow-md" : "bg-white border-slate-200 text-slate-400 hover:border-primary/50"}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-sm font-bold text-slate-400 disabled:opacity-30"
            >
              Anterior
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext || isSaving}
              className={`px-10 py-3.5 rounded-xl font-black uppercase text-[11px] transition-all 
                ${canGoNext ? "bg-secondary text-white shadow-lg active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
            >
              {isSaving
                ? "Salvando..."
                : currentStep === 49
                  ? "Finalizar Teste"
                  : "Próxima"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
