"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const formInicial = {
  nome: "",
  area: "",
  necessidade: "",
  tipo: "INTERNO_PRESENCIAL", // Bate com o novo ENUM
  prioridade: "MEDIA",
  responsavel: "",
  status: "PLANEJADO",
  publico: "",
  participantes: "",
  instrutor: "",
  local: "",
  data: "",
  hora: "",
  cargaHoraria: "", // Agora vai ser convertido para INT
  custo: "",
  objetivo: "",
  conteudo: "",
  resultados: "",
  recursosDidaticos: "",
  infraestrutura: "",
  participantesNomes: "",
};

export default function LNTPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [listaTreinamentos, setListaTreinamentos] = useState<any[]>([]);
  const [registroId, setRegistroId] = useState<string | null>(null);
  const [form, setForm] = useState(formInicial);

  const carregarTreinamentos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("LNT_TREINAMENTOS")
      .select("*")
      .eq("cd_projeto", params.id)
      .order("ts_criacao", { ascending: false });

    if (data) {
      setListaTreinamentos(data);
      if (data.length > 0 && !registroId) {
        selecionarTreinamento(data[0], false);
      } else if (data.length === 0) {
        handleNovo(false);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarTreinamentos();
  }, [params.id]);

  // Função para rolar até o formulário no Mobile
  const scrollToForm = () => {
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document
          .getElementById("area-formulario")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const selecionarTreinamento = (t: any, autoScroll = true) => {
    setRegistroId(t.cd_treinamento);
    setForm({
      nome: t.nm_treinamento || "",
      area: t.nm_area || "",
      necessidade: t.ds_necessidade || "",
      tipo: t.tp_capacitacao || "INTERNO_PRESENCIAL",
      prioridade: t.tp_prioridade || "MEDIA",
      responsavel: t.nm_responsavel || "",
      status: t.tp_status || "PLANEJADO",
      publico: t.ds_publico_alvo || "",
      participantes: t.nr_participantes?.toString() || "",
      instrutor: t.nm_instrutor || "",
      local: t.nm_local || "",
      data: t.dt_prevista || "",
      hora: t.hr_prevista || "",
      cargaHoraria: t.nr_carga_horaria?.toString() || "",
      custo: t.vl_custo?.toString() || "",
      objetivo: t.ds_objetivo || "",
      conteudo: t.ds_conteudo || "",
      resultados: t.ds_resultados_esperados || "",
      recursosDidaticos: t.ds_recursos_didaticos || "",
      infraestrutura: t.ds_infraestrutura || "",
      participantesNomes: t.ds_lista_participantes || "",
    });
    if (autoScroll) scrollToForm();
  };

  const handleNovo = (autoScroll = true) => {
    setRegistroId(null);
    setForm(formInicial);
    if (autoScroll) scrollToForm();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) return alert("O Nome da Capacitação é obrigatório.");
    setSaving(true);

    const payload = {
      cd_projeto: params.id,
      nm_treinamento: form.nome,
      nm_area: form.area,
      ds_necessidade: form.necessidade,
      tp_capacitacao: form.tipo,
      tp_prioridade: form.prioridade,
      nm_responsavel: form.responsavel,
      tp_status: form.status,
      ds_publico_alvo: form.publico,
      nr_participantes: form.participantes
        ? parseInt(form.participantes)
        : null,
      nm_instrutor: form.instrutor,
      nm_local: form.local,
      dt_prevista: form.data || null,
      hr_prevista: form.hora || null,
      nr_carga_horaria: form.cargaHoraria ? parseInt(form.cargaHoraria) : null,
      vl_custo: form.custo ? parseFloat(form.custo) : null,
      ds_objetivo: form.objetivo,
      ds_conteudo: form.conteudo,
      ds_resultados_esperados: form.resultados,
      ds_recursos_didaticos: form.recursosDidaticos,
      ds_infraestrutura: form.infraestrutura,
      ds_lista_participantes: form.participantesNomes,
    };

    try {
      if (registroId) {
        const { error } = await supabase
          .from("LNT_TREINAMENTOS")
          .update(payload)
          .eq("cd_treinamento", registroId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("LNT_TREINAMENTOS")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (data) setRegistroId(data.cd_treinamento);
      }
      alert("Treinamento salvo com sucesso!");
      carregarTreinamentos();
    } catch (error: any) {
      console.error(error);
      alert(
        "Erro ao salvar. Verifique se a carga horária ou valores numéricos estão corretos.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!registroId) return;
    if (!confirm("Tem certeza que deseja excluir esta capacitação?")) return;

    setSaving(true);
    try {
      await supabase
        .from("LNT_TREINAMENTOS")
        .delete()
        .eq("cd_treinamento", registroId);
      alert("Treinamento excluído.");
      handleNovo(false);
      carregarTreinamentos();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#064384]">
          progress_activity
        </span>
      </div>
    );

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col h-screen overflow-hidden w-full">
      {/* HEADER FIXO RESPONSIVO */}
      <header className="bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 shrink-0 shadow-sm z-10 w-full">
        <div className="flex items-center gap-3 sm:gap-4 pl-12 lg:pl-0">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-[#064384] transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
              arrow_back
            </span>
          </button>
          <div className="hidden sm:block h-6 w-[1px] bg-slate-200"></div>
          <h1 className="font-black text-[#064384] text-base sm:text-lg uppercase tracking-widest flex items-center gap-2 truncate">
            <span className="material-symbols-outlined hidden sm:block">
              school
            </span>
            <span className="truncate">LNT - Capacitações</span>
          </h1>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {registroId && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-red-100 transition-colors active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>
              <span className="hidden xs:inline">Excluir</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] md:flex-none bg-[#FF8323] hover:bg-orange-600 text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-sm mt-2"
          >
            <span className="material-symbols-outlined text-[18px] animate-spin-slow">
              {saving ? "sync" : "save"}
            </span>
            <span className="truncate">
              {saving ? "Salvando..." : "Salvar Cadastro"}
            </span>
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL (SIDEBAR + FORMULÁRIO) */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
        {/* SIDEBAR - LISTA DE TREINAMENTOS */}
        <aside className="w-full lg:w-80 bg-white border-b lg:border-r lg:border-b-0 border-slate-200 flex flex-col shrink-0 shadow-sm z-0 h-[35vh] lg:h-full">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-widest">
              Plano Anual
            </h2>
            <span className="bg-[#064384]/10 text-[#064384] text-xs font-bold px-2 py-1 rounded-md">
              {listaTreinamentos.length}
            </span>
          </div>

          <div className="p-4 border-b border-slate-100">
            <button
              onClick={() => handleNovo(true)}
              className="w-full bg-blue-50 hover:bg-[#064384] text-[#064384] hover:text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>{" "}
              Novo Treinamento
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {listaTreinamentos.length === 0 ? (
              <p className="text-center text-xs sm:text-sm font-medium text-slate-400 mt-6">
                Nenhuma capacitação cadastrada.
              </p>
            ) : (
              listaTreinamentos.map((t) => (
                <div
                  key={t.cd_treinamento}
                  onClick={() => selecionarTreinamento(t, true)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${registroId === t.cd_treinamento ? "bg-blue-50 border-[#064384]/30 shadow-sm" : "bg-white border-slate-100 hover:bg-slate-50"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3
                      className={`font-bold text-sm truncate pr-2 ${registroId === t.cd_treinamento ? "text-[#064384]" : "text-slate-800"}`}
                    >
                      {t.nm_treinamento}
                    </h3>
                    {t.tp_status === "CONCLUIDO" && (
                      <span
                        className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0 shadow-sm"
                        title="Concluído"
                      ></span>
                    )}
                    {t.tp_status === "PLANEJADO" && (
                      <span
                        className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0 shadow-sm"
                        title="Planejado"
                      ></span>
                    )}
                    {t.tp_status === "EM_ANDAMENTO" && (
                      <span
                        className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 shrink-0 shadow-sm"
                        title="Em Andamento"
                      ></span>
                    )}
                    {t.tp_status === "CANCELADO" && (
                      <span
                        className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0 shadow-sm"
                        title="Cancelado"
                      ></span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                    {t.nm_area || "Área não definida"}
                  </p>
                  <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] sm:text-[10px] font-black uppercase text-slate-500">
                    {t.tp_prioridade}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ÁREA DO FORMULÁRIO */}
        <main
          id="area-formulario"
          className="flex-1 overflow-y-auto p-4 sm:p-8 relative bg-slate-50/50 scroll-smooth scrollbar-hide"
        >
          <div className="max-w-[800px] mx-auto pb-10">
            {!registroId && (
              <div className="bg-blue-50 border border-blue-200 text-[#064384] px-4 py-3 rounded-2xl mb-6 flex items-center gap-3 shadow-sm">
                <span className="material-symbols-outlined shrink-0">info</span>
                <p className="text-xs sm:text-sm font-bold">
                  Você está planejando uma{" "}
                  <span className="uppercase tracking-widest">
                    Nova Capacitação
                  </span>
                  .
                </p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSave}>
              {/* BLOCO 1: IDENTIFICAÇÃO DA NECESSIDADE */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5 sm:space-y-6">
                <h2 className="text-xs sm:text-sm font-black text-[#064384] uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    find_in_page
                  </span>{" "}
                  Levantamento da Necessidade
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nome da Capacitação{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.nome}
                      onChange={(e) =>
                        setForm({ ...form, nome: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] focus:ring-4 focus:ring-primary/10 transition-all outline-none font-semibold text-slate-800 text-sm"
                      placeholder="Ex: Curso de Liderança Avançada"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Área / Departamento
                    </label>
                    <input
                      value={form.area}
                      onChange={(e) =>
                        setForm({ ...form, area: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none text-sm font-medium"
                      placeholder="Ex: Comercial"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Responsável pela Demanda
                    </label>
                    <input
                      value={form.responsavel}
                      onChange={(e) =>
                        setForm({ ...form, responsavel: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none text-sm font-medium"
                      placeholder="Quem solicitou?"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Necessidade Identificada
                    </label>
                    <textarea
                      value={form.necessidade}
                      onChange={(e) =>
                        setForm({ ...form, necessidade: e.target.value })
                      }
                      rows={2}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none resize-none text-sm font-medium leading-relaxed"
                      placeholder="Por que este treinamento é necessário? (Gap de competência, novo sistema, etc)"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Tipo (Modalidade)
                    </label>
                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        setForm({ ...form, tipo: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none font-bold text-slate-700 text-sm"
                    >
                      <option value="INTERNO_PRESENCIAL">
                        🏢 Interno Presencial
                      </option>
                      <option value="INTERNO_ONLINE">💻 Interno Online</option>
                      <option value="EXTERNO_PRESENCIAL">
                        🚗 Externo Presencial
                      </option>
                      <option value="EXTERNO_ONLINE">🌐 Externo Online</option>
                      <option value="EAD_ASSINCRONO">▶️ EAD Assíncrono</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Prioridade
                    </label>
                    <select
                      value={form.prioridade}
                      onChange={(e) =>
                        setForm({ ...form, prioridade: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none font-bold text-slate-700 text-sm"
                    >
                      <option value="BAIXA">🟢 Baixa</option>
                      <option value="MEDIA">🟡 Média</option>
                      <option value="ALTA">🟠 Alta</option>
                      <option value="URGENTE">🔴 Urgente</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none font-bold text-slate-700 text-sm"
                    >
                      <option value="PLANEJADO">📅 Planejado</option>
                      <option value="EM_ANDAMENTO">⏳ Em Andamento</option>
                      <option value="CONCLUIDO">✅ Concluído</option>
                      <option value="CANCELADO">❌ Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BLOCO 2: LOGÍSTICA E CUSTOS */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5 sm:space-y-6">
                <h2 className="text-xs sm:text-sm font-black text-[#FF8323] uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    event_note
                  </span>{" "}
                  Planejamento e Logística
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Público-Alvo
                    </label>
                    <input
                      value={form.publico}
                      onChange={(e) =>
                        setForm({ ...form, publico: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                      placeholder="Ex: Lideranças da Fábrica"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nº Participantes
                    </label>
                    <input
                      type="number"
                      value={form.participantes}
                      onChange={(e) =>
                        setForm({ ...form, participantes: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                      placeholder="Ex: 15"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Lista de Participantes (Nomes)
                    </label>
                    <textarea
                      value={form.participantesNomes}
                      onChange={(e) =>
                        setForm({ ...form, participantesNomes: e.target.value })
                      }
                      rows={2}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium resize-none"
                      placeholder="Ex: João Silva, Maria Souza..."
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Instrutor / Fornecedor
                    </label>
                    <input
                      value={form.instrutor}
                      onChange={(e) =>
                        setForm({ ...form, instrutor: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                      placeholder="Nome da empresa ou consultor"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Local de Realização
                    </label>
                    <input
                      value={form.local}
                      onChange={(e) =>
                        setForm({ ...form, local: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                      placeholder="Ex: Sala de Reuniões Matriz"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Data Prevista
                    </label>
                    <input
                      type="date"
                      value={form.data}
                      onChange={(e) =>
                        setForm({ ...form, data: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={form.hora}
                      onChange={(e) =>
                        setForm({ ...form, hora: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Carga Horária (h)
                    </label>
                    <input
                      type="number"
                      value={form.cargaHoraria}
                      onChange={(e) =>
                        setForm({ ...form, cargaHoraria: e.target.value })
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                      placeholder="Ex: 8"
                    />
                  </div>

                  <div className="md:col-span-3 bg-green-50 p-4 sm:p-5 rounded-2xl border border-green-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <label className="text-xs sm:text-sm font-black text-green-800 uppercase tracking-wider">
                      Custo Total Estimado (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.custo}
                      onChange={(e) =>
                        setForm({ ...form, custo: e.target.value })
                      }
                      className="w-full sm:w-48 p-3 sm:p-2.5 bg-white border border-green-300 rounded-xl outline-none focus:ring-4 focus:ring-green-500/20 sm:text-right font-black text-green-700 text-base shadow-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO 3: PLANO DIDÁTICO */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5 sm:space-y-6">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    menu_book
                  </span>{" "}
                  Plano Didático
                </h2>

                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Objetivo do Treinamento
                    </label>
                    <textarea
                      value={form.objetivo}
                      onChange={(e) =>
                        setForm({ ...form, objetivo: e.target.value })
                      }
                      rows={2}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-sm font-medium leading-relaxed"
                      placeholder="O que os participantes devem aprender ou melhorar?"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Conteúdo Programático
                    </label>
                    <textarea
                      value={form.conteudo}
                      onChange={(e) =>
                        setForm({ ...form, conteudo: e.target.value })
                      }
                      rows={4}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium leading-relaxed resize-y"
                      placeholder="Lista dos temas, módulos ou assuntos que serão abordados."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Resultados Esperados
                    </label>
                    <textarea
                      value={form.resultados}
                      onChange={(e) =>
                        setForm({ ...form, resultados: e.target.value })
                      }
                      rows={2}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-sm font-medium leading-relaxed"
                      placeholder="Como o sucesso deste treinamento será medido?"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO 4: RECURSOS */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5 sm:space-y-6">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    devices
                  </span>{" "}
                  Recursos Necessários
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Recursos Instrucionais / Didáticos
                    </label>
                    <textarea
                      value={form.recursosDidaticos}
                      onChange={(e) =>
                        setForm({ ...form, recursosDidaticos: e.target.value })
                      }
                      rows={3}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-sm font-medium leading-relaxed"
                      placeholder="Apostilas, dinâmicas, brindes, certificados..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Infraestrutura Necessária
                    </label>
                    <textarea
                      value={form.infraestrutura}
                      onChange={(e) =>
                        setForm({ ...form, infraestrutura: e.target.value })
                      }
                      rows={3}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-sm font-medium leading-relaxed"
                      placeholder="Projetor, TV, Coffe Break, Cadeiras, Internet..."
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
