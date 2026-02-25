"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ClienteList {
  cd_empresa: string;
  nm_fantasia: string;
  nm_razao_social: string;
  ds_segmento: string;
  nr_cnpj: string;
  nm_responsavel_contato: string;
  PROJETOS: { tp_status: string }[];
}

export default function ClientesPage() {
  const router = useRouter();

  // Estados Globais
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteList[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "TODOS" | "ATIVOS" | "PROSPECCAO"
  >("TODOS");

  // Estados Modal de Empresa (Criar/Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isBuscandoCnpj, setIsBuscandoCnpj] = useState(false);

  // Aba do formulário (1 - Cadastral, 2 - Diagnóstico)
  const [formTab, setFormTab] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    nm_razao_social: "",
    nm_fantasia: "",
    nr_cnpj: "",
    ds_segmento: "",
    nm_responsavel_contato: "",
    // Novos campos da Ficha
    ds_endereco: "",
    nm_responsavel_legal: "",
    ds_email: "",
    ds_telefone: "",
    nr_faturamento_mensal: "",
    nr_qtd_colaboradores: "",
    nr_qtd_lideres: "",
    tx_dor_empresario: "",
    tx_desafios_rh: "",
    ds_nivel_formalizacao: "",
    tx_expectativa: "",
    ds_urgencia: "",
  });

  // ESTADOS E FUNÇÕES DO MODAL DE ACESSO
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isGerandoAcesso, setIsGerandoAcesso] = useState(false);
  const [accessTarget, setAccessTarget] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [accessData, setAccessData] = useState({
    nome: "",
    email: "",
    password: "",
  });

  const openAccessModal = (id: string, nome: string) => {
    setIsAccessModalOpen(true);
    setAccessTarget({ id, nome });
    setAccessData({ nome: "", email: "", password: "" });
  };

  const handleGenerateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessTarget) return;

    setIsGerandoAcesso(true);
    try {
      const response = await fetch("/api/clientes/criar-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: accessData.email,
          password: accessData.password,
          nome: accessData.nome,
          cd_empresa: accessTarget.id,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro no servidor.");

      alert("Acesso gerado com sucesso! O cliente já pode logar no Portal.");
      setIsAccessModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao gerar acesso: ${error.message}`);
    } finally {
      setIsGerandoAcesso(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, [router]);

  const carregarClientes = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    try {
      const { data } = await supabase
        .from("EMPRESAS")
        .select(
          `cd_empresa, nm_fantasia, nm_razao_social, ds_segmento, nr_cnpj, nm_responsavel_contato, PROJETOS ( tp_status )`,
        )
        .order("nm_fantasia");

      if (data) setClientes(data as any);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const aplicarMascaraCnpj = (valor: string) => {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const buscarCnpj = async (cnpjCompleto: string) => {
    const cnpjLimpo = cnpjCompleto.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) return;

    setIsBuscandoCnpj(true);
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
      );
      if (!response.ok) throw new Error("CNPJ inválido ou não encontrado");
      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        nm_razao_social: data.razao_social || prev.nm_razao_social,
        nm_fantasia:
          data.nome_fantasia || data.razao_social || prev.nm_fantasia,
        ds_endereco: `${data.logradouro}, ${data.numero} - ${data.municipio}/${data.uf}`,
        ds_telefone: data.ddd_telefone_1 || prev.ds_telefone,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsBuscandoCnpj(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormTab(1);
    setFormData({
      nm_razao_social: "",
      nm_fantasia: "",
      nr_cnpj: "",
      ds_segmento: "",
      nm_responsavel_contato: "",
      ds_endereco: "",
      nm_responsavel_legal: "",
      ds_email: "",
      ds_telefone: "",
      nr_faturamento_mensal: "",
      nr_qtd_colaboradores: "",
      nr_qtd_lideres: "",
      tx_dor_empresario: "",
      tx_desafios_rh: "",
      ds_nivel_formalizacao: "",
      tx_expectativa: "",
      ds_urgencia: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (clienteId: string) => {
    try {
      const { data, error } = await supabase
        .from("EMPRESAS")
        .select("*")
        .eq("cd_empresa", clienteId)
        .single();
      if (error) throw error;

      if (data) {
        setEditingId(data.cd_empresa);
        setFormTab(1);
        setFormData({
          nm_razao_social: data.nm_razao_social || "",
          nm_fantasia: data.nm_fantasia || "",
          nr_cnpj: data.nr_cnpj || "",
          ds_segmento: data.ds_segmento || "",
          nm_responsavel_contato: data.nm_responsavel_contato || "",
          ds_endereco: data.ds_endereco || "",
          nm_responsavel_legal: data.nm_responsavel_legal || "",
          ds_email: data.ds_email || "",
          ds_telefone: data.ds_telefone || "",
          nr_faturamento_mensal: data.nr_faturamento_mensal?.toString() || "",
          nr_qtd_colaboradores: data.nr_qtd_colaboradores?.toString() || "",
          nr_qtd_lideres: data.nr_qtd_lideres?.toString() || "",
          tx_dor_empresario: data.tx_dor_empresario || "",
          tx_desafios_rh: data.tx_desafios_rh || "",
          ds_nivel_formalizacao: data.ds_nivel_formalizacao || "",
          tx_expectativa: data.tx_expectativa || "",
          ds_urgencia: data.ds_urgencia || "",
        });
        setIsModalOpen(true);
      }
    } catch (e) {
      alert("Erro ao buscar dados completos do cliente");
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payloadToSave = {
      ...formData,
      nr_faturamento_mensal: formData.nr_faturamento_mensal
        ? parseFloat(formData.nr_faturamento_mensal)
        : null,
      nr_qtd_colaboradores: formData.nr_qtd_colaboradores
        ? parseInt(formData.nr_qtd_colaboradores)
        : null,
      nr_qtd_lideres: formData.nr_qtd_lideres
        ? parseInt(formData.nr_qtd_lideres)
        : null,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("EMPRESAS")
          .update(payloadToSave)
          .eq("cd_empresa", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("EMPRESAS")
          .insert([payloadToSave]);
        if (error) throw error;
      }
      await carregarClientes();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar dados da empresa.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: string, nome: string) => {
    if (
      !window.confirm(
        `Tem certeza que deseja DELETAR a empresa ${nome}? Todos os projetos vinculados serão apagados.`,
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("EMPRESAS")
        .delete()
        .eq("cd_empresa", id);
      if (error) throw error;
      setClientes(clientes.filter((c) => c.cd_empresa !== id));
    } catch (error) {
      alert("Erro ao deletar empresa.");
    }
  };

  const getIconForSegment = (segmento: string) => {
    const seg = (segmento || "").toLowerCase();
    if (seg.includes("tec") || seg.includes("sys"))
      return {
        icon: "laptop_mac",
        color: "text-primary bg-blue-50 border-blue-100",
      };
    if (seg.includes("saúde") || seg.includes("med") || seg.includes("hosp"))
      return {
        icon: "medication",
        color: "text-primary bg-blue-50 border-blue-100",
      };
    if (seg.includes("varejo") || seg.includes("loja"))
      return {
        icon: "shopping_bag",
        color: "text-accent bg-orange-50 border-orange-100",
      };
    if (seg.includes("const") || seg.includes("eng"))
      return {
        icon: "construction",
        color: "text-slate-500 bg-slate-50 border-slate-200",
      };
    return {
      icon: "corporate_fare",
      color: "text-primary bg-blue-50 border-blue-100",
    };
  };

  const clientesFiltrados = clientes.filter((c) => {
    const matchSearch =
      c.nm_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nm_razao_social?.toLowerCase().includes(searchTerm.toLowerCase());
    const projetosAtivos =
      c.PROJETOS?.filter((p) => p.tp_status === "ATIVO").length || 0;
    const projetosProspect =
      c.PROJETOS?.filter((p) => p.tp_status === "PROSPECT").length || 0;
    if (filtroStatus === "ATIVOS") return matchSearch && projetosAtivos > 0;
    if (filtroStatus === "PROSPECCAO")
      return matchSearch && projetosAtivos === 0 && projetosProspect > 0;
    return matchSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center flex-col gap-4 text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando Clientes...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen w-full overflow-hidden bg-background-light font-display text-text-main antialiased relative">
        {/* MODAL: CRIAR / EDITAR EMPRESA (COM ABAS) */}
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent">
                    {editingId ? "edit_square" : "add_business"}
                  </span>
                  {editingId
                    ? "Editar Ficha da Empresa"
                    : "Nova Ficha da Empresa"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* TABS HEADER */}
              <div className="flex border-b border-slate-200 px-6 pt-2 shrink-0 bg-white">
                <button
                  onClick={() => setFormTab(1)}
                  className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${formTab === 1 ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Dados Institucionais
                </button>
                <button
                  onClick={() => setFormTab(2)}
                  className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${formTab === 2 ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Diagnóstico Estratégico
                </button>
              </div>

              <form
                onSubmit={handleSaveClient}
                className="flex flex-col overflow-hidden"
              >
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                  {/* ABA 1: DADOS CADASTRAIS */}
                  {formTab === 1 && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700">
                          CNPJ {editingId ? "" : "(Busca Automática)"}
                        </label>
                        <div className="relative">
                          <input
                            placeholder="00.000.000/0000-00"
                            value={formData.nr_cnpj}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nr_cnpj: aplicarMascaraCnpj(e.target.value),
                              })
                            }
                            onBlur={(e) =>
                              !editingId && buscarCnpj(e.target.value)
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                          {isBuscandoCnpj && (
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin">
                              progress_activity
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">
                            Razão Social *
                          </label>
                          <input
                            required
                            placeholder="Nome Jurídico"
                            value={formData.nm_razao_social}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nm_razao_social: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">
                            Nome Fantasia
                          </label>
                          <input
                            placeholder="Nome Comercial"
                            value={formData.nm_fantasia}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nm_fantasia: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700">
                          Endereço Completo / Cidade
                        </label>
                        <input
                          placeholder="Rua, Número, Cidade - Estado"
                          value={formData.ds_endereco}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ds_endereco: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">
                            Contato / Responsável Legal
                          </label>
                          <input
                            placeholder="Nome do decisor/RH"
                            value={formData.nm_responsavel_legal}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nm_responsavel_legal: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">
                            Segmento
                          </label>
                          <input
                            placeholder="Ex: Tecnologia, Indústria..."
                            value={formData.ds_segmento}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ds_segmento: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">
                            E-mail de Contato
                          </label>
                          <input
                            type="email"
                            placeholder="contato@empresa.com"
                            value={formData.ds_email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ds_email: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">
                            Telefone / WhatsApp
                          </label>
                          <input
                            placeholder="(00) 00000-0000"
                            value={formData.ds_telefone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ds_telefone: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Faturamento (R$)
                          </label>
                          <input
                            type="number"
                            placeholder="Opcional"
                            value={formData.nr_faturamento_mensal}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nr_faturamento_mensal: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Qtd Colaboradores
                          </label>
                          <input
                            type="number"
                            placeholder="Ex: 50"
                            value={formData.nr_qtd_colaboradores}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nr_qtd_colaboradores: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Qtd Líderes
                          </label>
                          <input
                            type="number"
                            placeholder="Ex: 5"
                            value={formData.nr_qtd_lideres}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nr_qtd_lideres: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABA 2: DIAGNÓSTICO */}
                  {formTab === 2 && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700">
                          Maior dor descrita pelo empresário
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ex: Turnover muito alto, dificuldade em reter talentos..."
                          value={formData.tx_dor_empresario}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tx_dor_empresario: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700">
                          Principais desafios na gestão de pessoas
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ex: Falta de plano de carreira, conflitos internos..."
                          value={formData.tx_desafios_rh}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tx_desafios_rh: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">
                            Nível de Formalização (Processos)
                          </label>
                          <select
                            value={formData.ds_nivel_formalizacao}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ds_nivel_formalizacao: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            <option value="">Selecione...</option>
                            <option value="Inexistente">
                              Inexistente (Tudo verbal)
                            </option>
                            <option value="Baixo">
                              Baixo (Alguns documentos)
                            </option>
                            <option value="Médio">
                              Médio (Maioria documentada)
                            </option>
                            <option value="Alto">
                              Alto (Maturidade total)
                            </option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">
                            Senso de Urgência
                          </label>
                          <select
                            value={formData.ds_urgencia}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ds_urgencia: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            <option value="">Selecione...</option>
                            <option value="Baixa">
                              Baixa (Planejamento futuro)
                            </option>
                            <option value="Média">Média (Até 3 meses)</option>
                            <option value="Alta">
                              Alta (Imediato, problema crítico)
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700">
                          Expectativa principal com a consultoria
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ex: Organizar o setor financeiro e criar metas claras."
                          value={formData.tx_expectativa}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tx_expectativa: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formData.nm_razao_social}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg disabled:opacity-50"
                  >
                    {isSaving
                      ? "Salvando..."
                      : editingId
                        ? "Atualizar Ficha"
                        : "Salvar Ficha Inicial"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: GERAR ACESSO (MANTIDO IGUAL) */}
        {isAccessModalOpen && accessTarget && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-blue-50/50">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    vpn_key
                  </span>
                  Gerar Acesso ao Portal
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Criando credenciais para: <strong>{accessTarget.nome}</strong>
                </p>
              </div>
              <form
                onSubmit={handleGenerateAccess}
                className="p-6 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Nome do Usuário *
                  </label>
                  <input
                    required
                    placeholder="Ex: João Silva"
                    value={accessData.nome}
                    onChange={(e) =>
                      setAccessData({ ...accessData, nome: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    E-mail Corporativo *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="joao@empresa.com.br"
                    value={accessData.email}
                    onChange={(e) =>
                      setAccessData({ ...accessData, email: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Senha Temporária *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Minimo 6 caracteres"
                    minLength={6}
                    value={accessData.password}
                    onChange={(e) =>
                      setAccessData({ ...accessData, password: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAccessModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isGerandoAcesso ||
                      !accessData.email ||
                      !accessData.password
                    }
                    className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-bold rounded-lg disabled:opacity-50"
                  >
                    {isGerandoAcesso ? "Processando..." : "Criar Acesso"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Sidebar onLogout={handleLogout} />

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <TopBar />
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 flex-shrink-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-primary tracking-tight">
                Meus Clientes
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Gerencie o portfólio de empresas e projetos ativos.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 border border-slate-200 focus-within:border-primary/30 w-72">
                <span className="material-symbols-outlined text-slate-400 text-xl">
                  search
                </span>
                <input
                  className="w-full bg-transparent text-sm text-graphite placeholder-slate-400 focus:outline-none"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-dark shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">
                  add_circle
                </span>{" "}
                Adicionar Cliente
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 bg-[#F5F7FA]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltroStatus("TODOS")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${filtroStatus === "TODOS" ? "bg-white border border-slate-200 text-primary" : "bg-transparent text-slate-500 hover:bg-white/50"}`}
                >
                  Todos ({clientes.length})
                </button>
                <button
                  onClick={() => setFiltroStatus("ATIVOS")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${filtroStatus === "ATIVOS" ? "bg-white border border-slate-200 text-primary" : "bg-transparent text-slate-500 hover:bg-white/50"}`}
                >
                  Ativos (
                  {
                    clientes.filter(
                      (c) =>
                        (c.PROJETOS?.filter((p) => p.tp_status === "ATIVO")
                          .length || 0) > 0,
                    ).length
                  }
                  )
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {clientesFiltrados.map((cliente) => {
                const style = getIconForSegment(cliente.ds_segmento);
                const totalProjetos = cliente.PROJETOS?.length || 0;
                const projetosAtivos =
                  cliente.PROJETOS?.filter((p) => p.tp_status === "ATIVO")
                    .length || 0;
                const isAtivo = projetosAtivos > 0;

                return (
                  <div
                    key={cliente.cd_empresa}
                    className={`group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col ${!isAtivo && totalProjetos > 0 ? "opacity-80" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div
                        className={`h-14 w-14 rounded-lg flex items-center justify-center border ${style.color}`}
                      >
                        <span className="material-symbols-outlined text-3xl">
                          {style.icon}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            openAccessModal(
                              cliente.cd_empresa,
                              cliente.nm_fantasia || cliente.nm_razao_social,
                            )
                          }
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                          title="Gerar Acesso Cliente"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            key
                          </span>
                        </button>
                        <button
                          onClick={() => openEditModal(cliente.cd_empresa)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded"
                          title="Editar Ficha da Empresa"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteClient(
                              cliente.cd_empresa,
                              cliente.nm_fantasia || cliente.nm_razao_social,
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Deletar Empresa"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-graphite group-hover:text-primary transition-colors truncate">
                        {cliente.nm_fantasia || cliente.nm_razao_social}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {cliente.ds_segmento ? (
                          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider truncate max-w-[120px]">
                            {cliente.ds_segmento}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sem segmento
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 mb-8 flex-grow">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Projetos Ativos</span>
                        {projetosAtivos > 0 ? (
                          <span className="font-bold text-primary bg-blue-50 px-2 py-0.5 rounded">
                            0{projetosAtivos} Projeto
                            {projetosAtivos > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            Nenhum
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
