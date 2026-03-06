"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PlanodeCargosSalariosPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("cargos"); // cargos | equipe | promocoes | dashboard

  const [cargos, setCargos] = useState<any[]>([]);
  const [equipe, setEquipe] = useState<any[]>([]);
  const [promocoes, setPromocoes] = useState<any[]>([]);

  // Estado para o formulário de Nova Promoção
  const [formPromo, setFormPromo] = useState({
    colaborador: "",
    cargoNovo: "",
    salarioNovo: 0,
    data: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    carregarDados();
  }, [params.id]);

  const carregarDados = async () => {
    setLoading(true);

    const { data: dataCargos } = await supabase
      .from("PCS_CARGOS")
      .select("*")
      .eq("cd_projeto", params.id)
      .order("ts_criacao", { ascending: true });
    if (dataCargos) setCargos(dataCargos);

    const { data: dataEquipe } = await supabase
      .from("PCS_COLABORADORES")
      .select("*")
      .eq("cd_projeto", params.id)
      .order("ts_criacao", { ascending: true });
    if (dataEquipe) setEquipe(dataEquipe);

    const { data: dataPromo } = await supabase
      .from("PCS_PROMOCOES")
      .select("*")
      .eq("cd_projeto", params.id)
      .order("dt_promocao", { ascending: false });
    if (dataPromo) setPromocoes(dataPromo);

    setLoading(false);
  };

  // --- SALVAMENTO EM LOTE (Abas 1 e 2) ---
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. Salva Cargos
      const cargosToUpsert = cargos.map((c) => {
        const item = { ...c, cd_projeto: params.id };
        if (String(item.cd_cargo).startsWith("temp-")) delete item.cd_cargo;
        return item;
      });
      if (cargosToUpsert.length > 0)
        await supabase
          .from("PCS_CARGOS")
          .upsert(cargosToUpsert, { onConflict: "cd_cargo" });

      // Recarrega para ter IDs reais
      const { data: cargosAtualizados } = await supabase
        .from("PCS_CARGOS")
        .select("cd_cargo, nm_cargo")
        .eq("cd_projeto", params.id);

      // 2. Salva Equipe
      const equipeToUpsert = equipe.map((e) => {
        const item = { ...e, cd_projeto: params.id };
        if (String(item.cd_colaborador).startsWith("temp-"))
          delete item.cd_colaborador;

        if (
          String(item.cd_cargo_atual).startsWith("temp-") &&
          cargosAtualizados
        ) {
          const cargoReal = cargos.find(
            (c) => c.cd_cargo === item.cd_cargo_atual,
          );
          if (cargoReal) {
            const novoCargo = cargosAtualizados.find(
              (ca) => ca.nm_cargo === cargoReal.nm_cargo,
            );
            if (novoCargo) item.cd_cargo_atual = novoCargo.cd_cargo;
          }
        }
        if (
          String(item.cd_cargo_esperado).startsWith("temp-") &&
          cargosAtualizados
        ) {
          const cargoEsperadoReal = cargos.find(
            (c) => c.cd_cargo === item.cd_cargo_esperado,
          );
          if (cargoEsperadoReal) {
            const novoCargoEsp = cargosAtualizados.find(
              (ca) => ca.nm_cargo === cargoEsperadoReal.nm_cargo,
            );
            if (novoCargoEsp) item.cd_cargo_esperado = novoCargoEsp.cd_cargo;
          }
        }
        return item;
      });

      if (equipeToUpsert.length > 0)
        await supabase
          .from("PCS_COLABORADORES")
          .upsert(equipeToUpsert, { onConflict: "cd_colaborador" });

      alert("Planilha salva com sucesso!");
      carregarDados();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // --- REGISTRAR PROMOÇÃO (Aba 3) ---
  const handleRegistrarPromocao = async () => {
    if (!formPromo.colaborador || !formPromo.cargoNovo || !formPromo.data) {
      return alert("Preencha todos os campos da promoção.");
    }

    if (formPromo.colaborador.startsWith("temp-")) {
      return alert(
        "Você precisa 'Salvar Planilha' antes de promover um funcionário recém-adicionado.",
      );
    }

    setSaving(true);
    try {
      const colab = equipe.find(
        (e) => e.cd_colaborador === formPromo.colaborador,
      );

      await supabase.from("PCS_PROMOCOES").insert([
        {
          cd_projeto: params.id,
          cd_colaborador: colab.cd_colaborador,
          cd_cargo_anterior: colab.cd_cargo_atual,
          cd_cargo_novo: formPromo.cargoNovo,
          vl_salario_anterior: colab.vl_salario_atual,
          vl_salario_novo: formPromo.salarioNovo,
          dt_promocao: formPromo.data,
        },
      ]);

      await supabase
        .from("PCS_COLABORADORES")
        .update({
          cd_cargo_atual: formPromo.cargoNovo,
          vl_salario_atual: formPromo.salarioNovo,
        })
        .eq("cd_colaborador", colab.cd_colaborador);

      alert("Promoção registrada com sucesso!");
      setFormPromo({
        colaborador: "",
        cargoNovo: "",
        salarioNovo: 0,
        data: new Date().toISOString().split("T")[0],
      });
      carregarDados();
    } catch (error) {
      console.error(error);
      alert("Erro ao registrar promoção.");
    } finally {
      setSaving(false);
    }
  };

  const getNomeCargo = (id: string) =>
    cargos.find((c) => c.cd_cargo === id)?.nm_cargo || "Cargo Deletado";
  const getNomeColab = (id: string) =>
    equipe.find((e) => e.cd_colaborador === id)?.nm_colaborador ||
    "Colaborador Deletado";

  const addCargo = () =>
    setCargos([
      ...cargos,
      {
        cd_cargo: `temp-${Date.now()}`,
        nm_cargo: "",
        nm_area: "",
        nm_grupo: "",
        vl_faixa_1: 0,
        vl_faixa_2: 0,
        vl_faixa_3: 0,
        vl_faixa_4: 0,
        vl_faixa_5: 0,
      },
    ]);
  const updateCargo = (id: string, field: string, value: any) =>
    setCargos(
      cargos.map((c) => (c.cd_cargo === id ? { ...c, [field]: value } : c)),
    );
  const deleteCargo = async (id: string) => {
    if (!String(id).startsWith("temp-"))
      await supabase.from("PCS_CARGOS").delete().eq("cd_cargo", id);
    setCargos(cargos.filter((c) => c.cd_cargo !== id));
  };

  const addColaborador = () =>
    setEquipe([
      ...equipe,
      {
        cd_colaborador: `temp-${Date.now()}`,
        nm_colaborador: "",
        tp_contrato: "CLT",
        cd_cargo_atual: null,
        cd_cargo_esperado: null,
        vl_salario_atual: 0,
      },
    ]);
  const updateColaborador = (id: string, field: string, value: any) =>
    setEquipe(
      equipe.map((e) =>
        e.cd_colaborador === id ? { ...e, [field]: value } : e,
      ),
    );
  const deleteColaborador = async (id: string) => {
    if (!String(id).startsWith("temp-"))
      await supabase
        .from("PCS_COLABORADORES")
        .delete()
        .eq("cd_colaborador", id);
    setEquipe(equipe.filter((e) => e.cd_colaborador !== id));
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);

  const getStatusEnquadramento = (colab: any) => {
    if (!colab.cd_cargo_atual || !colab.vl_salario_atual) return null;
    const cargo = cargos.find((c) => c.cd_cargo === colab.cd_cargo_atual);
    if (!cargo) return null;

    const salario = parseFloat(colab.vl_salario_atual);
    const f1 = parseFloat(cargo.vl_faixa_1) || 0;
    const f5 = parseFloat(cargo.vl_faixa_5) || 0;

    if (f1 === 0 && f5 === 0)
      return {
        label: "Configurar Faixas",
        color: "bg-slate-100 text-slate-500",
      };
    if (salario < f1)
      return {
        label: "Abaixo da Faixa",
        color: "bg-red-50 text-red-600 border-red-200",
      };
    if (salario > f5)
      return {
        label: "Acima do Teto",
        color: "bg-orange-50 text-orange-600 border-orange-200",
      };
    return {
      label: "Enquadrado",
      color: "bg-green-50 text-green-600 border-green-200",
    };
  };

  const custoTotalFolha = equipe.reduce(
    (acc, curr) => acc + (parseFloat(curr.vl_salario_atual) || 0),
    0,
  );
  const defasados = equipe.filter((e) =>
    getStatusEnquadramento(e)?.label.includes("Abaixo"),
  ).length;

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#064384]">
          progress_activity
        </span>
      </div>
    );

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-20 w-full overflow-x-hidden">
      {/* HEADER RESPONSIVO */}
      <header className="bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-4 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 shadow-sm sticky top-0 z-30 w-full shrink-0">
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
              account_balance_wallet
            </span>
            <span className="truncate">Plano de Cargos e Salários</span>
          </h1>
        </div>

        <div className="flex items-center justify-end w-full md:w-auto">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-secondary hover:bg-orange-600 text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 text-sm uppercase tracking-wider mt-2"
          >
            <span className="material-symbols-outlined text-[18px] animate-spin-slow">
              {saving ? "sync" : "save"}
            </span>
            <span className="truncate">
              {saving ? "Salvando Planilha..." : "Salvar Planilha"}
            </span>
          </button>
        </div>
      </header>

      {/* NAVEGAÇÃO DE ABAS COM SCROLL HORIZONTAL (MOBILE) */}
      <div className="px-4 sm:px-8 bg-white border-b border-slate-200 flex gap-6 sm:gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {[
          { id: "cargos", icon: "work", label: "1. Estrutura e Faixas" },
          { id: "equipe", icon: "groups", label: "2. Enquadramento da Equipe" },
          {
            id: "promocoes",
            icon: "trending_up",
            label: "3. Histórico de Promoções",
          },
          {
            id: "dashboard",
            icon: "donut_large",
            label: "4. Dashboard Salarial",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 text-xs sm:text-[13px] font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors outline-none shrink-0
              ${activeTab === tab.id ? "border-[#FF8323] text-[#FF8323]" : "border-transparent text-slate-400 hover:text-[#064384]"}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>{" "}
            {tab.label}
          </button>
        ))}
      </div>

      <main className="p-4 sm:p-8 max-w-[1400px] mx-auto w-full">
        {/* ABA 1: CARGOS */}
        {activeTab === "cargos" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <p className="text-slate-500 text-xs sm:text-sm font-medium">
                Defina os cargos da empresa e crie a régua de maturidade
                salarial.
              </p>
              <button
                onClick={addCargo}
                className="w-full sm:w-auto bg-blue-50 text-primary hover:bg-primary hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>{" "}
                Adicionar Cargo
              </button>
            </div>

            {/* CONTAINER OTIMIZADO PARA SCROLL HORIZONTAL DE TABELAS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="p-4 sm:p-5">Cargo</th>
                      <th className="p-4 sm:p-5">Área</th>
                      <th className="p-4 sm:p-5">Grupo (Nível)</th>
                      <th className="p-4 sm:p-5 text-center bg-green-50/50 text-green-700">
                        Faixa 1
                      </th>
                      <th className="p-4 sm:p-5 text-center bg-green-50/50 text-green-700">
                        Faixa 2
                      </th>
                      <th className="p-4 sm:p-5 text-center bg-green-50/50 text-green-700">
                        Faixa 3
                      </th>
                      <th className="p-4 sm:p-5 text-center bg-green-50/50 text-green-700">
                        Faixa 4
                      </th>
                      <th className="p-4 sm:p-5 text-center bg-green-50/50 text-green-700">
                        Faixa 5
                      </th>
                      <th className="p-4 sm:p-5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cargos.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-8 text-center text-slate-400 font-medium"
                        >
                          Nenhum cargo cadastrado.
                        </td>
                      </tr>
                    )}
                    {cargos.map((cargo) => (
                      <tr
                        key={cargo.cd_cargo}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-3 sm:p-4">
                          <input
                            value={cargo.nm_cargo}
                            onChange={(e) =>
                              updateCargo(
                                cargo.cd_cargo,
                                "nm_cargo",
                                e.target.value,
                              )
                            }
                            className="w-40 sm:w-48 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-bold text-slate-800 transition-all"
                            placeholder="Nome do Cargo"
                          />
                        </td>
                        <td className="p-3 sm:p-4">
                          <input
                            value={cargo.nm_area}
                            onChange={(e) =>
                              updateCargo(
                                cargo.cd_cargo,
                                "nm_area",
                                e.target.value,
                              )
                            }
                            className="w-28 sm:w-32 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary transition-all text-slate-600"
                            placeholder="Ex: Comercial"
                          />
                        </td>
                        <td className="p-3 sm:p-4">
                          <input
                            value={cargo.nm_grupo}
                            onChange={(e) =>
                              updateCargo(
                                cargo.cd_cargo,
                                "nm_grupo",
                                e.target.value,
                              )
                            }
                            className="w-28 sm:w-32 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary transition-all text-slate-600"
                            placeholder="Ex: Operacional"
                          />
                        </td>
                        {[1, 2, 3, 4, 5].map((faixa) => (
                          <td key={faixa} className="p-3 sm:p-4">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-400/20 transition-all">
                              <span className="pl-3 text-[10px] text-slate-400 font-bold">
                                R$
                              </span>
                              <input
                                type="number"
                                value={cargo[`vl_faixa_${faixa}`]}
                                onChange={(e) =>
                                  updateCargo(
                                    cargo.cd_cargo,
                                    `vl_faixa_${faixa}`,
                                    parseFloat(e.target.value),
                                  )
                                }
                                className="w-20 sm:w-24 p-2 text-sm text-right outline-none text-slate-700 font-medium bg-transparent"
                              />
                            </div>
                          </td>
                        ))}
                        <td className="p-3 sm:p-4 text-center">
                          <button
                            onClick={() => deleteCargo(cargo.cd_cargo)}
                            className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
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

        {/* ABA 2: EQUIPE */}
        {activeTab === "equipe" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <p className="text-slate-500 text-xs sm:text-sm font-medium">
                Aloque os funcionários nos cargos criados e defina as promoções
                esperadas.
              </p>
              <button
                onClick={addColaborador}
                className="w-full sm:w-auto bg-blue-50 text-primary hover:bg-primary hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>{" "}
                Adicionar Funcionário
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 sm:p-5">Nome do Colaborador</th>
                      <th className="p-4 sm:p-5 text-center">Contrato</th>
                      <th className="p-4 sm:p-5">Cargo Atual</th>
                      <th className="p-4 sm:p-5 text-right">Salário Atual</th>
                      <th className="p-4 sm:p-5 border-l border-slate-200 bg-orange-50/50 text-secondary">
                        Promoção Esperada
                      </th>
                      <th className="p-4 sm:p-5">Análise</th>
                      <th className="p-4 sm:p-5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {equipe.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-slate-400 font-medium"
                        >
                          Nenhum funcionário alocado ainda.
                        </td>
                      </tr>
                    )}
                    {equipe.map((colab) => {
                      const status = getStatusEnquadramento(colab);
                      return (
                        <tr
                          key={colab.cd_colaborador}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-3 sm:p-4">
                            <input
                              value={colab.nm_colaborador}
                              onChange={(e) =>
                                updateColaborador(
                                  colab.cd_colaborador,
                                  "nm_colaborador",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary font-bold text-slate-800 transition-all"
                              placeholder="Nome completo"
                            />
                          </td>
                          <td className="p-3 sm:p-4">
                            <select
                              value={colab.tp_contrato}
                              onChange={(e) =>
                                updateColaborador(
                                  colab.cd_colaborador,
                                  "tp_contrato",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 text-xs sm:text-sm font-bold border border-slate-200 rounded-lg outline-none bg-white text-slate-600 focus:border-primary transition-all cursor-pointer"
                            >
                              <option value="CLT">CLT</option>
                              <option value="PJ">PJ</option>
                              <option value="ESTAGIO">Estágio</option>
                              <option value="TEMPORARIO">Temporário</option>
                              <option value="SOCIO">Sócio</option>
                            </select>
                          </td>
                          <td className="p-3 sm:p-4">
                            <select
                              value={colab.cd_cargo_atual || ""}
                              onChange={(e) =>
                                updateColaborador(
                                  colab.cd_colaborador,
                                  "cd_cargo_atual",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg outline-none bg-white font-black text-[#064384] focus:border-primary transition-all cursor-pointer"
                            >
                              <option value="" disabled>
                                Selecione o cargo...
                              </option>
                              {cargos.map((c) => (
                                <option key={c.cd_cargo} value={c.cd_cargo}>
                                  {c.nm_cargo}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 transition-all">
                              <span className="pl-3 text-[10px] text-slate-400 font-bold">
                                R$
                              </span>
                              <input
                                type="number"
                                value={colab.vl_salario_atual}
                                onChange={(e) =>
                                  updateColaborador(
                                    colab.cd_colaborador,
                                    "vl_salario_atual",
                                    parseFloat(e.target.value),
                                  )
                                }
                                className="w-24 sm:w-28 p-2.5 text-sm text-right outline-none text-slate-800 font-black bg-transparent"
                              />
                            </div>
                          </td>

                          {/* PROMOÇÃO ESPERADA */}
                          <td className="p-3 sm:p-4 border-l border-slate-200 bg-orange-50/20">
                            <select
                              value={colab.cd_cargo_esperado || ""}
                              onChange={(e) =>
                                updateColaborador(
                                  colab.cd_colaborador,
                                  "cd_cargo_esperado",
                                  e.target.value,
                                )
                              }
                              className="w-full p-2.5 text-xs sm:text-sm border border-orange-200 rounded-lg outline-none bg-white font-bold text-[#FF8323] focus:border-secondary transition-all cursor-pointer shadow-sm"
                            >
                              <option value="">Sem previsão</option>
                              {cargos.map((c) => (
                                <option key={c.cd_cargo} value={c.cd_cargo}>
                                  {c.nm_cargo}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3 sm:p-4">
                            {status ? (
                              <div
                                className={`inline-flex px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider border ${status.color}`}
                              >
                                {status.label}
                              </div>
                            ) : null}
                          </td>
                          <td className="p-3 sm:p-4 text-center">
                            <button
                              onClick={() =>
                                deleteColaborador(colab.cd_colaborador)
                              }
                              className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PROMOÇÕES */}
        {activeTab === "promocoes" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="font-black text-primary text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-secondary">
                  rocket_launch
                </span>{" "}
                Registrar Nova Promoção
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Colaborador
                  </label>
                  <select
                    value={formPromo.colaborador}
                    onChange={(e) =>
                      setFormPromo({
                        ...formPromo,
                        colaborador: e.target.value,
                      })
                    }
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 font-bold focus:border-primary transition-all"
                  >
                    <option value="" disabled>
                      Selecione quem será promovido...
                    </option>
                    {equipe.map((e) => (
                      <option key={e.cd_colaborador} value={e.cd_colaborador}>
                        {e.nm_colaborador}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Novo Cargo
                  </label>
                  <select
                    value={formPromo.cargoNovo}
                    onChange={(e) =>
                      setFormPromo({ ...formPromo, cargoNovo: e.target.value })
                    }
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 font-black text-primary focus:border-primary transition-all"
                  >
                    <option value="" disabled>
                      Para qual cargo irá?
                    </option>
                    {cargos.map((c) => (
                      <option key={c.cd_cargo} value={c.cd_cargo}>
                        {c.nm_cargo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mt-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Novo Salário (R$)
                  </label>
                  <input
                    type="number"
                    value={formPromo.salarioNovo}
                    onChange={(e) =>
                      setFormPromo({
                        ...formPromo,
                        salarioNovo: parseFloat(e.target.value),
                      })
                    }
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 font-black text-green-600 focus:border-green-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Data da Promoção
                  </label>
                  <input
                    type="date"
                    value={formPromo.data}
                    onChange={(e) =>
                      setFormPromo({ ...formPromo, data: e.target.value })
                    }
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 focus:border-primary transition-all"
                  />
                </div>
                <div className="mt-4 md:mt-0">
                  <button
                    onClick={handleRegistrarPromocao}
                    disabled={saving}
                    className="w-full bg-[#22C55E] hover:bg-green-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-md shadow-green-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      check_circle
                    </span>{" "}
                    Promover
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 sm:p-5">Data</th>
                      <th className="p-4 sm:p-5">Colaborador</th>
                      <th className="p-4 sm:p-5">Cargo Anterior</th>
                      <th className="p-4 sm:p-5 text-primary">Novo Cargo</th>
                      <th className="p-4 sm:p-5 text-right">Salário Antigo</th>
                      <th className="p-4 sm:p-5 text-right text-green-600">
                        Novo Salário
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {promocoes.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-400 font-medium"
                        >
                          Nenhum histórico de promoção registrado.
                        </td>
                      </tr>
                    )}
                    {promocoes.map((promo) => (
                      <tr
                        key={promo.cd_promocao}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 text-xs sm:text-sm font-medium text-slate-600">
                          {new Date(promo.dt_promocao).toLocaleDateString(
                            "pt-BR",
                          )}
                        </td>
                        <td className="p-4 text-xs sm:text-sm font-bold text-slate-800">
                          {getNomeColab(promo.cd_colaborador)}
                        </td>
                        <td className="p-4 text-xs sm:text-sm text-slate-400 line-through decoration-red-400">
                          {getNomeCargo(promo.cd_cargo_anterior)}
                        </td>
                        <td className="p-4 text-xs sm:text-sm font-black text-primary">
                          {getNomeCargo(promo.cd_cargo_novo)}
                        </td>
                        <td className="p-4 text-xs sm:text-sm text-right text-slate-500">
                          {formatMoney(promo.vl_salario_anterior)}
                        </td>
                        <td className="p-4 text-xs sm:text-sm text-right font-black text-green-600 bg-green-50/30">
                          {formatMoney(promo.vl_salario_novo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-primary">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Folha Salarial Base
                </p>
                <p className="text-2xl sm:text-3xl font-black text-primary">
                  {formatMoney(custoTotalFolha)}
                </p>
              </div>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-secondary">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Média Salarial
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-800">
                  {formatMoney(
                    equipe.length > 0 ? custoTotalFolha / equipe.length : 0,
                  )}
                </p>
              </div>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Total de Colaboradores
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-800">
                  {equipe.length}
                </p>
              </div>
              <div
                className={`p-5 sm:p-6 rounded-2xl border shadow-sm ${defasados > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-600"}`}
              >
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">
                  Funcionários Defasados
                </p>
                <p className="text-2xl sm:text-3xl font-black">{defasados}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-black text-primary text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    bar_chart
                  </span>{" "}
                  Resumo por Cargo
                </h2>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-200 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-5 sm:px-6 py-4">Cargo</th>
                      <th className="px-5 sm:px-6 py-4 text-center">
                        Colaboradores
                      </th>
                      <th className="px-5 sm:px-6 py-4 text-right">
                        Média Salarial
                      </th>
                      <th className="px-5 sm:px-6 py-4 text-right">
                        Maior Salário
                      </th>
                      <th className="px-5 sm:px-6 py-4 text-right">
                        Menor Salário
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cargos.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-slate-400 font-medium"
                        >
                          Nenhum dado disponível.
                        </td>
                      </tr>
                    )}
                    {cargos.map((cargo) => {
                      const pessoasNoCargo = equipe.filter(
                        (e) => e.cd_cargo_atual === cargo.cd_cargo,
                      );
                      const salarios = pessoasNoCargo.map(
                        (e) => parseFloat(e.vl_salario_atual) || 0,
                      );
                      const count = pessoasNoCargo.length;

                      return (
                        <tr
                          key={cargo.cd_cargo}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-5 sm:px-6 py-4 font-black text-primary text-xs sm:text-sm">
                            {cargo.nm_cargo}
                          </td>
                          <td className="px-5 sm:px-6 py-4 text-center">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold">
                              {count}
                            </span>
                          </td>
                          <td className="px-5 sm:px-6 py-4 text-right text-xs sm:text-sm font-bold text-slate-600">
                            {formatMoney(
                              count > 0
                                ? salarios.reduce((a, b) => a + b, 0) / count
                                : 0,
                            )}
                          </td>
                          <td className="px-5 sm:px-6 py-4 text-right text-xs sm:text-sm font-black text-slate-800">
                            {formatMoney(count > 0 ? Math.max(...salarios) : 0)}
                          </td>
                          <td className="px-5 sm:px-6 py-4 text-right text-xs sm:text-sm font-bold text-slate-400">
                            {formatMoney(count > 0 ? Math.min(...salarios) : 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
