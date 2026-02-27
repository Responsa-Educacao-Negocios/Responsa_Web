"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// LISTA DE PERGUNTAS (Abreviada para o exemplo, mantenha as 25)
const discQuestions = [
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
];

export default function PesquisaDiscPage() {
  const params = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [funcionario, setFuncionario] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Guardará as respostas em formato JSON
  const [answers, setAnswers] = useState<
    Record<number, Record<string, number>>
  >({});

  // 1. CARREGA O FUNCIONÁRIO, A EMPRESA E O RASCUNHO (SE HOUVER)
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase
        .from("FUNCIONARIOS")
        .select("nm_completo, cd_empresa, js_pontuacao_disc")
        .eq("cd_funcionario", params.id)
        .single();

      if (data) {
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
    if (currentAnswers[word] === rank) {
      delete newAnswers[word];
    } else {
      newAnswers[word] = rank;
    }
    setAnswers({ ...answers, [currentGroup.id]: newAnswers });
  };

  const canGoNext = Object.keys(currentAnswers).length === 4;

  // 3. SALVAMENTO AUTOMÁTICO E CÁLCULO FINAL (CONECTADO COM AVALIACOES_DISC)
  const handleNext = async () => {
    if (!canGoNext) return;
    setIsSaving(true);

    try {
      if (currentStep < discQuestions.length - 1) {
        // Apenas salva o rascunho para não perder progresso
        await supabase
          .from("FUNCIONARIOS")
          .update({
            js_pontuacao_disc: {
              ...(funcionario.js_pontuacao_disc || {}),
              respostas_brutas: answers,
            },
          })
          .eq("cd_funcionario", params.id);

        setCurrentStep((curr) => curr + 1);
      } else {
        // MOCK DO RESULTADO FINAL (Aqui você aplicaria a lógica real do seu gabarito)
        const notasDISC = { D: 45, I: 35, S: 10, C: 10 };
        const perfilPrincipal = "DI";

        // PASSO A: Busca qual é o projeto atual (mais recente) da empresa deste funcionário
        const { data: projData } = await supabase
          .from("PROJETOS")
          .select("cd_projeto")
          .eq("cd_empresa", funcionario.cd_empresa)
          .order("ts_criacao", { ascending: false })
          .limit(1)
          .single();

        if (projData) {
          // PASSO B: Salva o Histórico Oficial na tabela AVALIACOES_DISC do projeto!
          const { error: discError } = await supabase
            .from("AVALIACOES_DISC")
            .insert([
              {
                cd_projeto: projData.cd_projeto,
                cd_funcionario: params.id,
                nm_colaborador: funcionario.nm_completo, // <--- ESTA LINHA FALTAVA
                nr_dominancia: notasDISC.D,
                nr_influencia: notasDISC.I,
                nr_estabilidade: notasDISC.S,
                nr_conformidade: notasDISC.C,
              },
            ]);

          if (discError)
            console.error("Erro ao salvar histórico DISC:", discError);
        }

        // PASSO C: Atualiza o Perfil atual do Funcionário no cadastro principal
        const pontuacaoParaCadastro = {
          ...notasDISC,
          aderencia: 85,
          respostas_brutas: answers,
          competencias: [
            { label: "Liderança e Comando", valor: 85, alvo: 75, letra: "D" },
            {
              label: "Comunicação Persuasiva",
              valor: 70,
              alvo: 80,
              letra: "I",
            },
            {
              label: "Organização e Detalhes",
              valor: 40,
              alvo: 30,
              letra: "C",
            },
            { label: "Resiliência Emocional", valor: 55, alvo: 60, letra: "S" },
          ],
        };

        const { error: funcError } = await supabase
          .from("FUNCIONARIOS")
          .update({
            js_pontuacao_disc: pontuacaoParaCadastro,
            sg_perfil_disc: perfilPrincipal,
          })
          .eq("cd_funcionario", params.id);

        if (funcError) throw funcError;

        alert("Teste Finalizado com Sucesso! Muito obrigado.");
        router.push("/sucesso");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Houve um erro ao salvar sua resposta. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((curr) => curr - 1);
  };

  const getIniciais = (nome: string) =>
    nome ? nome.substring(0, 2).toUpperCase() : "CC";
  const progress = ((currentStep + 1) / discQuestions.length) * 100;

  if (!funcionario)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        Carregando seu teste...
      </div>
    );

  return (
    <div className="bg-background-light min-h-screen flex flex-col transition-colors duration-200 relative overflow-hidden z-0">
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none"></div>

      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">corporate_fare</span>
          </div>
          <span className="font-black text-lg tracking-tight text-primary uppercase">
            CoreConsulta
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 hidden sm:inline-block">
            Olá, {funcionario.nm_completo.split(" ")[0]}!
          </span>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {getIniciais(funcionario.nm_completo)}
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col transition-all duration-300">
          <div className="px-8 pt-8 pb-4">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Análise Comportamental DISC
              </span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                Grupo {currentStep + 1} de {discQuestions.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="px-8 py-6 flex-grow flex flex-col gap-8">
            <div className="space-y-3">
              <h1 className="text-2xl font-black leading-tight text-slate-800 tracking-tight">
                Ordene as características abaixo.
              </h1>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Sendo <strong className="text-primary">1</strong> a palavra que{" "}
                <strong>MAIS</strong> tem a ver com você, e{" "}
                <strong className="text-slate-800">4</strong> a que{" "}
                <strong>MENOS</strong> tem a ver.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_auto] gap-4 px-2">
                <div></div>
                <div className="flex gap-2 text-[10px] font-bold text-slate-400">
                  <span className="w-12 text-center">Mais</span>
                  <span className="w-12 text-center"></span>
                  <span className="w-12 text-center"></span>
                  <span className="w-12 text-center">Menos</span>
                </div>
              </div>

              {currentGroup.words.map((word) => (
                <div
                  key={word}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
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
                          className={`size-12 rounded-lg font-black text-sm transition-all duration-200 flex items-center justify-center border-2
                            ${isSelected ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105" : "bg-white border-slate-200 text-slate-400 hover:border-primary/50 hover:text-primary"}
                          `}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-sm font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 group disabled:opacity-30 disabled:hover:text-slate-400"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>{" "}
              Anterior
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext || isSaving}
              className={`w-full sm:w-auto px-10 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all duration-200 flex items-center justify-center gap-2 group
                ${canGoNext ? "bg-secondary hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed"}
              `}
            >
              {isSaving
                ? "Salvando..."
                : currentStep === discQuestions.length - 1
                  ? "Finalizar Teste"
                  : "Próxima"}
              {!isSaving && (
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  {currentStep === discQuestions.length - 1
                    ? "check_circle"
                    : "arrow_forward"}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="w-full max-w-3xl mt-6 flex items-center justify-between text-[11px] font-bold text-slate-400 px-4">
          <div className="flex items-center gap-2 text-green-600">
            <span className="material-symbols-outlined text-sm">
              cloud_done
            </span>{" "}
            Salvamento automático
          </div>
          <span className="tracking-widest uppercase">Sigiloso & Seguro</span>
        </div>
      </main>
    </div>
  );
}
