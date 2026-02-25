"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Tipagens
interface EmpresaDetalhe {
  cd_empresa: string;
  nm_fantasia: string;
  nm_razao_social: string;
  nr_cnpj: string;
  ds_segmento: string;
  nr_horas_contratadas: number;
  nr_horas_consumidas: number;
  ts_criacao: string;
}

export default function FichaEmpresaPage() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [empresaData, setEmpresaData] = useState<EmpresaDetalhe | null>(null);

  // Estados do Modal de Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formTab, setFormTab] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    buscarDados();
  }, [params.id]);

  const buscarDados = async () => {
    const projetoId = params.id as string;
    if (!projetoId) return;

    try {
      const { data, error } = await supabase
        .from("PROJETOS")
        .select(
          `
          nr_horas_contratadas, 
          nr_horas_consumidas,
          ts_criacao,
          EMPRESAS (
            cd_empresa, nm_fantasia, nm_razao_social, nr_cnpj, ds_segmento, nm_responsavel_contato,
            ds_endereco, nm_responsavel_legal, ds_email, ds_telefone, nr_faturamento_mensal,
            nr_qtd_colaboradores, nr_qtd_lideres, tx_dor_empresario, tx_desafios_rh,
            ds_nivel_formalizacao, tx_expectativa, ds_urgencia
          )
        `,
        )
        .eq("cd_projeto", projetoId)
        .single();

      if (error) throw error;

      if (data) {
        // Salva os dados resumidos para a tela
        setEmpresaData({
          cd_empresa: data.EMPRESAS[0].cd_empresa,
          nm_fantasia: data.EMPRESAS[0].nm_fantasia,
          nm_razao_social: data.EMPRESAS[0].nm_razao_social || "Não cadastrado",
          nr_cnpj: data.EMPRESAS[0].nr_cnpj || "Não cadastrado",
          ds_segmento: data.EMPRESAS[0].ds_segmento || "Sem segmento",
          nr_horas_contratadas: data.nr_horas_contratadas || 0,
          nr_horas_consumidas: data.nr_horas_consumidas || 0,
          ts_criacao: data.ts_criacao,
        });

        // Preenche o formulário invisível com todos os dados da tabela
        setFormData({
          nm_razao_social: data.EMPRESAS[0].nm_razao_social || "",
          nm_fantasia: data.EMPRESAS[0].nm_fantasia || "",
          nr_cnpj: data.EMPRESAS[0].nr_cnpj || "",
          ds_segmento: data.EMPRESAS[0].ds_segmento || "",
          nm_responsavel_contato: data.EMPRESAS[0].nm_responsavel_contato || "",
          ds_endereco: data.EMPRESAS[0].ds_endereco || "",
          nm_responsavel_legal: data.EMPRESAS[0].nm_responsavel_legal || "",
          ds_email: data.EMPRESAS[0].ds_email || "",
          ds_telefone: data.EMPRESAS[0].ds_telefone || "",
          nr_faturamento_mensal:
            data.EMPRESAS[0].nr_faturamento_mensal?.toString() || "",
          nr_qtd_colaboradores:
            data.EMPRESAS[0].nr_qtd_colaboradores?.toString() || "",
          nr_qtd_lideres: data.EMPRESAS[0].nr_qtd_lideres?.toString() || "",
          tx_dor_empresario: data.EMPRESAS[0].tx_dor_empresario || "",
          tx_desafios_rh: data.EMPRESAS[0].tx_desafios_rh || "",
          ds_nivel_formalizacao: data.EMPRESAS[0].ds_nivel_formalizacao || "",
          tx_expectativa: data.EMPRESAS[0].tx_expectativa || "",
          ds_urgencia: data.EMPRESAS[0].ds_urgencia || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar Ficha da Empresa:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para Atualizar no Banco
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaData?.cd_empresa) return;
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
      const { error } = await supabase
        .from("EMPRESAS")
        .update(payloadToSave)
        .eq("cd_empresa", empresaData.cd_empresa);

      if (error) throw error;

      await buscarDados(); // Recarrega os dados da tela
      setIsModalOpen(false);
      alert("Ficha da Empresa atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar dados da empresa.");
    } finally {
      setIsSaving(false);
    }
  };

  // const handleNovoRegistro = () => {
  //   alert("Função de Novo Registro da Timeline em desenvolvimento!");
  // };

  if (loading || !empresaData) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center flex-col gap-4 text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando Ficha da Empresa...</span>
      </div>
    );
  }

  const consumido = empresaData.nr_horas_consumidas;
  const total = empresaData.nr_horas_contratadas || 1;
  const percentual = Math.min(Math.round((consumido / total) * 100), 100);
  const anoInicio = new Date(empresaData.ts_criacao).getFullYear();

  return (
    <>
      <div className="flex-1 overflow-y-auto relative bg-[#F5F7FA] h-full font-display">
        {/* MODAL: EDITAR EMPRESA (COM ABAS) */}
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent">
                    edit_square
                  </span>
                  Editar Ficha da Empresa
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
                          CNPJ
                        </label>
                        <input
                          disabled
                          value={formData.nr_cnpj}
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-slate-700">
                            Razão Social *
                          </label>
                          <input
                            required
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
                            value={formData.nm_responsavel_contato}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nm_responsavel_contato: e.target.value,
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
                            Nível de Formalização
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
                            <option value="Inexistente">Inexistente</option>
                            <option value="Baixo">Baixo</option>
                            <option value="Médio">Médio</option>
                            <option value="Alto">Alto</option>
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
                            <option value="Baixa">Baixa</option>
                            <option value="Média">Média</option>
                            <option value="Alta">Alta</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700">
                          Expectativa principal
                        </label>
                        <textarea
                          rows={2}
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
                    {isSaving ? "Salvando..." : "Atualizar Ficha"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CABEÇALHO */}
        <header className="bg-white/95 backdrop-blur-sm px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 shadow-sm sticky top-0 z-30">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-extrabold text-primary tracking-tight">
                Ficha da Empresa
              </h2>
              <span className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border bg-blue-50 text-primary border-blue-200">
                Dados e Contrato
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <span>Visão detalhada do cliente</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none hover:text-primary hover:border-primary/30"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              Editar Dados
            </button>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
          {/* CARD PRINCIPAL (RESUMO) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="h-24 w-24 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-200 text-slate-400 shadow-inner">
                <span className="material-symbols-outlined text-5xl">
                  domain
                </span>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
                  {empresaData.nm_fantasia}
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-5 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      factory
                    </span>
                    {empresaData.nm_razao_social}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      pin_drop
                    </span>
                    Matriz
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="bg-blue-50 text-primary text-xs font-bold px-3 py-1 rounded-md border border-blue-100">
                    Cliente desde {anoInicio}
                  </span>
                  <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-md border border-green-200">
                    Contrato Ativo
                  </span>
                </div>
              </div>

              <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 flex flex-col justify-center items-center md:items-end">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                  Status Financeiro
                </p>
                <span className="text-2xl font-black text-green-500">
                  Em dia
                </span>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Nenhuma pendência financeira
                </p>
              </div>
            </div>
          </div>

          {/* 3 CARDS INFERIORES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card: Dados Cadastrais */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  badge
                </span>
                <h3 className="font-bold text-slate-800 text-lg">
                  Dados Cadastrais
                </h3>
              </div>
              <div className="space-y-5 flex-1">
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    CNPJ
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {empresaData.nr_cnpj}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    Contato Principal
                  </p>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-primary font-black text-sm uppercase">
                      {formData.nm_responsavel_contato
                        ? formData.nm_responsavel_contato.substring(0, 2)
                        : "--"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {formData.nm_responsavel_contato || "A definir"}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Ponto Focal
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pl-1 space-y-1.5">
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                        email
                      </span>
                      {formData.ds_email || "Não informado"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                        call
                      </span>
                      {formData.ds_telefone || "Não informado"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Contrato e Faturamento */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                <span className="material-symbols-outlined text-accent text-[22px]">
                  description
                </span>
                <h3 className="font-bold text-slate-800 text-lg">
                  Contrato Atual
                </h3>
              </div>
              <div className="space-y-5 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                      Início
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(empresaData.ts_criacao).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                      Status
                    </p>
                    <p className="text-sm font-bold text-green-600">Vigente</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                      Consumo de Horas
                    </p>
                    <p className="text-sm font-black text-accent">
                      {percentual}%
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-accent h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentual}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium text-right">
                    {consumido} de {total} horas contratadas
                  </p>
                </div>
              </div>
            </div>

            {/* Card: Diagnóstico */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                <span className="material-symbols-outlined text-blue-500 text-[22px]">
                  monitoring
                </span>
                <h3 className="font-bold text-slate-800 text-lg">
                  Diagnóstico Resumido
                </h3>
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Dor Principal
                  </p>
                  <p
                    className="text-xs text-slate-600 font-medium line-clamp-2"
                    title={formData.tx_dor_empresario}
                  >
                    {formData.tx_dor_empresario || "Não preenchida."}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Expectativa
                  </p>
                  <p
                    className="text-xs text-slate-600 font-medium line-clamp-2"
                    title={formData.tx_expectativa}
                  >
                    {formData.tx_expectativa || "Não preenchida."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                      Formalização
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {formData.ds_nivel_formalizacao || "--"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                      Urgência
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {formData.ds_urgencia || "--"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TIMELINE DE INTERAÇÕES */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mt-6">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-50 text-accent rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">
                    history
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg leading-tight">
                    Histórico do Projeto
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Registro de ações e entregas
                  </p>
                </div>
              </div>
              {/* <button
                onClick={handleNovoRegistro}
                className="flex items-center gap-2 text-sm text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg font-bold transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                Novo Registro
              </button> */}
            </div>

            <div className="relative border-l-2 border-slate-100 ml-4 space-y-10 py-2">
              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-green-500 border-4 border-white shadow-sm flex items-center justify-center"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Projeto Criado
                    </h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      O projeto foi estruturado no sistema com a carga horária
                      inicial definida.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-bold whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                    {new Date(empresaData.ts_criacao).toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                </div>
              </div>

              <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-slate-300 border-4 border-white shadow-sm"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="opacity-60">
                    <h4 className="text-sm font-bold text-slate-800">
                      Aguardando Kick-off
                    </h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      Nenhuma interação registrada após a criação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
