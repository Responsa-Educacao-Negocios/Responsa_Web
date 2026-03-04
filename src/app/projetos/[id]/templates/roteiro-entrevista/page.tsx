"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// DEFINIÇÃO DOS ROTEIROS BASEADOS NO DOCUMENTO (Com chaves que batem com o ENUM do banco)
const DICIONARIO_ROTEIROS: any = {
  ROTEIRO_01: {
    titulo: "Roteiro 01 - Profissional e Metas",
    perguntas: [
      "Por que você escolheu essa profissão?",
      "Como você avalia o seu desenvolvimento profissional até o presente momento?",
      "Quais são as suas principais limitações profissionais?",
      "Qual é a sua meta profissional de longo prazo?",
      "O que mais lhe irrita no ambiente de trabalho?",
      "Qual foi a situação profissional mais difícil que você resolveu? Como?",
      "Em seu último emprego, quais foram as suas realizações mais importantes?",
      "Qual objetivo você não conseguiu atingir em seu último emprego?",
      "Dentre os gerentes com os quais você trabalhou, qual foi o melhor e o pior? Por quê?",
      "Por que você saiu (ou deseja sair) do seu emprego atual?",
      "O que você sabe sobre nossa empresa?",
      "O que lhe faz querer trabalhar conosco?",
    ],
  },
  ROTEIRO_02: {
    titulo: "Roteiro 02 - Histórico de Vida e Social",
    perguntas: [
      "Histórico Familiar: Profissão dos pais, com quem vive, estado civil, filhos.",
      "Histórico Social: O que faz no tempo livre, lazer, trabalhos voluntários.",
      "Histórico Escolar: Grau de instrução, cursos atuais, planos de estudo.",
      "Histórico Profissional: Relato detalhado de cada atividade desde o 1º emprego.",
      "Relacionamento: Como era a relação com gestores e colegas?",
      "Motivo de Desligamentos: Por que saiu das empresas anteriores?",
      "Expectativas: O que espera desenvolver na empresa?",
    ],
  },
  ROTEIRO_03: {
    titulo: "Roteiro 03 - Pessoal e Comportamental",
    perguntas: [
      "Fale-me a seu respeito (Pessoa, Família, Profissional).",
      "Como você descreve sua personalidade?",
      "Quais são seus pontos fortes e fracos?",
      "Onde você se vê em cinco anos?",
      "Por que devemos contratá-lo?",
      "Com que tipo de pessoa você tem dificuldade de trabalhar?",
      "Quanto você acha que deve ganhar nesse cargo?",
      "Como você se mantém atualizado na sua área?",
    ],
  },
  VENDEDORES: {
    titulo: "Roteiro Especial - Vendedores",
    perguntas: [
      "Por que você deseja trabalhar em vendas nesta empresa?",
      "O que seu gerente anterior diria sobre seus pontos fortes e dificuldades?",
      "Fale sobre o seu dia comum no exercício da função de vendas.",
      "Fale sobre uma venda que você perdeu e a razão.",
      "Fale sobre um sucesso de vendas que você obteve.",
      "Quais os atributos de um vendedor bem sucedido?",
      "O que o motiva na atividade de vendas?",
      "O que menos lhe agrada na atividade de vendas?",
      "O que você acha do trabalho burocrático?",
    ],
  },
};

const formInicial = {
  candidato: "",
  cargo: "",
  entrevistador: "",
  data: new Date().toISOString().split("T")[0],
  hora: "",
  status: "AGENDADA", // Bate com o ENUM type_status_entrevista
  tipoRoteiro: "ROTEIRO_01", // Bate com o ENUM type_modelo_roteiro
  respostas: {},
  sintese: "",
  recomendacao: 3,
};

export default function RoteiroEntrevistaPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listaEntrevistas, setListaEntrevistas] = useState<any[]>([]);
  const [registroId, setRegistroId] = useState<string | null>(null);
  const [form, setForm] = useState(formInicial);

  const carregarEntrevistas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ROTEIROS_ENTREVISTAS")
      .select("*")
      .eq("cd_projeto", params.id)
      .order("ts_criacao", { ascending: false });

    if (data) setListaEntrevistas(data);
    setLoading(false);
  };

  useEffect(() => {
    carregarEntrevistas();
  }, [params.id]);

  const selecionarEntrevista = (ent: any) => {
    setRegistroId(ent.cd_entrevista); // Puxa pela PK correta
    setForm({
      candidato: ent.nm_candidato || "",
      cargo: ent.nm_cargo_pretendido || "",
      entrevistador: ent.nm_entrevistador || "",
      data: ent.dt_entrevista || "",
      hora: ent.hr_entrevista || "",
      status: ent.tp_status || "AGENDADA",
      tipoRoteiro: ent.tp_roteiro || "ROTEIRO_01",
      respostas: ent.js_respostas || {},
      sintese: ent.ds_sintese_final || "",
      recomendacao: ent.nr_recomendacao || 3,
    });
  };

  const handleNovaEntrevista = () => {
    setRegistroId(null);
    setForm(formInicial);
  };

  const handleSave = async () => {
    if (!form.candidato) return alert("Informe o nome do candidato.");
    setSaving(true);

    // Dicionário de Tradução: Front-end -> Banco de Dados (Padrão KADMOS)
    const payload = {
      cd_projeto: params.id,
      nm_candidato: form.candidato,
      nm_cargo_pretendido: form.cargo,
      dt_entrevista: form.data || null,
      hr_entrevista: form.hora || null,
      tp_status: form.status,
      nm_entrevistador: form.entrevistador,
      tp_roteiro: form.tipoRoteiro,
      js_respostas: form.respostas,
      ds_sintese_final: form.sintese,
      nr_recomendacao: form.recomendacao,
    };

    try {
      if (registroId) {
        const { error } = await supabase
          .from("ROTEIROS_ENTREVISTAS")
          .update(payload)
          .eq("cd_entrevista", registroId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ROTEIROS_ENTREVISTAS")
          .insert([payload]);
        if (error) throw error;
      }
      alert("Entrevista salva com sucesso!");
      carregarEntrevistas();
    } catch (error: any) {
      console.error(error);
      alert("Erro ao salvar: Verifique se os campos estão corretos.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!registroId || !confirm("Excluir esta entrevista permanentemente?"))
      return;

    setSaving(true);
    try {
      await supabase
        .from("ROTEIROS_ENTREVISTAS")
        .delete()
        .eq("cd_entrevista", registroId);
      handleNovaEntrevista();
      carregarEntrevistas();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center text-[#064384] font-bold">
        Carregando entrevistas...
      </div>
    );

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col h-screen overflow-hidden">
      {/* HEADER TOP */}
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
            <span className="material-symbols-outlined">record_voice_over</span>{" "}
            Central de Entrevistas
          </h1>
        </div>
        <div className="flex gap-3">
          {registroId && (
            <button
              onClick={handleDelete}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold border border-red-100 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>{" "}
              Excluir
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FF8323] hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "sync" : "save"}
            </span>{" "}
            {saving ? "Salvando..." : "Salvar Entrevista"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR: LISTA DE CANDIDATOS */}
        <aside className="w-80 bg-white border-r flex flex-col overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-black text-slate-700 text-sm uppercase tracking-widest">
              Candidatos
            </h2>
            <span className="bg-[#064384]/10 text-[#064384] text-xs font-bold px-2 py-1 rounded-md">
              {listaEntrevistas.length}
            </span>
          </div>
          <div className="p-4 border-b border-slate-100">
            <button
              onClick={handleNovaEntrevista}
              className="w-full bg-blue-50 hover:bg-[#064384] text-[#064384] hover:text-white py-3 border border-blue-100 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined">person_add</span> Nova
              Entrevista
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {listaEntrevistas.length === 0 ? (
              <p className="text-center text-sm font-medium text-slate-400 mt-10">
                Nenhuma entrevista registrada.
              </p>
            ) : (
              listaEntrevistas.map((ent) => (
                <div
                  key={ent.cd_entrevista}
                  onClick={() => selecionarEntrevista(ent)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${registroId === ent.cd_entrevista ? "bg-blue-50 border-[#064384]/30 shadow-sm" : "bg-white border-slate-100 hover:bg-slate-50"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3
                      className={`font-bold text-sm truncate pr-2 ${registroId === ent.cd_entrevista ? "text-[#064384]" : "text-slate-800"}`}
                    >
                      {ent.nm_candidato}
                    </h3>
                    {/* Badge de Status Pequena na Lista */}
                    {ent.tp_status === "CONCLUIDA" && (
                      <span
                        className="w-2 h-2 rounded-full bg-green-500 mt-1 shrink-0"
                        title="Concluída"
                      ></span>
                    )}
                    {ent.tp_status === "AGENDADA" && (
                      <span
                        className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0"
                        title="Agendada"
                      ></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      work
                    </span>{" "}
                    {ent.nm_cargo_pretendido || "Cargo não informado"}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ÁREA PRINCIPAL (FORMULÁRIO) */}
        <main className="flex-1 overflow-y-auto p-8 relative bg-slate-50/50">
          <div className="max-w-[900px] mx-auto space-y-8 pb-10">
            {!registroId && (
              <div className="bg-blue-50 border border-blue-200 text-[#064384] px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                <span className="material-symbols-outlined">info</span>
                <p className="text-sm font-bold">
                  Você está agendando uma{" "}
                  <span className="uppercase tracking-widest">
                    Nova Entrevista
                  </span>
                  .
                </p>
              </div>
            )}

            {/* BLOCO 1: INFO E AGENDA */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                Identificação e Agendamento
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">
                    Nome do Candidato <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.candidato}
                    onChange={(e) =>
                      setForm({ ...form, candidato: e.target.value })
                    }
                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none font-semibold text-slate-800"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Cargo Pretendido
                  </label>
                  <input
                    value={form.cargo}
                    onChange={(e) =>
                      setForm({ ...form, cargo: e.target.value })
                    }
                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none"
                    placeholder="Ex: Analista de Marketing"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Entrevistador Responsável
                  </label>
                  <input
                    value={form.entrevistador}
                    onChange={(e) =>
                      setForm({ ...form, entrevistador: e.target.value })
                    }
                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none"
                    placeholder="Seu nome"
                  />
                </div>

                {/* OS NOVOS CAMPOS AQUI */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Data
                    </label>
                    <input
                      type="date"
                      value={form.data}
                      onChange={(e) =>
                        setForm({ ...form, data: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={form.hora}
                      onChange={(e) =>
                        setForm({ ...form, hora: e.target.value })
                      }
                      className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Status da Entrevista
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none font-bold text-slate-700"
                  >
                    <option value="AGENDADA">📅 Agendada</option>
                    <option value="EM_ANDAMENTO">⏳ Em Andamento</option>
                    <option value="CONCLUIDA">✅ Concluída</option>
                    <option value="CANCELADA">❌ Cancelada</option>
                  </select>
                </div>
              </div>
            </section>

            {/* BLOCO 2: ROTEIRO E PERGUNTAS */}
            <section className="space-y-6">
              <div className="bg-blue-900 p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FF8323]">
                      library_books
                    </span>{" "}
                    Guia de Entrevista
                  </h2>
                  <p className="text-blue-200 text-xs mt-1">
                    Selecione a metodologia que deseja aplicar com este
                    candidato.
                  </p>
                </div>
                <div className="w-full md:w-auto">
                  <select
                    value={form.tipoRoteiro}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tipoRoteiro: e.target.value,
                        respostas: {},
                      })
                    }
                    className="w-full md:w-64 p-3 bg-white border-0 rounded-xl font-bold text-[#064384] outline-none shadow-sm cursor-pointer"
                  >
                    {Object.keys(DICIONARIO_ROTEIROS).map((key) => (
                      <option key={key} value={key}>
                        {DICIONARIO_ROTEIROS[key].titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LISTAGEM DAS PERGUNTAS */}
              <div className="space-y-4">
                {DICIONARIO_ROTEIROS[form.tipoRoteiro].perguntas.map(
                  (perg: string, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 transition-colors group"
                    >
                      <div className="flex gap-3 mb-3">
                        <span className="flex items-center justify-center size-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs shrink-0 group-hover:bg-[#064384] group-hover:text-white transition-colors">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed pt-0.5">
                          {perg}
                        </p>
                      </div>
                      <textarea
                        value={(form.respostas as any)[idx] || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            respostas: {
                              ...form.respostas,
                              [idx]: e.target.value,
                            },
                          })
                        }
                        rows={3}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none text-sm text-slate-600 transition-all resize-y"
                        placeholder="Faça suas anotações aqui..."
                      />
                    </div>
                  ),
                )}
              </div>
            </section>

            {/* BLOCO 3: SÍNTESE FINAL */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#064384]">
                  assignment_turned_in
                </span>{" "}
                Parecer do Consultor
              </h2>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">
                  Síntese da Entrevista
                </label>
                <textarea
                  value={form.sintese}
                  onChange={(e) =>
                    setForm({ ...form, sintese: e.target.value })
                  }
                  rows={5}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none text-sm"
                  placeholder="Descreva suas impressões gerais sobre o candidato, pontos fortes notados e observações adicionais..."
                />
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    Nível de Recomendação
                  </span>
                  <span className="text-xs text-slate-500">
                    Avalie o fit deste candidato para a vaga (1 a 5).
                  </span>
                </div>
                <div className="flex gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setForm({ ...form, recomendacao: num })}
                      className={`size-10 rounded-lg font-black text-sm transition-all flex items-center justify-center shadow-sm ${
                        form.recomendacao === num
                          ? "bg-[#FF8323] text-white scale-110"
                          : "bg-white text-slate-400 hover:text-slate-600 border border-slate-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
