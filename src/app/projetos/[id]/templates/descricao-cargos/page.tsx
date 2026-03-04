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
        selecionarCargo(data[0]);
      } else {
        handleNovoCargo();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (params.id) {
      carregarListaCargos();
    }
  }, [params.id]);

  // 2. Função para carregar os dados de um cargo específico pro formulário
  const selecionarCargo = (data: any) => {
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
  };

  // 3. Prepara a tela para criar um cargo DO ZERO
  const handleNovoCargo = () => {
    setRegistroId(null);
    setForm(formInicial);
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
      handleNovoCargo(); // Limpa a tela
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
      <div className="p-20 text-center text-[#064384] font-bold">
        Carregando painel de cargos...
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col h-screen overflow-hidden">
      {/* HEADER FIXO */}
      <header className="bg-white px-8 py-4 flex justify-between items-center border-b shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-[#064384]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <h1 className="font-black text-[#064384] text-lg uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined">badge</span> Mapeamento
            de Cargos
          </h1>
        </div>

        {/* GRUPO DE BOTÕES (Excluir e Salvar) */}
        <div className="flex items-center gap-3">
          {registroId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-red-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>
              <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FF8323] hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "sync" : "save"}
            </span>{" "}
            Salvar Cargo Atual
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL COM SIDEBAR */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - LISTA DE CARGOS */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-black text-slate-700 text-sm uppercase tracking-widest">
              Cargos Mapeados
            </h2>
            <span className="bg-[#064384]/10 text-[#064384] text-xs font-bold px-2 py-1 rounded-md">
              {listaCargos.length}
            </span>
          </div>

          <div className="p-4 border-b border-slate-100">
            <button
              onClick={handleNovoCargo}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-[#064384] text-[#064384] hover:text-white border border-blue-100 py-2.5 rounded-lg font-bold text-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>{" "}
              Adicionar Novo Cargo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {listaCargos.length === 0 ? (
              <p className="text-center text-sm font-medium text-slate-400 mt-10">
                Nenhum cargo cadastrado ainda.
              </p>
            ) : (
              listaCargos.map((c) => (
                <div
                  key={c.cd_descricao}
                  onClick={() => selecionarCargo(c)}
                  className={`p-3 rounded-lg cursor-pointer border transition-all ${
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
                  <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1">
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
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-[800px] mx-auto">
            {/* Aviso quando está criando um novo */}
            {!registroId && (
              <div className="bg-blue-50 border border-blue-200 text-[#064384] px-4 py-3 rounded-xl mb-6 flex items-center gap-3 shadow-sm">
                <span className="material-symbols-outlined">info</span>
                <p className="text-sm font-bold">
                  Você está criando um{" "}
                  <span className="uppercase tracking-widest">Novo Cargo</span>.
                </p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSave}>
              {/* CABEÇALHO DO CARGO */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">
                  Informações Base
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-slate-700">
                      Nome do Cargo
                    </label>
                    <input
                      value={form.cargo}
                      onChange={(e) =>
                        setForm({ ...form, cargo: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                      placeholder="Ex: Analista Financeiro"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      CBO
                    </label>
                    <input
                      value={form.cbo}
                      onChange={(e) =>
                        setForm({ ...form, cbo: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                      placeholder="Ex: 2522-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">
                    Tipo de Cargo
                  </label>
                  <div className="flex gap-4">
                    {[
                      { value: "ADMINISTRATIVO", label: "Administrativo" },
                      { value: "OPERACIONAL", label: "Operacional" },
                      { value: "GERENCIAL", label: "Gerencial" },
                    ].map((tipo) => (
                      <label
                        key={tipo.value}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="radio"
                          checked={form.tipo === tipo.value}
                          onChange={() =>
                            setForm({ ...form, tipo: tipo.value })
                          }
                          className="accent-[#064384] size-4"
                        />{" "}
                        {tipo.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Missão do Cargo (Resumo)
                  </label>
                  <textarea
                    value={form.missao}
                    onChange={(e) =>
                      setForm({ ...form, missao: e.target.value })
                    }
                    rows={3}
                    className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384] resize-none"
                    placeholder="Qual o propósito principal desta função na empresa?"
                  />
                </div>
              </div>

              {/* DESCRIÇÃO DAS ATIVIDADES */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                  Descrição das Atividades
                </h2>
                {form.atividades.map((atividade, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="font-black text-slate-300 w-6 text-right">
                      {idx + 1}.
                    </span>
                    <input
                      value={atividade}
                      onChange={(e) =>
                        handleAtividadeChange(idx, e.target.value)
                      }
                      className="flex-1 p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                      placeholder="Descreva a atividade..."
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAtividade(idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddAtividade}
                  className="text-sm font-bold text-[#064384] flex items-center gap-1 mt-2 hover:underline"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add_circle
                  </span>{" "}
                  Adicionar Atividade
                </button>
              </div>

              {/* REQUISITOS E COMPETÊNCIAS */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                  Requisitos e Competências (C.H.A)
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
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
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
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
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-slate-700">
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
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-slate-700">
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
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 mt-4">
                    <label className="text-xs font-bold text-slate-700">
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
                      className="w-full p-3 bg-slate-50 border rounded-lg resize-none outline-none focus:border-[#064384]"
                      placeholder="Conhecimentos e habilidades fundamentais..."
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-slate-700">
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
                      className="w-full p-3 bg-slate-50 border rounded-lg resize-none outline-none focus:border-[#064384]"
                      placeholder="O que faz esse profissional se destacar?"
                    />
                  </div>
                </div>
              </div>

              {/* CONDIÇÕES DE TRABALHO */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                  Condições e Informações Gerais
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                    <span className="text-sm font-semibold text-slate-700">
                      Trabalho Noturno (22h às 5h)?
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
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
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#064384]"></div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                    <span className="text-sm font-semibold text-slate-700">
                      Escala de Revezamento?
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
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
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#064384]"></div>
                    </label>
                  </div>

                  <div className="col-span-2 space-y-2 mt-2">
                    <label className="text-xs font-bold text-slate-700">
                      Viagens
                    </label>
                    <div className="flex gap-6">
                      {[
                        { value: "NUNCA", label: "Não viaja" },
                        { value: "EVENTUAL", label: "Eventuais" },
                        { value: "FREQUENTE", label: "Habituais" },
                      ].map((opcao) => (
                        <label
                          key={opcao.value}
                          className="flex items-center gap-2 text-sm cursor-pointer"
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
                            className="accent-[#064384] size-4"
                          />{" "}
                          {opcao.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 col-span-2 md:col-span-1 mt-2">
                    <label className="text-xs font-bold text-slate-700">
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
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                      placeholder="Ex: Administrativo, Fábrica"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 md:col-span-1 mt-2">
                    <label className="text-xs font-bold text-slate-700">
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
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                      placeholder="Ex: Gerente Geral"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 mt-2">
                    <label className="text-xs font-bold text-slate-700">
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
                      className="w-full p-3 bg-slate-50 border rounded-lg outline-none focus:border-[#064384]"
                    />
                  </div>
                </div>
              </div>

              {/* RESPONSABILIDADES */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                  Nível de Responsabilidade
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  O ocupante deste cargo é responsável por:
                </p>

                <div className="grid grid-cols-2 gap-4">
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
                      className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border"
                    >
                      <span className="text-sm font-semibold text-slate-700">
                        {item.label}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
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
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#064384]"></div>
                      </label>
                    </div>
                  ))}

                  <div className="col-span-2 space-y-2 mt-4 pt-4 border-t">
                    <label className="text-xs font-bold text-slate-700">
                      Relaciona-se com o cliente?
                    </label>
                    <div className="flex gap-6">
                      {[
                        { value: "NUNCA", label: "Nunca" },
                        { value: "EVENTUAL", label: "Eventualmente" },
                        { value: "FREQUENTE", label: "Sempre" },
                      ].map((opcao) => (
                        <label
                          key={opcao.value}
                          className="flex items-center gap-2 text-sm cursor-pointer"
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
                            className="accent-[#064384] size-4"
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
