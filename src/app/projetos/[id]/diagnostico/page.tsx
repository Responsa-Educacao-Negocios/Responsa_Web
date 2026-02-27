"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DiagnosticoInicialPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [empresaNome, setEmpresaNome] = useState("");

  // Estado do formulário e controle se já existe no banco (para saber se faz Insert ou Update)
  const [registroExiste, setRegistroExiste] = useState(false);
  const [formData, setFormData] = useState({
    nr_maturidade_rh: 0,
    nr_risco_trabalhista: 0,
    nr_turnover: "",
    nr_absenteismo: "",
    ds_observacoes: "",
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const projetoId = params.id as string;

        // 1. Busca nome da empresa para o cabeçalho
        const { data: projData } = await supabase
          .from("PROJETOS")
          .select("EMPRESAS ( nm_fantasia )")
          .eq("cd_projeto", projetoId)
          .single();

        if (projData) {
          const empresa = Array.isArray(projData.EMPRESAS)
            ? projData.EMPRESAS[0]
            : projData.EMPRESAS;
          setEmpresaNome(empresa?.nm_fantasia || "Empresa");
        }

        // 2. Busca se já existe um diagnóstico para este projeto
        const { data: indData } = await supabase
          .from("INDICADORES_RH")
          .select("*")
          .eq("cd_projeto", projetoId)
          .maybeSingle();

        if (indData) {
          setRegistroExiste(true);
          setFormData({
            nr_maturidade_rh: indData.nr_maturidade_rh || 0,
            nr_risco_trabalhista: indData.nr_risco_trabalhista || 0,
            nr_turnover: indData.nr_turnover?.toString() || "",
            nr_absenteismo: indData.nr_absenteismo?.toString() || "",
            ds_observacoes: indData.ds_observacoes || "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar diagnóstico:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) carregarDados();
  }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const projetoId = params.id as string;

    const payload = {
      cd_projeto: projetoId,
      nr_maturidade_rh: formData.nr_maturidade_rh,
      nr_risco_trabalhista: formData.nr_risco_trabalhista,
      nr_turnover: formData.nr_turnover
        ? parseFloat(formData.nr_turnover)
        : null,
      nr_absenteismo: formData.nr_absenteismo
        ? parseFloat(formData.nr_absenteismo)
        : null,
      ds_observacoes: formData.ds_observacoes,
    };

    try {
      if (registroExiste) {
        const { error } = await supabase
          .from("INDICADORES_RH")
          .update(payload)
          .eq("cd_projeto", projetoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("INDICADORES_RH")
          .insert([payload]);
        if (error) throw error;
        setRegistroExiste(true);
      }

      alert("Diagnóstico salvo com sucesso!");
      router.back(); // Volta para a tela do projeto
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Ocorreu um erro ao salvar o diagnóstico.");
    } finally {
      setSaving(false);
    }
  };

  // --- Helpers Visuais ---
  const getMaturityColor = (val: number) => {
    if (val < 40) return "text-red-500 bg-red-50 border-red-200";
    if (val < 75) return "text-orange-500 bg-orange-50 border-orange-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getMaturityLabel = (val: number) => {
    if (val < 40) return "Iniciante / Crítico";
    if (val < 75) return "Estruturando";
    return "Avançado / Estratégico";
  };

  const getRiskColor = (val: number) => {
    if (val < 30) return "text-green-600 bg-green-50 border-green-200";
    if (val < 70) return "text-orange-500 bg-orange-50 border-orange-200";
    return "text-red-500 bg-red-50 border-red-200";
  };

  const getRiskLabel = (val: number) => {
    if (val < 30) return "Baixo / Controlado";
    if (val < 70) return "Médio / Atenção";
    return "Alto Risco / Urgente";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4 text-[#064384]">
          <span className="material-symbols-outlined animate-spin text-4xl">
            progress_activity
          </span>
          <span className="font-bold">Carregando formulário...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-20">
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-[#064384] transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <span className="material-symbols-outlined text-[#064384]">
            analytics
          </span>
          <h1 className="text-lg font-bold text-slate-800">
            Diagnóstico Inicial de RH
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {empresaNome}
          </span>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto w-full px-6 py-10 space-y-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Avaliação de Base
          </h2>
          <p className="text-slate-500 font-medium mt-2 leading-relaxed">
            Este formulário define o ponto de partida da consultoria. Estes
            indicadores irão alimentar a timeline do Portal do Cliente e o
            Relatório Final Executivo.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* BLOCO 1: MATURIDADE */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#064384]">
                    trending_up
                  </span>{" "}
                  Maturidade de Gestão de Pessoas
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Avalie de 0 a 100 o nível de estruturação atual do RH da
                  empresa.
                </p>
              </div>
              <div
                className={`px-4 py-1.5 rounded-lg border font-bold text-sm text-center min-w-[150px] transition-colors ${getMaturityColor(formData.nr_maturidade_rh)}`}
              >
                {formData.nr_maturidade_rh}% -{" "}
                {getMaturityLabel(formData.nr_maturidade_rh)}
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={formData.nr_maturidade_rh}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nr_maturidade_rh: parseInt(e.target.value),
                })
              }
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#064384]"
            />
          </div>

          {/* BLOCO 2: RISCO TRABALHISTA */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8323]">
                    warning
                  </span>{" "}
                  Percepção de Risco Trabalhista
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Nível de exposição a passivos, processos informais e falta de
                  conformidade legal.
                </p>
              </div>
              <div
                className={`px-4 py-1.5 rounded-lg border font-bold text-sm text-center min-w-[150px] transition-colors ${getRiskColor(formData.nr_risco_trabalhista)}`}
              >
                {formData.nr_risco_trabalhista}% -{" "}
                {getRiskLabel(formData.nr_risco_trabalhista)}
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={formData.nr_risco_trabalhista}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nr_risco_trabalhista: parseInt(e.target.value),
                })
              }
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF8323]"
            />
          </div>

          {/* BLOCO 3: MÉTRICAS EXATAS */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">
                  group_remove
                </span>{" "}
                Taxa de Turnover (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Ex: 5.5"
                value={formData.nr_turnover}
                onChange={(e) =>
                  setFormData({ ...formData, nr_turnover: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064384]/20 outline-none transition-all font-semibold"
              />
              <p className="text-xs text-slate-400">
                Rotatividade média mensal/anual.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400">
                  sick
                </span>{" "}
                Taxa de Absenteísmo (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Ex: 2.0"
                value={formData.nr_absenteismo}
                onChange={(e) =>
                  setFormData({ ...formData, nr_absenteismo: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064384]/20 outline-none transition-all font-semibold"
              />
              <p className="text-xs text-slate-400">
                Faltas e atrasos da equipe.
              </p>
            </div>
          </div>

          {/* BLOCO 4: PARECER */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064384]">
                edit_document
              </span>{" "}
              Parecer Analítico do Consultor
            </label>
            <textarea
              rows={4}
              placeholder="Descreva brevemente os principais pontos críticos observados no diagnóstico inicial..."
              value={formData.ds_observacoes}
              onChange={(e) =>
                setFormData({ ...formData, ds_observacoes: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064384]/20 outline-none transition-all text-sm leading-relaxed resize-none"
            ></textarea>
          </div>

          {/* AÇÕES */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-[#064384] hover:bg-blue-900 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-70"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    sync
                  </span>{" "}
                  Salvando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>{" "}
                  Salvar Diagnóstico
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
