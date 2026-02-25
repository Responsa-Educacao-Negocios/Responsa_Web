"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const dimensoes = [
  {
    id: "nr_lideranca",
    label: "Liderança",
    desc: "Como você avalia o suporte, a acessibilidade e a conduta da sua liderança direta?",
  },
  {
    id: "nr_comunicac",
    label: "Comunicação",
    desc: "As informações fluem de forma clara e transparente entre os setores e a diretoria?",
  },
  {
    id: "nr_reconhecir",
    label: "Reconhecimento",
    desc: "Você sente que seus esforços e resultados são devidamente valorizados pela empresa?",
  },
  {
    id: "nr_desenvolvi",
    label: "Desenvolvimento",
    desc: "A empresa oferece oportunidades reais de aprendizado e crescimento na carreira?",
  },
  {
    id: "nr_ambiente",
    label: "Ambiente",
    desc: "O ambiente físico e o relacionamento com seus colegas favorecem a produtividade?",
  },
  {
    id: "nr_engajamen",
    label: "Engajamento",
    desc: "O quanto você se sente motivado e orgulhoso em fazer parte desta organização?",
  },
  {
    id: "ds_comentario",
    label: "Sugestões e Comentários",
    desc: "Espaço aberto para você compartilhar percepções que não foram cobertas nas notas anteriores.",
    type: "text",
  },
];

export default function PesquisaClimaColaborador() {
  const params = useParams();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [respostas, setRespostas] = useState<any>({});
  const [enviando, setEnviando] = useState(false);
  const [empresaNome, setEmpresaNome] = useState("");

  useEffect(() => {
    const fetchEmpresa = async () => {
      const { data } = await supabase
        .from("PROJETOS")
        .select("EMPRESAS(nm_fantasia)")
        .eq("cd_projeto", params.id)
        .single();
      if (data) setEmpresaNome((data as any).EMPRESAS.nm_fantasia);
    };
    if (params.id) fetchEmpresa();
  }, [params.id]);

  const itemAtual = dimensoes[step];
  const progresso = ((step + 1) / dimensoes.length) * 100;

  const handleProximo = async () => {
    if (step < dimensoes.length - 1) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      enviarPesquisa();
    }
  };

  const enviarPesquisa = async () => {
    setEnviando(true);
    try {
      const { error } = await supabase
        .from("RESPOSTAS_INDIVIDUAIS_CLIMA")
        .insert([
          {
            cd_projeto: params.id,
            ...respostas,
          },
        ]);

      if (error) throw error;
      router.push("/sucesso");
    } catch (err) {
      alert("Erro ao enviar respostas. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-[#F9FAFB] min-h-screen font-sans flex flex-col items-center py-12 px-4 relative overflow-hidden">
      {/* Detalhes de Fundo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"></div>

      <header className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-primary p-1.5 rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-white text-xl block">
              analytics
            </span>
          </div>
          <span className="text-[#064384] font-black text-xl tracking-tighter uppercase">
            CoreConsulta
          </span>
        </div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
          Diagnóstico de Clima: {empresaNome}
        </h2>
      </header>

      <main className="w-full max-w-2xl bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-slate-100">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progresso}%` }}
          ></div>
        </div>

        <div className="p-10 sm:p-14">
          <div className="mb-10">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">
              Questão {step + 1} de {dimensoes.length}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
              {itemAtual.label}
            </h1>
            <p className="text-slate-500 mt-4 text-base font-medium leading-relaxed">
              {itemAtual.desc}
            </p>
          </div>

          {itemAtual.type === "text" ? (
            <textarea
              className="w-full h-40 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:ring-0 outline-none transition-all text-slate-700 font-medium"
              placeholder="Sua opinião é fundamental para melhorarmos..."
              value={respostas[itemAtual.id] || ""}
              onChange={(e) =>
                setRespostas({ ...respostas, [itemAtual.id]: e.target.value })
              }
            />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Muito Insatisfeito</span>
                <span>Totalmente Satisfeito</span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() =>
                      setRespostas({ ...respostas, [itemAtual.id]: num })
                    }
                    className={`h-12 sm:h-14 rounded-xl font-black text-lg transition-all duration-200 border-2 
                      ${
                        respostas[itemAtual.id] === num
                          ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20"
                          : "bg-white border-slate-100 text-slate-300 hover:border-primary/40 hover:text-primary"
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 0 || enviando}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-colors"
          >
            Voltar
          </button>

          <button
            onClick={handleProximo}
            disabled={
              (!respostas[itemAtual.id] && itemAtual.type !== "text") ||
              enviando
            }
            className="bg-secondary hover:bg-orange-600 text-white px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {enviando
              ? "Enviando..."
              : step === dimensoes.length - 1
                ? "Finalizar"
                : "Próxima"}
            {!enviando && (
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            )}
          </button>
        </div>
      </main>

      <footer className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <span className="material-symbols-outlined text-green-500 text-sm">
          lock
        </span>
        Sua participação é 100% anônima e segura
      </footer>
    </div>
  );
}
