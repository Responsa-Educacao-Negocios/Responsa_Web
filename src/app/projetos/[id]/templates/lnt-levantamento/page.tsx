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
      if (data.length > 0) selecionarTreinamento(data[0]);
      else handleNovo();
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarTreinamentos();
  }, [params.id]);

  const selecionarTreinamento = (t: any) => {
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
      cargaHoraria: t.nr_carga_horaria?.toString() || "", // Lendo da nova coluna
      custo: t.vl_custo?.toString() || "",
      objetivo: t.ds_objetivo || "",
      conteudo: t.ds_conteudo || "",
      resultados: t.ds_resultados_esperados || "",
      recursosDidaticos: t.ds_recursos_didaticos || "",
      infraestrutura: t.ds_infraestrutura || "",
      participantesNomes: t.ds_lista_participantes || "",
    });
  };

  const handleNovo = () => {
    setRegistroId(null);
    setForm(formInicial);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome) return alert("O Nome da Capacitação é obrigatório.");
    setSaving(true);

    // Mapeamento exato com os nomes KADMOS (incluindo as novidades)
    const payload = {
      cd_projeto: params.id,
      nm_treinamento: form.nome,
      nm_area: form.area,
      ds_necessidade: form.necessidade,
      tp_capacitacao: form.tipo, // ENUM da modalidade
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
      nr_carga_horaria: form.cargaHoraria ? parseInt(form.cargaHoraria) : null, // Enviando como INT
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
      handleNovo();
      carregarTreinamentos();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center text-[#064384] font-bold">
        Carregando painel LNT...
      </div>
    );

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
            <span className="material-symbols-outlined">school</span> LNT -
            Capacitações
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {registroId && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 border border-red-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>{" "}
              <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FF8323] hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "sync" : "save"}
            </span>{" "}
            Salvar
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - LISTA DE TREINAMENTOS */}
        <aside className="w-80 bg-white border-r flex flex-col h-full shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-black text-slate-700 text-sm uppercase tracking-widest">
              Plano Anual
            </h2>
            <span className="bg-[#064384]/10 text-[#064384] text-xs font-bold px-2 py-1 rounded-md">
              {listaTreinamentos.length}
            </span>
          </div>

          <div className="p-4 border-b border-slate-100">
            <button
              onClick={handleNovo}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-[#064384] text-[#064384] hover:text-white py-3 rounded-lg font-bold text-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>{" "}
              Novo Treinamento
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {listaTreinamentos.map((t) => (
              <div
                key={t.cd_treinamento}
                onClick={() => selecionarTreinamento(t)}
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
                      className="w-2 h-2 rounded-full bg-green-500 mt-1 shrink-0"
                      title="Concluído"
                    ></span>
                  )}
                  {t.tp_status === "PLANEJADO" && (
                    <span
                      className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0"
                      title="Planejado"
                    ></span>
                  )}
                  {t.tp_status === "EM_ANDAMENTO" && (
                    <span
                      className="w-2 h-2 rounded-full bg-yellow-400 mt-1 shrink-0"
                      title="Em Andamento"
                    ></span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {t.nm_area || "Área não definida"}
                </p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                  {t.tp_prioridade}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ÁREA DO FORMULÁRIO */}
        <main className="flex-1 overflow-y-auto p-8 relative bg-slate-50/50">
          <div className="max-w-[800px] mx-auto pb-10">
            {!registroId && (
              <div className="bg-blue-50 border border-blue-200 text-[#064384] px-4 py-3 rounded-xl mb-6 flex items-center gap-3 shadow-sm">
                <span className="material-symbols-outlined">info</span>
                <p className="text-sm font-bold">
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
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h2 className="text-sm font-black text-[#064384] uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    find_in_page
                  </span>{" "}
                  Levantamento da Necessidade
                </h2>

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      Nome da Capacitação{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.nome}
                      onChange={(e) =>
                        setForm({ ...form, nome: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl focus:border-[#064384] outline-none font-semibold text-slate-800"
                      placeholder="Ex: Curso de Liderança Avançada"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Área / Departamento
                    </label>
                    <input
                      value={form.area}
                      onChange={(e) =>
                        setForm({ ...form, area: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl focus:border-[#064384] outline-none"
                      placeholder="Ex: Comercial"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Responsável pela Demanda
                    </label>
                    <input
                      value={form.responsavel}
                      onChange={(e) =>
                        setForm({ ...form, responsavel: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl focus:border-[#064384] outline-none"
                      placeholder="Quem solicitou?"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      Necessidade Identificada
                    </label>
                    <textarea
                      value={form.necessidade}
                      onChange={(e) =>
                        setForm({ ...form, necessidade: e.target.value })
                      }
                      rows={2}
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl focus:border-[#064384] outline-none resize-none"
                      placeholder="Por que este treinamento é necessário? (Gap de competência, novo sistema, etc)"
                    />
                  </div>

                  {/* DROP DE MODALIDADE ADICIONADO AQUI */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      Tipo (Modalidade)
                    </label>
                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        setForm({ ...form, tipo: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl focus:border-[#064384] outline-none font-bold text-slate-700"
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

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Prioridade
                    </label>
                    <select
                      value={form.prioridade}
                      onChange={(e) =>
                        setForm({ ...form, prioridade: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl focus:border-[#064384] outline-none font-bold text-slate-700"
                    >
                      <option value="BAIXA">🟢 Baixa</option>
                      <option value="MEDIA">🟡 Média</option>
                      <option value="ALTA">🟠 Alta</option>
                      <option value="URGENTE">🔴 Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl focus:border-[#064384] outline-none font-bold text-slate-700"
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
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h2 className="text-sm font-black text-[#FF8323] uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    event_note
                  </span>{" "}
                  Planejamento e Logística
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      Público-Alvo
                    </label>
                    <input
                      value={form.publico}
                      onChange={(e) =>
                        setForm({ ...form, publico: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none"
                      placeholder="Ex: Lideranças da Fábrica"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Nº Participantes
                    </label>
                    <input
                      type="number"
                      value={form.participantes}
                      onChange={(e) =>
                        setForm({ ...form, participantes: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none"
                      placeholder="Ex: 15"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-bold text-slate-700">
                      Lista de Participantes (Nomes)
                    </label>
                    <textarea
                      value={form.participantesNomes}
                      onChange={(e) =>
                        setForm({ ...form, participantesNomes: e.target.value })
                      }
                      rows={2}
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none"
                      placeholder="Ex: João Silva, Maria Souza..."
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-bold text-slate-700">
                      Instrutor / Fornecedor
                    </label>
                    <input
                      value={form.instrutor}
                      onChange={(e) =>
                        setForm({ ...form, instrutor: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none"
                      placeholder="Nome da empresa ou consultor"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-bold text-slate-700">
                      Local de Realização
                    </label>
                    <input
                      value={form.local}
                      onChange={(e) =>
                        setForm({ ...form, local: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none"
                      placeholder="Ex: Sala de Reuniões Matriz"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Data Prevista
                    </label>
                    <input
                      type="date"
                      value={form.data}
                      onChange={(e) =>
                        setForm({ ...form, data: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={form.hora}
                      onChange={(e) =>
                        setForm({ ...form, hora: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none text-sm"
                    />
                  </div>

                  {/* AJUSTE PARA CARGA HORÁRIA NUMÉRICA */}
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Carga Horária (Horas)
                    </label>
                    <input
                      type="number"
                      value={form.cargaHoraria}
                      onChange={(e) =>
                        setForm({ ...form, cargaHoraria: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none"
                      placeholder="Ex: 8"
                    />
                  </div>

                  <div className="md:col-span-3 bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
                    <label className="text-sm font-black text-green-800">
                      Custo Total Estimado (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.custo}
                      onChange={(e) =>
                        setForm({ ...form, custo: e.target.value })
                      }
                      className="w-48 p-2 bg-white border border-green-200 rounded-lg outline-none text-right font-bold text-green-700"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO 3: PLANO DIDÁTICO */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    menu_book
                  </span>{" "}
                  Plano Didático
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Objetivo do Treinamento
                    </label>
                    <textarea
                      value={form.objetivo}
                      onChange={(e) =>
                        setForm({ ...form, objetivo: e.target.value })
                      }
                      rows={2}
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none resize-none"
                      placeholder="O que os participantes devem aprender ou melhorar?"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Conteúdo Programático
                    </label>
                    <textarea
                      value={form.conteudo}
                      onChange={(e) =>
                        setForm({ ...form, conteudo: e.target.value })
                      }
                      rows={4}
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none"
                      placeholder="Lista dos temas, módulos ou assuntos que serão abordados."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Resultados Esperados
                    </label>
                    <textarea
                      value={form.resultados}
                      onChange={(e) =>
                        setForm({ ...form, resultados: e.target.value })
                      }
                      rows={2}
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none resize-none"
                      placeholder="Como o sucesso deste treinamento será medido?"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO 4: RECURSOS */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    devices
                  </span>{" "}
                  Recursos Necessários
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Recursos Instrucionais / Didáticos
                    </label>
                    <textarea
                      value={form.recursosDidaticos}
                      onChange={(e) =>
                        setForm({ ...form, recursosDidaticos: e.target.value })
                      }
                      rows={3}
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none resize-none"
                      placeholder="Apostilas, dinâmicas, brindes, certificados..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Infraestrutura Necessária
                    </label>
                    <textarea
                      value={form.infraestrutura}
                      onChange={(e) =>
                        setForm({ ...form, infraestrutura: e.target.value })
                      }
                      rows={3}
                      className="w-full mt-1 p-3 bg-slate-50 border rounded-xl outline-none resize-none"
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
