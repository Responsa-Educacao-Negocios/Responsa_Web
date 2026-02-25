"use client";

import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Tipagem baseada na sua tabela FUNCIONARIOS
interface Funcionario {
  cd_funcionario: string;
  nm_completo: string;
  cd_lider: string | null;
  cd_cargo: string | null;
  sg_perfil_disc: string | null;
  dt_admissao: string | null;
  vl_salario_atual?: number | null;
  tp_modelo_contratacao?: string | null;
  ds_observacoes?: string | null;
  js_pontuacao_disc: any;
  sn_ativo: boolean;
  CARGOS?: {
    nm_titulo: string; // Verifique se está nm_titulo aqui
    ds_setor: string;
  };
}

export default function MapaEquipePage() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null); // Guardar o ID da empresa
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [cargoFormData, setCargoFormData] = useState({
    nm_titulo: "",
    ds_setor: "",
  });

  // NOVO: Estado para feedback do botão de copiar link
  const [copiedLink, setCopiedLink] = useState(false);

  // Estados do Painel Lateral (Detalhes)
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedColab, setSelectedColab] = useState<Funcionario | null>(null);
  const [cargos, setCargos] = useState<
    { cd_cargo: string; nm_titulo: string }[]
  >([]);
  const [isSavingCargo, setIsSavingCargo] = useState(false);

  // Estados do Modal de Novo Colaborador
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    cd_funcionario: null as string | null,
    nm_completo: "",
    cd_lider: "",
    cd_cargo: "",
    dt_admissao: "",
    vl_salario_atual: "",
    tp_modelo_contrato: "CLT",
    sg_perfil_disc: "",
    ds_observacoes: "",
  });

  const buscarEquipe = async () => {
    const projetoId = params.id as string;
    if (!projetoId) return;

    try {
      setLoading(true);

      // 1. Primeiro, descobrimos o ID da empresa vinculado a este projeto
      const { data: projData, error: projError } = await supabase
        .from("PROJETOS")
        .select("cd_empresa")
        .eq("cd_projeto", projetoId)
        .single();

      if (projError) throw projError;

      const idEmpresaContexto = projData.cd_empresa;
      setEmpresaId(idEmpresaContexto);

      // 2. BUSCA A LISTA DE CARGOS DA EMPRESA (Para preencher o Select)
      const { data: cargosData, error: cargosError } = await supabase
        .from("CARGOS")
        .select("cd_cargo, nm_titulo") // Buscando o título real do banco
        .eq("cd_empresa", idEmpresaContexto)
        .order("nm_titulo", { ascending: true });

      if (cargosError) throw cargosError;
      setCargos(cargosData || []);

      // 3. Buscamos os funcionários (com JOIN para trazer o nome do cargo na árvore)
      const { data: funcData, error: funcError } = await supabase
        .from("FUNCIONARIOS")
        .select(
          `
          cd_funcionario,
          nm_completo,
          cd_lider,
          cd_cargo,
          sg_perfil_disc,
          dt_admissao,
          vl_salario_atual,
          tp_modelo_contrato,
          ds_observacoes,
          js_pontuacao_disc,
          sn_ativo,
          CARGOS ( nm_titulo, ds_setor )
        `,
        )
        .eq("cd_empresa", idEmpresaContexto)
        .eq("sn_ativo", true);

      if (funcError) throw funcError;

      // Normaliza o retorno do Supabase para garantir que CARGOS seja um objeto único e não um array
      const funcionariosFormatados = (funcData || []).map((f: any) => ({
        ...f,
        CARGOS: Array.isArray(f.CARGOS) ? f.CARGOS[0] : f.CARGOS,
      }));

      setFuncionarios(funcionariosFormatados as Funcionario[]);
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarEquipe();
  }, [params.id]);

  // ==========================================
  // FUNÇÃO DE SALVAR NOVO COLABORADOR
  // ==========================================
  const handleSaveColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return;
    setIsSaving(true);

    const payload = {
      cd_empresa: empresaId,
      nm_completo: formData.nm_completo,
      cd_cargo: formData.cd_cargo || null,
      cd_lider: formData.cd_lider || null,
      dt_admissao: formData.dt_admissao || null,
      vl_salario_atual: formData.vl_salario_atual
        ? parseFloat(formData.vl_salario_atual)
        : null,
      tp_modelo_contrato: formData.tp_modelo_contrato,
      sg_perfil_disc: formData.sg_perfil_disc || null,
      ds_observacoes: formData.ds_observacoes || null,
    };

    try {
      if (formData.cd_funcionario) {
        // MODO EDIÇÃO: Filtra pelo ID e atualiza
        const { error } = await supabase
          .from("FUNCIONARIOS")
          .update(payload)
          .eq("cd_funcionario", formData.cd_funcionario);
        if (error) throw error;
      } else {
        // MODO CRIAÇÃO: Apenas insere
        const { error } = await supabase.from("FUNCIONARIOS").insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      // Limpa tudo, inclusive o ID
      setFormData({
        cd_funcionario: null,
        nm_completo: "",
        cd_lider: "",
        cd_cargo: "",
        dt_admissao: "",
        vl_salario_atual: "",
        tp_modelo_contrato: "CLT",
        sg_perfil_disc: "",
        ds_observacoes: "",
      });
      buscarEquipe();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Helpers Visuais e de Cálculo
  const handleOpenPanel = (colab: Funcionario) => {
    setSelectedColab(colab);
    setIsPanelOpen(true);
  };

  const getDiscColor = (disc?: string | null) => {
    const d = (disc || "").toUpperCase();
    if (d.includes("D")) return "bg-red-500 border-red-600 text-white";
    if (d.includes("I")) return "bg-yellow-400 border-yellow-500 text-white";
    if (d.includes("S")) return "bg-green-500 border-green-600 text-white";
    if (d.includes("C")) return "bg-blue-500 border-blue-600 text-white";
    return "bg-slate-300 border-slate-400 text-white";
  };

  const calcularTempoCasa = (dataAdmissao?: string | null) => {
    if (!dataAdmissao) return "N/D";
    const inicio = new Date(dataAdmissao);
    const hoje = new Date();
    const meses =
      (hoje.getFullYear() - inicio.getFullYear()) * 12 +
      (hoje.getMonth() - inicio.getMonth());
    const anos = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;
    return `${anos}a ${mesesRestantes}m`;
  };

  const getIniciais = (nome: string) => {
    return nome.substring(0, 2).toUpperCase();
  };

  // Configuração do Radar Chart (Painel Lateral)
  const miniRadarOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "radar",
      toolbar: { show: false },
      fontFamily: "Montserrat, sans-serif",
      parentHeightOffset: 0,
    },
    labels: ["Gestão", "Vendas", "Liderança", "Análise", "Inovação"],
    stroke: { width: 1, colors: ["#064384"] },
    fill: { opacity: 0.2, colors: ["#064384"] },
    markers: {
      size: 2,
      colors: ["#fff"],
      strokeColors: "#064384",
      strokeWidth: 1,
    },
    yaxis: { show: false, min: 0, max: 100 },
    xaxis: {
      labels: {
        style: {
          colors: Array(5).fill("#64748b"),
          fontSize: "9px",
          fontFamily: "Montserrat",
        },
      },
    },
    tooltip: { enabled: false },
  };

  // ==========================================
  // MOTOR DA ÁRVORE RECURSIVA
  // ==========================================
  // Subistitua o seu NodeCard por este:
  const NodeCard = ({ colab }: { colab: Funcionario }) => (
    <div
      onClick={() => handleOpenPanel(colab)}
      className={`
      group relative flex w-[190px] cursor-pointer flex-col items-center rounded-2xl border bg-white p-5 text-center transition-all duration-300
      ${
        selectedColab?.cd_funcionario === colab.cd_funcionario
          ? "border-accent ring-4 ring-accent/10 shadow-lg translate-y-[-4px]"
          : "border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md hover:translate-y-[-4px]"
      }
    `}
    >
      {/* Área do Avatar */}
      <div className="relative mb-4">
        {/* Círculo das Iniciais */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-white shadow-inner transition-transform duration-300 group-hover:scale-105">
          <span className="text-xl font-black uppercase tracking-tighter text-slate-500">
            {getIniciais(colab.nm_completo)}
          </span>
        </div>

        {/* Badge DISC - Ajustado para não sobrepor o texto */}
        <div
          className={`
          absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white shadow-md
          ${getDiscColor(colab.sg_perfil_disc)}
        `}
          title={`Perfil DISC: ${colab.sg_perfil_disc}`}
        >
          <span className="text-[10px] font-black text-white drop-shadow-sm">
            {colab.sg_perfil_disc || "?"}
          </span>
        </div>
      </div>

      {/* Informações do Colaborador */}
      <div className="flex w-full flex-col gap-0.5">
        <h3 className="w-full truncate px-1 text-sm font-extrabold tracking-tight text-slate-800">
          {colab.nm_completo}
        </h3>
        <p className="w-full truncate px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {colab.CARGOS?.nm_titulo}
        </p>
      </div>

      {/* Indicador visual de seleção (opcional) */}
      {selectedColab?.cd_funcionario === colab.cd_funcionario && (
        <div className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-accent animate-pulse" />
      )}
    </div>
  );

  const renderTree = (liderId: string | null) => {
    const filhos = funcionarios.filter((f) => f.cd_lider === liderId);
    if (filhos.length === 0) return null;

    return (
      <div className="tree-children">
        {filhos.map((filho) => (
          <div key={filho.cd_funcionario} className="tree-child-connector">
            <div className="pt-5 pb-5">
              <NodeCard colab={filho} />
            </div>
            {renderTree(filho.cd_funcionario)}
          </div>
        ))}
      </div>
    );
  };

  const raizes = funcionarios.filter((f) => !f.cd_lider);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4 text-primary bg-[#F5F7FA]">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Montando Organograma...</span>
      </div>
    );
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedColab(null);
  };

  const handleSaveCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId || !cargoFormData.nm_titulo) return;
    setIsSavingCargo(true);

    try {
      const { data, error } = await supabase
        .from("CARGOS")
        .insert([
          {
            cd_empresa: empresaId,
            nm_titulo: cargoFormData.nm_titulo,
            // Envia null se o usuário deixar o setor em branco
            ds_setor: cargoFormData.ds_setor || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("ERRO SUPABASE CARGOS:", error);
        throw error;
      }

      setCargos((prev) =>
        [...prev, data].sort((a, b) => a.nm_titulo.localeCompare(b.nm_titulo)),
      );
      setFormData((prev) => ({ ...prev, cd_cargo: data.cd_cargo }));
      setIsCargoModalOpen(false);
      setCargoFormData({ nm_titulo: "", ds_setor: "" });
    } catch (error: any) {
      // Agora o alerta vai te mostrar o texto real do erro do Supabase!
      alert(`Erro no banco de dados: ${error.message || error.details}`);
    } finally {
      setIsSavingCargo(false);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tree-level { display: flex; justify-content: center; position: relative; padding-top: 20px; }
        .tree-children { display: flex; justify-content: center; position: relative; padding-top: 20px; }
        .tree-children::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #CBD5E1; height: 20px; transform: translateX(-50%); }
        .tree-child-connector { position: relative; display: flex; flex-direction: column; align-items: center; padding: 0 15px; }
        .tree-child-connector::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #CBD5E1; height: 20px; transform: translateX(-50%); }
        .tree-child-connector::after { content: ''; position: absolute; top: 0; right: 0; left: 0; border-top: 2px solid #CBD5E1; }
        .tree-child-connector:first-child::after { left: 50%; border-top-left-radius: 0; }
        .tree-child-connector:last-child::after { right: 50%; border-top-right-radius: 0; }
        .tree-child-connector:only-child::after { display: none; }
      `,
        }}
      />

      <div className="flex flex-col relative overflow-hidden h-full">
        {/* MODAL DE NOVO COLABORADOR ATUALIZADO */}
        {/* MODAL DE NOVO / EDITAR COLABORADOR */}
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-100">
              {/* Header do Modal Dinâmico */}
              <div className="px-8 py-6 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">
                      {formData.cd_funcionario
                        ? "manage_accounts"
                        : "person_add"}
                    </span>
                    {formData.cd_funcionario
                      ? "Editar Colaborador"
                      : "Adicionar à Equipe"}
                  </h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                    {formData.cd_funcionario
                      ? "Atualize as informações do talento na estrutura."
                      : "Preencha os dados do novo membro para o organograma."}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
              </div>

              {/* Corpo do Formulário */}
              <form
                onSubmit={handleSaveColaborador}
                className="flex flex-col flex-1 overflow-hidden"
              >
                <div className="p-8 overflow-y-auto no-scrollbar flex-1 space-y-6">
                  {/* Linha 1 */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      required
                      placeholder="Ex: Ana Carolina Silva"
                      value={formData.nm_completo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nm_completo: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                    />
                  </div>

                  {/* Linha 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Cargo */}
                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          Cargo Atual *
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCargoModalOpen(true)}
                          className="text-[10px] font-black text-secondary hover:text-orange-600 transition-colors flex items-center gap-1 uppercase tracking-wider"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            add_circle
                          </span>{" "}
                          Novo
                        </button>
                      </div>
                      <div className="relative">
                        <select
                          required
                          value={formData.cd_cargo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cd_cargo: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 appearance-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium cursor-pointer"
                        >
                          <option value="" disabled>
                            Selecione uma opção...
                          </option>
                          {cargos.map((c) => (
                            <option key={c.cd_cargo} value={c.cd_cargo}>
                              {c.nm_titulo}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>

                    {/* Líder */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                        Líder Imediato
                      </label>
                      <div className="relative">
                        <select
                          value={formData.cd_lider}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cd_lider: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 appearance-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium cursor-pointer"
                        >
                          <option value="">Nenhum (Topo da Hierarquia)</option>
                          {funcionarios
                            .filter(
                              (f) =>
                                f.cd_funcionario !== formData.cd_funcionario,
                            ) // Impede de ser líder de si mesmo na edição
                            .map((f) => (
                              <option
                                key={f.cd_funcionario}
                                value={f.cd_funcionario}
                              >
                                {f.nm_completo}
                              </option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Linha 3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                        Data Admissão
                      </label>
                      <input
                        type="date"
                        value={formData.dt_admissao}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dt_admissao: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                        Salário Atual (R$)
                      </label>
                      <input
                        type="number"
                        placeholder="0,00"
                        value={formData.vl_salario_atual}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vl_salario_atual: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Linha 4 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                        Tipo Contrato
                      </label>
                      <div className="relative">
                        <select
                          value={formData.tp_modelo_contrato}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tp_modelo_contrato: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 appearance-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium cursor-pointer"
                        >
                          <option value="CLT">CLT</option>
                          <option value="PJ">PJ</option>
                          <option value="Freelancer">Freelancer</option>
                          <option value="Sócio">Sócio</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                        Perfil DISC
                      </label>
                      <input
                        placeholder="Ex: DI, SC, D..."
                        maxLength={2}
                        value={formData.sg_perfil_disc}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sg_perfil_disc: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-primary focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black uppercase placeholder:font-medium placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Linha 5 */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Observações Internas
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Anotações sobre performance ou perfil..."
                      value={formData.ds_observacoes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ds_observacoes: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none font-medium"
                    />
                  </div>
                </div>

                {/* Footer do Modal - Botão Dinâmico */}
                <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-wider focus:outline-none"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formData.nm_completo}
                    className="bg-primary hover:bg-blue-800 text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-[2px] shadow-[0_8px_20px_-6px_rgba(6,67,132,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSaving
                      ? "Processando..."
                      : formData.cd_funcionario
                        ? "Salvar Alterações"
                        : "Cadastrar Agora"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL: CRIAR CARGO (Aparece sobre o modal principal) */}
        {isCargoModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Cabeçalho Padronizado */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">
                      work
                    </span>
                    Novo Cargo
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Defina uma nova função para a estrutura.
                  </p>
                </div>
                <button
                  onClick={() => setIsCargoModalOpen(false)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Corpo do Formulário */}
              <div className="p-8 space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Nome da Função
                  </label>
                  <input
                    value={cargoFormData.nm_titulo}
                    onChange={(e) =>
                      setCargoFormData({
                        ...cargoFormData,
                        nm_titulo: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    placeholder="Ex: Analista de Dados Sr"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Departamento / Setor
                  </label>
                  <input
                    value={cargoFormData.ds_setor}
                    onChange={(e) =>
                      setCargoFormData({
                        ...cargoFormData,
                        ds_setor: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                    placeholder="Ex: Business Intelligence"
                  />
                </div>

                {/* Ações */}
                <div className="pt-4 flex flex-col gap-3">
                  <button
                    onClick={handleSaveCargo}
                    disabled={isSavingCargo}
                    className="w-full py-3 bg-secondary hover:bg-orange-600 text-white text-sm font-black rounded-xl shadow-lg shadow-orange-900/20 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {isSavingCargo ? "Salvando..." : "Confirmar e Vincular"}
                  </button>
                  <button
                    onClick={() => setIsCargoModalOpen(false)}
                    className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Voltar para o cadastro
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="bg-white/95 backdrop-blur-sm pt-8 pb-6 px-8 flex justify-between items-end border-b border-slate-200 shadow-sm sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Organograma Dinâmico
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Visão hierárquica e mapeamento comportamental da equipe
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // AQUI ESTÁ O SEGREDO: Resetar TODO o formulário antes de abrir
                setFormData({
                  cd_funcionario: null, // Garante que será um INSERT
                  nm_completo: "",
                  cd_lider: "",
                  cd_cargo: "",
                  dt_admissao: "",
                  vl_salario_atual: "",
                  tp_modelo_contrato: "CLT",
                  sg_perfil_disc: "",
                  ds_observacoes: "",
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Novo Colaborador
            </button>
          </div>
        </header>

        {/* CONTAINER DA ÁRVORE */}
        <div className="flex-1 overflow-auto bg-[#F5F7FA] p-10 flex justify-center items-start cursor-grab active:cursor-grabbing">
          {funcionarios.length === 0 ? (
            <div className="text-slate-400 mt-20 flex flex-col items-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
                account_tree
              </span>
              <p>Nenhum funcionário cadastrado nesta empresa.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Adicionar o Primeiro
              </button>
            </div>
          ) : (
            <div className="min-w-max pb-20 pt-4">
              {raizes.map((raiz) => (
                <div
                  key={raiz.cd_funcionario}
                  className="flex flex-col items-center"
                >
                  <div className="flex justify-center mb-0">
                    <NodeCard colab={raiz} />
                  </div>
                  {renderTree(raiz.cd_funcionario)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDE PANEL (PERFIL DETALHADO DO COLABORADOR) */}
        <div
          className={`w-[400px] bg-white border-l border-slate-200 shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] absolute right-0 top-0 bottom-0 z-50 flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
            isPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedColab && (
            <>
              {/* Header do Painel - Estilo Glassmorphism Suave */}
              <div className="p-8 pb-6 border-b border-slate-100 bg-slate-50/50 relative shrink-0">
                {/* Barra Superior de Botões */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                  <div className="flex gap-2">
                    {/* Botão Editar */}
                    <button
                      onClick={() => {
                        setFormData({
                          cd_funcionario: selectedColab.cd_funcionario || null, // <--- ID passado aqui
                          nm_completo: selectedColab.nm_completo,
                          cd_lider: selectedColab.cd_lider || "",
                          cd_cargo: selectedColab.cd_cargo || "",
                          dt_admissao: selectedColab.dt_admissao || "",
                          vl_salario_atual:
                            selectedColab.vl_salario_atual?.toString() || "",
                          tp_modelo_contrato:
                            selectedColab.tp_modelo_contratacao || "CLT",
                          sg_perfil_disc: selectedColab.sg_perfil_disc || "",
                          ds_observacoes: selectedColab.ds_observacoes || "",
                        });
                        setIsModalOpen(true);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                    </button>

                    {/* Botão Excluir */}
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            `Deseja realmente remover ${selectedColab.nm_completo}?`,
                          )
                        ) {
                          const { error } = await supabase
                            .from("FUNCIONARIOS")
                            .update({ sn_ativo: false }) // Soft delete
                            .eq("cd_funcionario", selectedColab.cd_funcionario);

                          if (!error) {
                            handleClosePanel();
                            buscarEquipe();
                          }
                        }
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm active:scale-95"
                      title="Excluir Colaborador"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  </div>

                  {/* Fechar Painel */}
                  <button
                    onClick={handleClosePanel}
                    className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-800 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>

                {/* Perfil Central: Sem Absolute no DISC */}
                <div className="flex flex-col items-center text-center mt-10">
                  <div className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className="w-28 h-28 rounded-full bg-white border-[4px] border-white shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] flex items-center justify-center text-slate-300 font-black text-4xl uppercase overflow-hidden ring-1 ring-slate-100">
                      {getIniciais(selectedColab.nm_completo)}
                    </div>

                    {/* Badge DISC: Margem Negativa em vez de Absolute */}
                    <div
                      className={`-mt-5 px-5 py-1.5 rounded-full border-[3px] border-white shadow-lg z-10 whitespace-nowrap ${getDiscColor(
                        selectedColab.sg_perfil_disc,
                      )}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white drop-shadow-sm">
                        PERFIL {selectedColab.sg_perfil_disc || "DI"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-tight mt-4 uppercase">
                    {selectedColab.nm_completo}
                  </h3>
                  <p className="text-xs font-bold text-primary mt-1 uppercase tracking-[0.2em] opacity-70">
                    {selectedColab.CARGOS?.nm_titulo || "Cargo não definido"}
                  </p>
                </div>
              </div>

              {/* Corpo do Painel - Conteúdo com Scroll Elegante */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-white">
                {/* Stats Grid - Cards de Informação Rápida */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl text-center hover:bg-white hover:shadow-sm transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Tempo de Casa
                    </p>
                    <p className="text-lg font-black text-slate-700">
                      {calcularTempoCasa(selectedColab.dt_admissao)}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl text-center hover:bg-white hover:shadow-sm transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Contrato
                    </p>
                    <p className="text-lg font-black text-slate-700 uppercase">
                      {selectedColab.tp_modelo_contratacao || "CLT"}
                    </p>
                  </div>
                </div>

                {/* Observações com Borda de Destaque */}
                {selectedColab.ds_observacoes && (
                  <div className="relative group">
                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-secondary rounded-full"></div>
                    <div className="bg-orange-50/30 border border-orange-100/50 p-5 rounded-2xl pl-6">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                        Observações Estratégicas
                      </p>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                        "{selectedColab.ds_observacoes}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Área do Gráfico Radar */}
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">
                        radar
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Mapeamento de Competências
                    </h4>
                  </div>
                  <div className="h-56 w-full flex justify-center -ml-4 items-center bg-slate-50/30 rounded-3xl border border-dashed border-slate-200 p-4">
                    <Chart
                      options={miniRadarOptions}
                      series={[
                        {
                          name: "Nota",
                          data: selectedColab.js_pontuacao_disc
                            ?.competencias || [85, 70, 90, 65, 80],
                        },
                      ]}
                      type="radar"
                      height={240}
                    />
                  </div>
                </div>

                {/* Listagem de Detalhes Adicionais */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center group cursor-default">
                    <span className="text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                      Liderados Diretos
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-black transition-all group-hover:bg-primary group-hover:text-white">
                      {
                        funcionarios.filter(
                          (c) => c.cd_lider === selectedColab.cd_funcionario,
                        ).length
                      }{" "}
                      Pessoas
                    </span>
                  </div>
                  <div className="flex justify-between items-center group cursor-default">
                    <span className="text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                      Remuneração Atual
                    </span>
                    <span className="text-base font-black text-slate-800 group-hover:text-primary transition-colors">
                      {selectedColab.vl_salario_atual
                        ? `R$ ${selectedColab.vl_salario_atual.toLocaleString("pt-BR")}`
                        : "Sigiloso"}
                    </span>
                  </div>
                </div>
              </div>
              {/* Botão de Ação Inferior no Painel Lateral */}
              {/* Botão Inferior (Ações Principais) */}
              <div className="p-8 border-t border-slate-100 bg-white shrink-0 flex flex-col gap-3 z-10">
                {/* NOVO: Botão de Gerar/Copiar Link do Teste */}
                <button
                  onClick={() => {
                    // Pega a URL raiz do seu site (localhost ou site em produção)
                    const baseUrl = window.location.origin;
                    const link = `${baseUrl}/pesquisa/disc/${selectedColab.cd_funcionario}`;

                    // Copia para a área de transferência
                    navigator.clipboard.writeText(link);

                    // Efeito visual de "Copiado"
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className={`w-full flex h-12 items-center justify-center gap-2 rounded-xl transition-all duration-300 font-bold active:scale-95 border
                    ${
                      copiedLink
                        ? "bg-green-50 text-green-600 border-green-200"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {copiedLink ? "check_circle" : "content_copy"}
                  </span>
                  <span className="text-xs uppercase tracking-widest">
                    {copiedLink ? "Link Copiado!" : "Copiar Link do Teste"}
                  </span>
                </button>

                {/* Botão Original: Ver Perfil Completo */}
                <button
                  onClick={() =>
                    router.push(
                      `/projetos/${params.id}/equipe/${selectedColab.cd_funcionario}`,
                    )
                  }
                  className="w-full flex h-14 items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 shadow-xl shadow-blue-900/20 active:scale-95 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">
                    person_search
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Ver Perfil Completo
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
