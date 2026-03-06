"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BrainstormPlanoAcaoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // O Fluxo de 5 Passos
  const [activeTab, setActiveTab] = useState("metodologia");

  const [sessoes, setSessoes] = useState<any[]>([]);
  const [sessaoAtiva, setSessaoAtiva] = useState<any>(null);

  const [participantes, setParticipantes] = useState<any[]>([]);
  const [ideias, setIdeias] = useState<any[]>([]);

  useEffect(() => {
    carregarSessoes();
  }, [params.id]);

  const carregarSessoes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("BRAINSTORM_SESSOES")
      .select("*")
      .eq("cd_projeto", params.id)
      .order("dt_sessao", { ascending: false });
    if (data) {
      setSessoes(data);
      if (data.length > 0 && !sessaoAtiva)
        carregarSessaoCompleta(data[0], false);
    }
    setLoading(false);
  };

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

  const carregarSessaoCompleta = async (sessao: any, autoScroll = true) => {
    setSessaoAtiva(sessao);

    // Carrega a Equipe
    const { data: dataParts } = await supabase
      .from("BRAINSTORM_PARTICIPANTES")
      .select("*")
      .eq("cd_sessao", sessao.cd_sessao)
      .order("ts_criacao", { ascending: true });
    if (dataParts) setParticipantes(dataParts);

    // Carrega as Ideias
    const { data: dataIdeias } = await supabase
      .from("BRAINSTORM_IDEIAS")
      .select("*")
      .eq("cd_sessao", sessao.cd_sessao)
      .order("ts_criacao", { ascending: true });
    if (dataIdeias) setIdeias(dataIdeias);

    if (autoScroll) scrollToForm();
  };

  const handleNovaSessao = async () => {
    const { data } = await supabase
      .from("BRAINSTORM_SESSOES")
      .insert([
        {
          cd_projeto: params.id,
          nm_tema: "Novo Brainstorm",
          tp_status: "EM_ANDAMENTO",
        },
      ])
      .select()
      .single();
    if (data) {
      carregarSessoes();
      setActiveTab("planejamento");
      scrollToForm();
    }
  };

  const updateSessao = (field: string, value: any) =>
    setSessaoAtiva({ ...sessaoAtiva, [field]: value });

  // --- EXCLUIR SESSÃO INTEIRA ---
  const deletarSessao = async () => {
    if (!sessaoAtiva) return;
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta sessão inteira? Todas as ideias, notas e participantes serão perdidos permanentemente.",
    );
    if (!confirmar) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("BRAINSTORM_SESSOES")
        .delete()
        .eq("cd_sessao", sessaoAtiva.cd_sessao);

      if (error) throw error;

      alert("Sessão excluída com sucesso!");
      setSessaoAtiva(null);
      setParticipantes([]);
      setIdeias([]);
      setActiveTab("metodologia"); // Volta para o início
      carregarSessoes();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir sessão.");
    } finally {
      setSaving(false);
    }
  };

  // --- CRUD PARTICIPANTES E PLANEJAMENTO ---
  const addParticipante = () =>
    setParticipantes([
      ...participantes,
      { cd_participante: `temp-${Date.now()}`, nm_participante: "" },
    ]);
  const updateParticipante = (id: string, value: string) =>
    setParticipantes(
      participantes.map((p) =>
        p.cd_participante === id ? { ...p, nm_participante: value } : p,
      ),
    );
  const deleteParticipante = async (id: string) => {
    if (!String(id).startsWith("temp-"))
      await supabase
        .from("BRAINSTORM_PARTICIPANTES")
        .delete()
        .eq("cd_participante", id);
    setParticipantes(participantes.filter((p) => p.cd_participante !== id));
  };

  const salvarPlanejamento = async () => {
    setSaving(true);
    try {
      // Salva Sessão
      await supabase
        .from("BRAINSTORM_SESSOES")
        .update(sessaoAtiva)
        .eq("cd_sessao", sessaoAtiva.cd_sessao);

      // Salva Participantes
      const partsToUpsert = participantes.map((p) => {
        const item = { ...p, cd_sessao: sessaoAtiva.cd_sessao };
        if (String(item.cd_participante).startsWith("temp-"))
          delete item.cd_participante;
        return item;
      });
      if (partsToUpsert.length > 0)
        await supabase.from("BRAINSTORM_PARTICIPANTES").upsert(partsToUpsert);

      alert("Planejamento e Equipe salvos com sucesso!");
      carregarSessaoCompleta(sessaoAtiva, false); // Recarrega sem rolar
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar planejamento.");
    } finally {
      setSaving(false);
    }
  };

  // --- CRUD IDEIAS ---
  const addIdeia = () => {
    setIdeias([
      ...ideias,
      {
        cd_ideia: `temp-${Date.now()}`,
        nm_ideia: "",
        cd_participante: null,
        js_votos: [0, 0, 0, 0, 0],
        nr_media_votos: 0,
      },
    ]);
  };
  const updateIdeia = (id: string, field: string, value: any) => {
    setIdeias(
      ideias.map((ideia) => {
        if (ideia.cd_ideia === id) {
          const nova = { ...ideia, [field]: value };
          if (field === "js_votos") {
            const soma = nova.js_votos.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            nova.nr_media_votos = soma / nova.js_votos.length;
          }
          return nova;
        }
        return ideia;
      }),
    );
  };
  const deleteIdeia = async (id: string) => {
    if (!String(id).startsWith("temp-"))
      await supabase.from("BRAINSTORM_IDEIAS").delete().eq("cd_ideia", id);
    setIdeias(ideias.filter((i) => i.cd_ideia !== id));
  };

  const salvarIdeiasEVotacao = async () => {
    setSaving(true);
    try {
      const payload = ideias.map((id) => {
        const item = { ...id, cd_sessao: sessaoAtiva.cd_sessao };
        if (String(item.cd_ideia).startsWith("temp-")) delete item.cd_ideia;
        return item;
      });
      if (payload.length > 0)
        await supabase
          .from("BRAINSTORM_IDEIAS")
          .upsert(payload, { onConflict: "cd_ideia" });
      alert("Ideias e Notas salvas com sucesso!");
      carregarSessaoCompleta(sessaoAtiva, false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getNomeAutor = (cd_participante: string) => {
    const p = participantes.find(
      (part) => part.cd_participante === cd_participante,
    );
    return p ? p.nm_participante : "Autor Desconhecido/Removido";
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
      {/* HEADER TOP RESPONSIVO */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shrink-0 shadow-sm z-10 w-full">
        <div className="px-4 sm:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              <span className="material-symbols-outlined hidden sm:block text-[#FF8323]">
                tips_and_updates
              </span>{" "}
              <span className="truncate">Brainstorm & Ação</span>
            </h1>
          </div>
        </div>

        {/* NAVEGAÇÃO DE FASES COM SCROLL HORIZONTAL MOBILE */}
        <div className="px-4 sm:px-8 flex gap-6 sm:gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {[
            { id: "metodologia", label: "1. Metodologia", icon: "menu_book" },
            {
              id: "planejamento",
              label: "2. Planejamento & Equipe",
              icon: "groups",
            },
            { id: "ideias", label: "3. Gerar Ideias", icon: "lightbulb" },
            { id: "votacao", label: "4. Seleção", icon: "how_to_vote" },
            { id: "dashboard", label: "5. Dashboard", icon: "insert_chart" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-xs sm:text-[13px] font-bold flex items-center gap-2 border-b-2 transition-colors outline-none shrink-0
                ${activeTab === tab.id ? "border-[#FF8323] text-[#FF8323]" : "border-transparent text-slate-400 hover:text-[#064384]"}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>{" "}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
        {/* SIDEBAR - LISTA DE SESSÕES */}
        <aside className="w-full lg:w-80 bg-white border-b lg:border-r lg:border-b-0 border-slate-200 flex flex-col shrink-0 shadow-sm z-0 h-[30vh] lg:h-full">
          <div className="p-4 border-b border-slate-100">
            <button
              onClick={handleNovaSessao}
              className="w-full bg-blue-50 text-primary py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>{" "}
              Nova Sessão
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {sessoes.map((s) => (
              <div
                key={s.cd_sessao}
                onClick={() => carregarSessaoCompleta(s, true)}
                className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${sessaoAtiva?.cd_sessao === s.cd_sessao ? "bg-blue-50 border-primary/30 shadow-sm" : "bg-white border-slate-100 hover:bg-slate-50"}`}
              >
                <h3
                  className={`font-bold text-sm truncate ${sessaoAtiva?.cd_sessao === s.cd_sessao ? "text-primary" : "text-slate-700"}`}
                >
                  {s.nm_tema}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                  {new Date(s.dt_sessao).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main
          id="area-formulario"
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 scroll-smooth scrollbar-hide w-full"
        >
          {/* FASE 1: METODOLOGIA */}
          {activeTab === "metodologia" && (
            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="font-black text-[#064384] text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FF8323]">
                      list_alt
                    </span>{" "}
                    Metodologia 12 Passos
                  </h2>
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-600 font-medium">
                    {[
                      "Defina um problema a ser resolvido",
                      "Reúna pessoas relacionadas e não relacionadas",
                      "Siga as regras rigorosamente",
                      "Estabeleça tempo máximo e mínimo",
                      "Cada participante apresenta uma ideia por vez",
                      "Todas as ideias deverão ser registradas",
                      "Esclareça o significado de todas as ideias",
                      "Estabeleça ao menos 3 critérios de ranking",
                      "Descarte as ideias não úteis",
                      "Cada um escolhe sigilosamente as 5 melhores",
                      "Resultados são apresentados e discutidos",
                      "Seleciona-se a melhor ideia e uma alternativa",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-2 sm:gap-3 leading-snug">
                        <span className="font-black text-[#064384] min-w-[20px]">
                          {i + 1}º
                        </span>{" "}
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-[#064384] p-5 sm:p-8 rounded-2xl text-white shadow-xl">
                    <h2 className="font-black text-[10px] sm:text-xs uppercase tracking-widest mb-4 sm:mb-6 opacity-80 flex items-center gap-2">
                      <span className="material-symbols-outlined text-yellow-400 text-lg">
                        star
                      </span>{" "}
                      Regras de Ouro
                    </h2>
                    <ul className="space-y-4 sm:space-y-5 text-xs sm:text-sm font-medium">
                      <li className="flex items-start sm:items-center gap-3 text-red-200">
                        <span className="material-symbols-outlined shrink-0 text-red-400">
                          cancel
                        </span>{" "}
                        Críticas são terminantemente rejeitadas
                      </li>
                      <li className="flex items-start sm:items-center gap-3 text-green-200">
                        <span className="material-symbols-outlined shrink-0 text-green-400">
                          check_circle
                        </span>{" "}
                        Criatividade é essencial (Saia da caixa)
                      </li>
                      <li className="flex items-start sm:items-center gap-3 text-blue-200">
                        <span className="material-symbols-outlined shrink-0 text-blue-400">
                          add_circle
                        </span>{" "}
                        Quantidade importa (Anote tudo)
                      </li>
                      <li className="flex items-start sm:items-center gap-3 text-yellow-100">
                        <span className="material-symbols-outlined shrink-0 text-yellow-400">
                          auto_fix_high
                        </span>{" "}
                        Combinação e aperfeiçoamento permitidos
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FASE 2: PLANEJAMENTO E EQUIPE */}
          {activeTab === "planejamento" && sessaoAtiva && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-10">
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <h2 className="font-black text-[#064384] uppercase tracking-widest text-xs sm:text-sm">
                      Dados da Sessão
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium">
                      Configure os dados do Brainstorm e a equipe.
                    </p>
                  </div>
                  <div className="flex w-full sm:w-auto gap-2">
                    <button
                      onClick={deletarSessao}
                      disabled={saving}
                      className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-red-100 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        delete
                      </span>{" "}
                      <span className="hidden xs:inline">Excluir Sessão</span>
                    </button>
                    <button
                      onClick={salvarPlanejamento}
                      disabled={saving}
                      className="flex-[2] sm:flex-none bg-[#064384] hover:bg-blue-900 text-white px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[16px] animate-spin-slow">
                        {saving ? "sync" : "save"}
                      </span>{" "}
                      <span className="truncate">Salvar Planejamento</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Tema (Problema a resolver)
                    </label>
                    <input
                      value={sessaoAtiva.nm_tema}
                      onChange={(e) => updateSessao("nm_tema", e.target.value)}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm sm:text-base text-[#064384] outline-none focus:border-[#064384] focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Data da Sessão
                    </label>
                    <input
                      type="date"
                      value={sessaoAtiva.dt_sessao}
                      onChange={(e) =>
                        updateSessao("dt_sessao", e.target.value)
                      }
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Custo Estimado (R$)
                    </label>
                    <input
                      type="number"
                      value={sessaoAtiva.vl_custo}
                      onChange={(e) => updateSessao("vl_custo", e.target.value)}
                      className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] font-medium text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-slate-700 uppercase tracking-widest text-[11px] sm:text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#FF8323]">
                        group
                      </span>{" "}
                      Participantes da Sessão
                    </h3>
                    <button
                      onClick={addParticipante}
                      className="text-[#064384] text-[10px] sm:text-xs font-bold bg-blue-50 px-3 py-2 sm:py-1.5 rounded-lg hover:bg-[#064384] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        person_add
                      </span>{" "}
                      <span className="hidden xs:inline">Adicionar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {participantes.map((p, idx) => (
                      <div
                        key={p.cd_participante}
                        className="flex items-center gap-2"
                      >
                        <span className="bg-slate-100 text-slate-400 font-black text-xs size-9 sm:size-10 flex items-center justify-center rounded-xl shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          value={p.nm_participante}
                          onChange={(e) =>
                            updateParticipante(
                              p.cd_participante,
                              e.target.value,
                            )
                          }
                          className="flex-1 p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#064384] transition-all"
                          placeholder="Nome do Participante"
                        />
                        <button
                          onClick={() => deleteParticipante(p.cd_participante)}
                          className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 sm:p-2.5 rounded-xl transition-colors shrink-0"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    ))}
                    {participantes.length === 0 && (
                      <p className="text-xs text-slate-400 italic">
                        Nenhum participante adicionado.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FASE 3: SÓ REGISTRAR IDEIAS (SEM VOTAÇÃO) */}
          {activeTab === "ideias" && sessaoAtiva && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-10">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                  <h2 className="font-black text-[#064384] uppercase tracking-widest text-xs sm:text-sm">
                    Registro de Ideias
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium">
                    Anote as ideias dadas na sessão e vincule ao participante.
                  </p>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <button
                    onClick={addIdeia}
                    className="flex-1 sm:flex-none bg-blue-50 text-[#064384] hover:bg-[#064384] hover:text-white px-4 py-2.5 sm:py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      add
                    </span>{" "}
                    Adicionar Ideia
                  </button>
                  <button
                    onClick={salvarIdeiasEVotacao}
                    disabled={saving}
                    className="flex-1 sm:flex-none bg-[#FF8323] text-white px-5 sm:px-6 py-2.5 sm:py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-orange-600 transition-colors active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px] animate-spin-slow">
                      {saving ? "sync" : "save"}
                    </span>{" "}
                    Salvar Ideias
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="p-4 sm:p-5 w-3/5">A Ideia / Sugestão</th>
                        <th className="p-4 sm:p-5 w-2/5">Quem deu a ideia?</th>
                        <th className="p-4 sm:p-5 text-center">Excluir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ideias.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="p-8 text-center text-slate-400 font-medium"
                          >
                            Nenhuma ideia registrada. Comece o Brainstorm!
                          </td>
                        </tr>
                      )}
                      {ideias.map((ideia) => (
                        <tr
                          key={ideia.cd_ideia}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-3 sm:p-4">
                            <textarea
                              value={ideia.nm_ideia}
                              onChange={(e) =>
                                updateIdeia(
                                  ideia.cd_ideia,
                                  "nm_ideia",
                                  e.target.value,
                                )
                              }
                              className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none focus:bg-white focus:border-[#064384] focus:ring-4 focus:ring-primary/10 resize-none transition-all"
                              rows={2}
                              placeholder="Descreva a ideia..."
                            />
                          </td>
                          <td className="p-3 sm:p-4 align-top pt-3 sm:pt-4">
                            <select
                              value={ideia.cd_participante || ""}
                              onChange={(e) =>
                                updateIdeia(
                                  ideia.cd_ideia,
                                  "cd_participante",
                                  e.target.value,
                                )
                              }
                              className="w-full p-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold text-[#064384] outline-none focus:border-[#064384] focus:bg-white transition-all cursor-pointer"
                            >
                              <option value="" disabled>
                                Selecione o autor...
                              </option>
                              {participantes.map((p) => (
                                <option
                                  key={p.cd_participante}
                                  value={p.cd_participante}
                                >
                                  {p.nm_participante}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 sm:p-4 text-center align-top pt-5 sm:pt-6">
                            <button
                              onClick={() => deleteIdeia(ideia.cd_ideia)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* FASE 4: VOTAÇÃO E SELEÇÃO */}
          {activeTab === "votacao" && sessaoAtiva && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-10">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                  <h2 className="font-black text-[#064384] uppercase tracking-widest text-xs sm:text-sm">
                    Seleção e Avaliação
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium">
                    Dê notas de 0 a 10 para ranquear as ideias geradas.
                  </p>
                </div>
                <button
                  onClick={salvarIdeiasEVotacao}
                  disabled={saving}
                  className="w-full sm:w-auto bg-[#FF8323] text-white px-6 py-3 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-orange-600 transition-colors active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px] animate-spin-slow">
                    {saving ? "sync" : "save"}
                  </span>{" "}
                  Salvar Notas
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap min-w-[900px]">
                    <thead className="bg-[#064384] text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest border-b border-blue-900">
                      <tr>
                        <th className="p-4 sm:p-5 w-2/5">
                          Ideia (Somente Leitura)
                        </th>
                        <th className="p-4 sm:p-5">Autor</th>
                        <th className="p-4 sm:p-5 text-center bg-blue-800/80">
                          Notas dos Critérios (1 a 10)
                        </th>
                        <th className="p-4 sm:p-5 text-center bg-blue-900">
                          Média Final
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ideias.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-slate-400 font-medium"
                          >
                            Nenhuma ideia para votar. Volte ao passo anterior.
                          </td>
                        </tr>
                      )}
                      {[...ideias]
                        .sort((a, b) => b.nr_media_votos - a.nr_media_votos)
                        .map((ideia, idx) => (
                          <tr
                            key={ideia.cd_ideia}
                            className={`hover:bg-slate-50 transition-colors ${idx === 0 && ideia.nr_media_votos > 0 ? "bg-yellow-50/40" : ""}`}
                          >
                            <td className="p-4 sm:p-5 whitespace-normal min-w-[250px]">
                              <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                                {ideia.nm_ideia}
                              </p>
                            </td>
                            <td className="p-4 sm:p-5">
                              <span className="text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 truncate max-w-[150px] inline-block">
                                {getNomeAutor(ideia.cd_participante)}
                              </span>
                            </td>
                            <td className="p-4 sm:p-5">
                              <div className="flex gap-2 justify-center">
                                {[0, 1, 2, 3, 4].map((nIdx) => (
                                  <input
                                    key={nIdx}
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={ideia.js_votos?.[nIdx] || 0}
                                    onChange={(e) => {
                                      const novosVotos = [
                                        ...(ideia.js_votos || [0, 0, 0, 0, 0]),
                                      ];
                                      novosVotos[nIdx] =
                                        parseInt(e.target.value) || 0;
                                      if (novosVotos[nIdx] > 10)
                                        novosVotos[nIdx] = 10;
                                      updateIdeia(
                                        ideia.cd_ideia,
                                        "js_votos",
                                        novosVotos,
                                      );
                                    }}
                                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xs sm:text-sm font-black text-[#064384] border border-slate-200 rounded-xl bg-white shadow-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="p-4 sm:p-5 text-center">
                              <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl py-2 px-4 shadow-sm w-fit mx-auto">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                                  Média
                                </span>
                                <span
                                  className={`text-xl sm:text-2xl font-black leading-none ${idx === 0 && ideia.nr_media_votos > 0 ? "text-[#FF8323]" : "text-[#064384]"}`}
                                >
                                  {Number(ideia.nr_media_votos).toFixed(1)}
                                </span>
                                {idx === 0 && ideia.nr_media_votos > 0 && (
                                  <span className="text-[8px] sm:text-[9px] font-black text-yellow-600 uppercase tracking-widest mt-1.5 bg-yellow-100 px-2 py-0.5 rounded-md border border-yellow-200">
                                    1º Lugar
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* FASE 5: DASHBOARD DE RESULTADOS */}
          {activeTab === "dashboard" && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-[#064384] flex flex-col justify-center">
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Participantes
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-[#064384]">
                    {participantes.length}
                  </p>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-orange-400 flex flex-col justify-center">
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Ideias Geradas
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-800">
                    {ideias.length}
                  </p>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-green-500 flex flex-col justify-center">
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Custo da Sessão
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-green-600 truncate">
                    R$ {Number(sessaoAtiva?.vl_custo || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-[#064384] p-5 sm:p-6 rounded-2xl shadow-sm text-white relative overflow-hidden flex flex-col justify-center">
                  <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl sm:text-7xl opacity-10 rotate-12">
                    emoji_events
                  </span>
                  <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-1 opacity-70">
                    Melhor Ideia
                  </p>
                  <p className="text-sm sm:text-base font-bold truncate pr-4 leading-tight">
                    {[...ideias].sort(
                      (a, b) => b.nr_media_votos - a.nr_media_votos,
                    )[0]?.nm_ideia || "Ainda sem ideias"}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="font-black text-[#064384] uppercase tracking-widest text-xs sm:text-sm mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8323]">
                    format_list_numbered
                  </span>{" "}
                  Ranking de Soluções
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {[...ideias]
                    .sort((a, b) => b.nr_media_votos - a.nr_media_votos)
                    .map((id, idx) => (
                      <div
                        key={id.cd_ideia}
                        className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl border ${idx === 0 ? "bg-yellow-50/50 border-yellow-200 shadow-sm" : "bg-slate-50 border-slate-100"}`}
                      >
                        <div
                          className={`size-10 sm:size-12 shrink-0 flex items-center justify-center rounded-full font-black text-white text-base sm:text-lg shadow-sm ${idx === 0 ? "bg-yellow-500" : "bg-[#064384]"}`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm sm:text-lg mb-1 truncate">
                            {id.nm_ideia}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-[14px]">
                              person
                            </span>{" "}
                            {getNomeAutor(id.cd_participante)}
                          </p>
                        </div>
                        <div className="text-right bg-white px-3 sm:px-5 py-2 sm:py-3 rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-col justify-center items-center">
                          <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                            Média
                          </p>
                          <p
                            className={`text-xl sm:text-2xl font-black leading-none ${idx === 0 ? "text-[#FF8323]" : "text-[#064384]"}`}
                          >
                            {Number(id.nr_media_votos).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                  {ideias.length === 0 && (
                    <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
                        inbox
                      </span>
                      <p className="text-sm font-bold text-slate-500">
                        Nenhuma ideia cadastrada no ranking.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
