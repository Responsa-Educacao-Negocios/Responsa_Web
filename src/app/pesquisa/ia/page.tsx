"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

const BLOCOS_IA = [
  {
    id: "B1",
    titulo: "Visão e Conhecimento",
    icon: "visibility",
    perguntas: [
      "Você entende o que é Inteligência Artificial aplicada aos negócios?",
      "Você conhece ferramentas de IA que podem ser usadas no seu negócio?",
      "Você acompanha tendências ou novidades sobre IA?",
      "Você acredita que a IA pode ajudar a aumentar suas vendas?",
      "Você tem clareza de como a IA pode ser aplicada no seu tipo de negócio?",
    ],
  },
  {
    id: "B2",
    titulo: "Uso no Negócio",
    icon: "business_center",
    perguntas: [
      "Você utiliza alguma ferramenta de IA no seu dia a dia?",
      "Você utiliza IA para otimizar tempo ou processos internos?",
      "Você já testou ferramentas de IA para o seu negócio?",
      "Você utiliza IA para apoiar decisões (ex: análise de dados)?",
      "Você tem interesse em implementar IA no seu negócio?",
    ],
  },
  {
    id: "B3",
    titulo: "IA no Marketing",
    icon: "campaign",
    perguntas: [
      "Você utiliza IA para criar conteúdos (posts, textos, anúncios)?",
      "Você usa IA para gerar ideias de campanhas ou promoções?",
      "Você utiliza IA para criar imagens ou artes para redes sociais?",
      "Você usa IA para planejar seu calendário de conteúdo?",
      "Você utiliza IA para escrever mensagens de vendas ou atendimento?",
    ],
  },
  {
    id: "B4",
    titulo: "Cliente e Dados",
    icon: "query_stats",
    perguntas: [
      "Você utiliza dados para entender o comportamento dos seus clientes?",
      "Você utiliza ferramentas que sugerem públicos ou segmentação?",
      "Você personaliza ofertas com base no perfil do cliente?",
      "Você acompanha métricas (engajamento, vendas, conversão)?",
      "Você utiliza IA ou automações para melhorar a experiência do cliente?",
    ],
  },
  {
    id: "B5",
    titulo: "Automação e Vendas",
    icon: "smart_toy",
    perguntas: [
      "Você utiliza respostas automáticas no WhatsApp ou redes sociais?",
      "Você possui algum tipo de funil de vendas estruturado?",
      "Você utiliza ferramentas que automatizam atendimento ou vendas?",
      "Você consegue atender clientes mesmo fora do horário comercial?",
      "Você utiliza IA para aumentar conversão de vendas?",
    ],
  },
];

const ESCALA = [
  { valor: 0, label: "Não utilizo" },
  { valor: 25, label: "Uso pouco" },
  { valor: 50, label: "Moderado" },
  { valor: 75, label: "Frequente" },
  { valor: 100, label: "Avançado" },
];

export default function DiagnosticoIAPublico() {
  const [step, setStep] = useState(0); // 0 = Nome, 1 = Perguntas, 2 = Resultado
  const [empresaNome, setEmpresaNome] = useState("");
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<any>(null);

  const calcularESalvar = async () => {
    setIsSaving(true);
    let somaGeral = 0;
    let totalRespondidas = 0;
    const pilarScores: Record<string, number> = {};

    BLOCOS_IA.forEach((bloco) => {
      let somaBloco = 0;
      let qtdBloco = 0;
      bloco.perguntas.forEach((_, qIndex) => {
        const val = respostas[`${bloco.id}_${qIndex}`];
        if (val !== undefined) {
          somaBloco += val;
          somaGeral += val;
          qtdBloco++;
          totalRespondidas++;
        }
      });
      pilarScores[bloco.id] =
        qtdBloco > 0 ? Math.round(somaBloco / qtdBloco) : 0;
    });

    if (totalRespondidas < 25) {
      alert("Por favor, responda todas as perguntas para ver o resultado.");
      setIsSaving(false);
      return;
    }

    const indiceGeral = Math.round(somaGeral / 25);

    let categoria = {
      label: "Iniciante",
      color: "text-slate-500",
      bg: "bg-slate-100",
      icon: "hourglass_empty",
      desc: "Ainda não utiliza IA estrategicamente. Há muito potencial inexplorado.",
    };
    if (indiceGeral > 25)
      categoria = {
        label: "Explorador",
        color: "text-orange-600",
        bg: "bg-orange-50",
        icon: "explore",
        desc: "Já conhece algumas ferramentas, mas o uso não é contínuo.",
      };
    if (indiceGeral > 50)
      categoria = {
        label: "Aplicador",
        color: "text-blue-600",
        bg: "bg-blue-50",
        icon: "build",
        desc: "Usa IA na rotina para ganhar tempo. Caminhando para a maturidade.",
      };
    if (indiceGeral > 75)
      categoria = {
        label: "Estratégico",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: "diamond",
        desc: "Usa IA como vantagem competitiva em marketing e vendas.",
      };

    try {
      await supabase.from("DIAGNOSTICO_IA_MARKETING").insert([
        {
          nm_empresa: empresaNome,
          nr_score_geral: indiceGeral,
          ds_nivel_maturidade: categoria.label,
          js_detalhes: {
            respostas_brutas: respostas,
            scores_por_bloco: pilarScores,
          },
        },
      ]);

      setResultadoFinal({ indiceGeral, categoria });
      setStep(2);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar dados. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // TELA DE BOAS VINDAS
  if (step === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="w-16 h-16 bg-blue-50 text-[#064384] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">
              smart_toy
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">
            Diagnóstico de IA no Marketing
          </h1>
          <p className="text-slate-500 text-sm mb-8 font-medium">
            Descubra o nível de maturidade do seu negócio no uso de Inteligência
            Artificial e Automação.
          </p>

          <input
            type="text"
            placeholder="Nome da sua Empresa"
            value={empresaNome}
            onChange={(e) => setEmpresaNome(e.target.value)}
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 mb-4 focus:outline-none focus:border-[#064384]"
          />
          <button
            onClick={() =>
              empresaNome ? setStep(1) : alert("Preencha o nome.")
            }
            className="w-full bg-[#FF8323] text-white font-black py-4 rounded-xl shadow-lg shadow-orange-500/30 active:scale-95 transition-all"
          >
            Iniciar Diagnóstico
          </button>
        </div>
      </div>
    );
  }

  // TELA DE RESULTADO
  if (step === 2 && resultadoFinal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Seu Score de Maturidade
          </div>
          <div className="text-6xl font-black text-[#064384] mb-6">
            {resultadoFinal.indiceGeral}%
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest mb-4 ${resultadoFinal.categoria.bg} ${resultadoFinal.categoria.color}`}
          >
            <span className="material-symbols-outlined">
              {resultadoFinal.categoria.icon}
            </span>
            {resultadoFinal.categoria.label}
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            {resultadoFinal.categoria.desc}
          </p>

          <a
            href="https://wa.me/5534984333000"
            target="_blank"
            className="w-full flex justify-center items-center gap-2 bg-[#064384] text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
          >
            Falar com Consultor{" "}
            <span className="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
      </div>
    );
  }

  // TELA DO QUESTIONÁRIO
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 text-center shadow-sm">
        <h2 className="text-lg font-black text-[#064384]">Diagnóstico de IA</h2>
      </header>

      <main className="max-w-3xl mx-auto w-full p-4 sm:p-6 space-y-8 mt-4">
        {BLOCOS_IA.map((bloco) => (
          <section
            key={bloco.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#064384]">
                {bloco.icon}
              </span>
              <h3 className="font-black text-[#064384] text-sm uppercase tracking-widest">
                {bloco.titulo}
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {bloco.perguntas.map((pergunta, qIndex) => {
                const key = `${bloco.id}_${qIndex}`;
                return (
                  <div key={key} className="p-5 flex flex-col gap-4">
                    <p className="text-sm font-bold text-slate-700">
                      {pergunta}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ESCALA.map((item) => (
                        <button
                          key={item.valor}
                          onClick={() =>
                            setRespostas({ ...respostas, [key]: item.valor })
                          }
                          className={`px-3 py-2 rounded-lg text-xs font-black transition-all border-2 flex-1 min-w-[60px] 
                            ${respostas[key] === item.valor ? "bg-[#064384] border-[#064384] text-white shadow-md scale-105" : "bg-white border-slate-200 text-slate-400 hover:border-[#064384]/40"}
                          `}
                        >
                          {item.valor}%
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 px-6 flex justify-center z-50">
        <button
          onClick={calcularESalvar}
          disabled={isSaving}
          className="w-full max-w-md bg-[#FF8323] text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? "Processando..." : "Ver Meu Resultado"}
        </button>
      </div>
    </div>
  );
}
