"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Estado inicial limpo para facilitar na hora de clicar em "Novo Cargo"
const formInicial = {
  cargo: "",
  tipo: "ADMINISTRATIVO",
  cbo: "",
  missao: "",
  atividades: [""],
  requisitos: { escolaridade: "", experiencia: "", cursos: "", outros: "" },
  competencias: { basicas: "", diferenciadoras: "" },
  condicoes: {
    noturno: false,
    revezamento: false,
    viagens: "NUNCA",
    setor: "",
    subordinado: "",
    outras_infos: "",
  },
  responsabilidades: {
    supervisao: false,
    bens: false,
    valores: false,
    sigilo: false,
    cliente: "NUNCA",
  },
};

export default function DescricaoCargosPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lista de todos os cargos do projeto
  const [listaCargos, setListaCargos] = useState<any[]>([]);

  // Controle de qual cargo está sendo editado no momento (null = criando um novo)
  const [registroId, setRegistroId] = useState<string | null>(null);
  const [form, setForm] = useState(formInicial);

  // 1. Carrega todos os cargos salvos para este projeto logo que a tela abre
  const carregarListaCargos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("DESCRICOES_CARGOS")
      .select("*")
      .eq("cd_projeto", params.id)
      .order("ts_criacao", { ascending: false });

    if (data) {
      setListaCargos(data);
      // Se já tiver cargos salvos, carrega o primeiro da lista no formulário
      if (data.length > 0) {
        selecionarCargo(data[0], false);
      } else {
        handleNovoCargo(false);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (params.id) {
      carregarListaCargos();
    }
  }, [params.id]);

  // Rolar para o formulário no mobile
  const scrollToForm = () => {
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document
          .getElementById("area-formulario")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // 2. Função para carregar os dados de um cargo específico pro formulário
  const selecionarCargo = (data: any, autoScroll = true) => {
    setRegistroId(data.cd_descricao);
    setForm({
      cargo: data.nm_cargo || "",
      tipo: data.tp_cargo || "ADMINISTRATIVO",
      cbo: data.nr_cbo || "",
      missao: data.ds_missao || "",
      atividades: data.js_atividades?.length ? data.js_atividades : [""],
      requisitos: {
        escolaridade: data.ds_req_escolaridade || "",
        experiencia: data.ds_req_experiencia || "",
        cursos: data.ds_req_cursos || "",
        outros: data.ds_req_outros || "",
      },
      competencias: {
        basicas: data.ds_comp_basicas || "",
        diferenciadoras: data.ds_comp_diferenciadoras || "",
      },
      condicoes: {
        noturno: data.sn_trabalho_noturno || false,
        revezamento: data.sn_trabalho_revezamento || false,
        viagens: data.tp_viagens || "NUNCA",
        setor: data.nm_setor || "",
        subordinado: data.nm_subordinado_a || "",
        outras_infos: data.ds_condicoes_outras || "",
      },
      responsabilidades: {
        supervisao: data.sn_resp_supervisao || false,
        bens: data.sn_resp_bens || false,
        valores: data.sn_resp_valores || false,
        sigilo: data.sn_resp_sigilo || false,
        cliente: data.tp_contato_cliente || "NUNCA",
      },
    });
    if (autoScroll) scrollToForm();
  };

  // 3. Prepara a tela para criar um cargo DO ZERO
  const handleNovoCargo = (autoScroll = true) => {
    setRegistroId(null);
    setForm(formInicial);
    if (autoScroll) scrollToForm();
  };

  const handleAddAtividade = () =>
    setForm({ ...form, atividades: [...form.atividades, ""] });
  const handleRemoveAtividade = (idx: number) => {
    const novas = form.atividades.filter((_, i) => i !== idx);
    setForm({ ...form, atividades: novas });
  };
  const handleAtividadeChange = (idx: number, valor: string) => {
    const novas = [...form.atividades];
    novas[idx] = valor;
    setForm({ ...form, atividades: novas });
  };

  // 4. DELETAR um cargo do banco
  const handleDelete = async () => {
    if (!registroId) return;

    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este cargo? Esta ação não pode ser desfeita.",
    );
    if (!confirmar) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("DESCRICOES_CARGOS")
        .delete()
        .eq("cd_descricao", registroId);

      if (error) throw error;

      alert("Cargo excluído com sucesso!");
      handleNovoCargo(false); // Limpa a tela
      carregarListaCargos(); // Atualiza a barra lateral removendo o item apagado
    } catch (error: any) {
      console.error(error);
      alert(
        "Erro ao excluir o cargo. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  };

  // 5. Salva ou Atualiza no banco
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      cd_projeto: params.id,
      nm_cargo: form.cargo,
      tp_cargo: form.tipo,
      nr_cbo: form.cbo,
      ds_missao: form.missao,
      js_atividades: form.atividades.filter((a) => a.trim() !== ""),
      ds_req_escolaridade: form.requisitos.escolaridade,
      ds_req_experiencia: form.requisitos.experiencia,
      ds_req_cursos: form.requisitos.cursos,
      ds_req_outros: form.requisitos.outros,
      ds_comp_basicas: form.competencias.basicas,
      ds_comp_diferenciadoras: form.competencias.diferenciadoras,
      sn_trabalho_noturno: form.condicoes.noturno,
      sn_trabalho_revezamento: form.condicoes.revezamento,
      tp_viagens: form.condicoes.viagens,
      nm_setor: form.condicoes.setor,
      nm_subordinado_a: form.condicoes.subordinado,
      ds_condicoes_outras: form.condicoes.outras_infos,
      sn_resp_supervisao: form.responsabilidades.supervisao,
      sn_resp_bens: form.responsabilidades.bens,
      sn_resp_valores: form.responsabilidades.valores,
      sn_resp_sigilo: form.responsabilidades.sigilo,
      tp_contato_cliente: form.responsabilidades.cliente,
    };

    try {
      if (registroId) {
        // Atualiza o cargo existente
        await supabase
          .from("DESCRICOES_CARGOS")
          .update(payload)
          .eq("cd_descricao", registroId);
      } else {
        // Insere um cargo novo
        const { data, error } = await supabase
          .from("DESCRICOES_CARGOS")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        if (data) setRegistroId(data.cd_descricao);
      }

      alert("Descrição de Cargo salva com sucesso!");
      carregarListaCargos();
    } catch (error: any) {
      console.error(error);
      alert("Erro ao salvar documento. Verifique os dados.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#064384]">
          progress_activity
        </span>
      </div>
    );
  }

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
              badge
            </span>
            <span className="truncate">Mapeamento de Cargos</span>
          </h1>
        </div>

        {/* GRUPO DE BOTÕES (Excluir e Salvar) */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {registroId && (
            <button
              type="button"
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
            </span>{" "}
            <span className="truncate">
              {saving ? "Salvando..." : "Salvar Cargo"}
            </span>
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL (SIDEBAR + FORMULÁRIO) */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full">
        {/* SIDEBAR - LISTA DE CARGOS */}
        <aside className="w-full lg:w-80 bg-white border-b lg:border-r lg:border-b-0 border-slate-200 flex flex-col shrink-0 z-0 shadow-sm h-[35vh] lg:h-full">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-widest">
              Cargos Mapeados
            </h2>
            <span className="bg-[#064384]/10 text-[#064384] text-xs font-bold px-2 py-1 rounded-md">
              {listaCargos.length}
            </span>
          </div>

          <div className="p-4 border-b border-slate-100">
            <button
              onClick={() => handleNovoCargo(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-[#064384] text-[#064384] hover:text-white border border-blue-100 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>{" "}
              Adicionar Novo Cargo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {listaCargos.length === 0 ? (
              <p className="text-center text-xs sm:text-sm font-medium text-slate-400 mt-6">
                Nenhum cargo cadastrado ainda.
              </p>
            ) : (
              listaCargos.map((c) => (
                <div
                  key={c.cd_descricao}
                  onClick={() => selecionarCargo(c, true)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all ${
                    registroId === c.cd_descricao
                      ? "bg-blue-50 border-[#064384]/30 shadow-sm"
                      : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <h3
                    className={`font-bold text-sm truncate ${registroId === c.cd_descricao ? "text-[#064384]" : "text-slate-700"}`}
                  >
                    {c.nm_cargo || "Cargo sem nome"}
                  </h3>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">
                      work
                    </span>{" "}
                    {c.tp_cargo}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ÁREA DO FORMULÁRIO */}
        <main
          id="area-formulario"
          className="flex-1 overflow-y-auto p-4 sm:p-8 relative scroll-smooth scrollbar-hide"
        >
          <div className="max-w-[800px] mx-auto pb-10">
            {/* Aviso quando está criando um novo */}
            {!registroId && (
              <div className="bg-blue-50 border border-blue-200 text-[#064384] px-4 py-3 rounded-2xl mb-6 flex items-center gap-3 shadow-sm">
                <span className="material-symbols-outlined shrink-0">info</span>
                <p className="text-xs sm:text-sm font-bold">
                  Você está criando um{" "}
                  <span className="uppercase tracking-widest">Novo Cargo</span>.
                </p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSave}>
              {/* CABEÇALHO DO CARGO */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    badge
                  </span>{" "}
                  Informações Base
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nome do Cargo *
                    </label>
                    <input
                      value={form.cargo}
                      onChange={(e) =>
                        setForm({ ...form, cargo: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                      placeholder="Ex: Analista Financeiro"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      CBO (Opcional)
                    </label>
                    <input
                      value={form.cbo}
                      onChange={(e) =>
                        setForm({ ...form, cbo: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                      placeholder="Ex: 2522-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tipo de Cargo
                  </label>
                  <div className="flex flex-wrap gap-4 sm:gap-6 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                    {[
                      { value: "ADMINISTRATIVO", label: "Administrativo" },
                      { value: "OPERACIONAL", label: "Operacional" },
                      { value: "GERENCIAL", label: "Gerencial" },
                    ].map((tipo) => (
                      <label
                        key={tipo.value}
                        className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 cursor-pointer"
                      >
                        <input
                          type="radio"
                          checked={form.tipo === tipo.value}
                          onChange={() =>
                            setForm({ ...form, tipo: tipo.value })
                          }
                          className="accent-[#064384] w-4 h-4 shrink-0"
                        />{" "}
                        {tipo.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Missão do Cargo (Resumo)
                  </label>
                  <textarea
                    value={form.missao}
                    onChange={(e) =>
                      setForm({ ...form, missao: e.target.value })
                    }
                    rows={3}
                    className="w-full p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] focus:ring-4 focus:ring-primary/10 transition-all resize-none font-medium text-sm leading-relaxed"
                    placeholder="Qual o propósito principal desta função na empresa?"
                  />
                </div>
              </div>

              {/* DESCRIÇÃO DAS ATIVIDADES */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    task_alt
                  </span>{" "}
                  Descrição das Atividades
                </h2>
                <div className="space-y-3">
                  {form.atividades.map((atividade, idx) => (
                    <div
                      key={idx}
                      className="flex items-start sm:items-center gap-2 sm:gap-3"
                    >
                      <span className="font-black text-slate-300 w-5 sm:w-6 text-right mt-3 sm:mt-0">
                        {idx + 1}.
                      </span>
                      <textarea
                        value={atividade}
                        onChange={(e) =>
                          handleAtividadeChange(idx, e.target.value)
                        }
                        rows={window.innerWidth < 640 ? 2 : 1}
                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] transition-all font-medium text-sm resize-none"
                        placeholder="Descreva a atividade rotineira..."
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAtividade(idx)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors mt-1 sm:mt-0 shrink-0"
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddAtividade}
                  className="text-xs sm:text-sm font-bold text-[#064384] flex items-center gap-1.5 mt-4 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors ml-6"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add_circle
                  </span>{" "}
                  Adicionar Linha
                </button>
              </div>

              {/* REQUISITOS E COMPETÊNCIAS */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    psychology
                  </span>{" "}
                  Requisitos e Competências
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Escolaridade Mínima
                    </label>
                    <input
                      value={form.requisitos.escolaridade}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          requisitos: {
                            ...form.requisitos,
                            escolaridade: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] transition-all font-medium text-sm"
                      placeholder="Ex: Superior Incompleto"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Tempo de Experiência
                    </label>
                    <input
                      value={form.requisitos.experiencia}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          requisitos: {
                            ...form.requisitos,
                            experiencia: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] transition-all font-medium text-sm"
                      placeholder="Ex: 2 anos"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Cursos Específicos
                    </label>
                    <input
                      value={form.requisitos.cursos}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          requisitos: {
                            ...form.requisitos,
                            cursos: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] transition-all font-medium text-sm"
                      placeholder="Ex: Excel Avançado"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Outros Requisitos
                    </label>
                    <input
                      value={form.requisitos.outros}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          requisitos: {
                            ...form.requisitos,
                            outros: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] transition-all font-medium text-sm"
                      placeholder="Ex: CNH Categoria B"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 mt-2">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Competências Básicas (C.H.A)
                    </label>
                    <textarea
                      value={form.competencias.basicas}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          competencias: {
                            ...form.competencias,
                            basicas: e.target.value,
                          },
                        })
                      }
                      rows={2}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:border-[#064384] transition-all font-medium text-sm"
                      placeholder="Conhecimentos e habilidades fundamentais..."
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Competências Diferenciadoras
                    </label>
                    <textarea
                      value={form.competencias.diferenciadoras}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          competencias: {
                            ...form.competencias,
                            diferenciadoras: e.target.value,
                          },
                        })
                      }
                      rows={2}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:border-[#064384] transition-all font-medium text-sm"
                      placeholder="O que faz esse profissional se destacar?"
                    />
                  </div>
                </div>
              </div>

              {/* CONDIÇÕES E INFORMAÇÕES GERAIS */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    rule
                  </span>{" "}
                  Condições e Informações Gerais
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs sm:text-sm font-bold text-slate-700 leading-tight">
                      Trabalho Noturno{" "}
                      <br className="hidden sm:block lg:hidden" />
                      <span className="font-medium text-slate-500 text-[10px] sm:text-xs">
                        (22h às 5h)?
                      </span>
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={form.condicoes.noturno}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            condicoes: {
                              ...form.condicoes,
                              noturno: e.target.checked,
                            },
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs sm:text-sm font-bold text-slate-700 leading-tight">
                      Escala de Revezamento?
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={form.condicoes.revezamento}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            condicoes: {
                              ...form.condicoes,
                              revezamento: e.target.checked,
                            },
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="sm:col-span-2 space-y-2 mt-2">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Viagens
                    </label>
                    <div className="flex flex-wrap gap-4 sm:gap-6 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                      {[
                        { value: "NUNCA", label: "Não viaja" },
                        { value: "EVENTUAL", label: "Eventuais" },
                        { value: "FREQUENTE", label: "Habituais" },
                      ].map((opcao) => (
                        <label
                          key={opcao.value}
                          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 cursor-pointer"
                        >
                          <input
                            type="radio"
                            checked={form.condicoes.viagens === opcao.value}
                            onChange={() =>
                              setForm({
                                ...form,
                                condicoes: {
                                  ...form.condicoes,
                                  viagens: opcao.value,
                                },
                              })
                            }
                            className="accent-[#064384] w-4 h-4 shrink-0"
                          />{" "}
                          {opcao.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 md:col-span-1 mt-2">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Setor(es) de execução
                    </label>
                    <input
                      value={form.condicoes.setor}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          condicoes: {
                            ...form.condicoes,
                            setor: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] transition-all font-medium text-sm"
                      placeholder="Ex: Administrativo, Fábrica"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 md:col-span-1 mt-2">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Subordinado a
                    </label>
                    <input
                      value={form.condicoes.subordinado}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          condicoes: {
                            ...form.condicoes,
                            subordinado: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] transition-all font-medium text-sm"
                      placeholder="Ex: Gerente Geral"
                    />
                  </div>

                  {/* CAMPO DE OUTRAS INFORMAÇÕES GARANTIDO AQUI */}
                  <div className="space-y-1.5 sm:col-span-2 mt-2">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Outras informações
                    </label>
                    <input
                      value={form.condicoes.outras_infos}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          condicoes: {
                            ...form.condicoes,
                            outras_infos: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#064384] transition-all font-medium text-sm"
                      placeholder="Alguma condição específica do cargo?"
                    />
                  </div>
                </div>
              </div>

              {/* RESPONSABILIDADES */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                  Nível de Responsabilidade
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  O ocupante deste cargo é responsável por:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { label: "Supervisão de Pessoas?", key: "supervisao" },
                    { label: "Bens Materiais da Empresa?", key: "bens" },
                    { label: "Valores Financeiros?", key: "valores" },
                    {
                      label: "Documentos e Relatórios Sigilosos?",
                      key: "sigilo",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex justify-between items-center bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-700 leading-tight">
                        {item.label}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            form.responsabilidades[
                              item.key as keyof typeof form.responsabilidades
                            ] as boolean
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,
                              responsabilidades: {
                                ...form.responsabilidades,
                                [item.key]: e.target.checked,
                              },
                            })
                          }
                        />
                        <div className="w-10 h-5 sm:w-11 sm:h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}

                  {/* CAMPO RELACIONA-SE COM CLIENTE GARANTIDO AQUI */}
                  <div className="sm:col-span-2 space-y-2 mt-4 pt-4 border-t border-slate-100">
                    <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Relaciona-se com o cliente?
                    </label>
                    <div className="flex flex-wrap gap-4 sm:gap-6 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                      {[
                        { value: "NUNCA", label: "Nunca" },
                        { value: "EVENTUAL", label: "Eventualmente" },
                        { value: "FREQUENTE", label: "Sempre" },
                      ].map((opcao) => (
                        <label
                          key={opcao.value}
                          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 cursor-pointer"
                        >
                          <input
                            type="radio"
                            checked={
                              form.responsabilidades.cliente === opcao.value
                            }
                            onChange={() =>
                              setForm({
                                ...form,
                                responsabilidades: {
                                  ...form.responsabilidades,
                                  cliente: opcao.value,
                                },
                              })
                            }
                            className="accent-[#064384] w-4 h-4 shrink-0"
                          />{" "}
                          {opcao.label}
                        </label>
                      ))}
                    </div>
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
