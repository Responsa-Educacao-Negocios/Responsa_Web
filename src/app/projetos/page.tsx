"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Tipagens
interface ProjetoList {
  cd_projeto: string;
  nr_horas_contratadas: number;
  nr_horas_consumidas: number;
  tp_status: string;
  dt_prazo_estimado: string;
  cd_empresa: string;
  cd_tipo_consultoria: string;
  EMPRESAS: { nm_fantasia: string };
  TIPOS_CONSULTORIA: { nm_servico: string };
}

interface DropdownOption {
  id: string;
  nome: string;
}

export default function ProjetosPage() {
  const router = useRouter();

  // Estados da Página
  const [loading, setLoading] = useState(true);
  const [projetos, setProjetos] = useState<ProjetoList[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados dos Dropdowns
  const [empresas, setEmpresas] = useState<DropdownOption[]>([]);
  const [servicos, setServicos] = useState<DropdownOption[]>([]);

  // Estados do Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cd_empresa: "",
    cd_tipo_consultoria: "",
    nr_horas_contratadas: "",
    dt_prazo_estimado: "",
    tp_status: "ATIVO",
  });

  // Estados do Modal de Deleção
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjetoList | null>(
    null,
  );

  // 1. Carregar Dados Iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: projetosData } = await supabase
          .from("PROJETOS")
          .select(
            `
            cd_projeto, nr_horas_contratadas, nr_horas_consumidas, tp_status, dt_prazo_estimado,
            cd_empresa, cd_tipo_consultoria,
            EMPRESAS ( nm_fantasia ),
            TIPOS_CONSULTORIA ( nm_servico )
          `,
          )
          .order("ts_atualizacao", { ascending: false });

        if (projetosData) setProjetos(projetosData as any);

        const { data: empresasData } = await supabase
          .from("EMPRESAS")
          .select("cd_empresa, nm_fantasia")
          .order("nm_fantasia");
        if (empresasData)
          setEmpresas(
            empresasData.map((e) => ({
              id: e.cd_empresa,
              nome: e.nm_fantasia,
            })),
          );

        const { data: servicosData } = await supabase
          .from("TIPOS_CONSULTORIA")
          .select("cd_tipo_consultoria, nm_servico")
          .order("nm_servico");
        if (servicosData)
          setServicos(
            servicosData.map((s) => ({
              id: s.cd_tipo_consultoria,
              nome: s.nm_servico,
            })),
          );
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, [router]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      cd_empresa: "",
      cd_tipo_consultoria: "",
      nr_horas_contratadas: "",
      dt_prazo_estimado: "",
      tp_status: "ATIVO",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (projeto: ProjetoList) => {
    setEditingId(projeto.cd_projeto);
    setFormData({
      cd_empresa: projeto.cd_empresa,
      cd_tipo_consultoria: projeto.cd_tipo_consultoria,
      nr_horas_contratadas: projeto.nr_horas_contratadas.toString(),
      dt_prazo_estimado: projeto.dt_prazo_estimado || "",
      tp_status: projeto.tp_status,
    });
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      cd_empresa: formData.cd_empresa,
      cd_tipo_consultoria: formData.cd_tipo_consultoria,
      nr_horas_contratadas: parseInt(formData.nr_horas_contratadas),
      dt_prazo_estimado: formData.dt_prazo_estimado || null,
      tp_status: formData.tp_status,
    };

    try {
      if (editingId) {
        const { data, error } = await supabase
          .from("PROJETOS")
          .update(payload)
          .eq("cd_projeto", editingId)
          .select(`*, EMPRESAS(nm_fantasia), TIPOS_CONSULTORIA(nm_servico)`)
          .single();
        if (error) throw error;
        setProjetos(
          projetos.map((p) => (p.cd_projeto === editingId ? (data as any) : p)),
        );
      } else {
        const { data, error } = await supabase
          .from("PROJETOS")
          .insert([payload])
          .select(`*, EMPRESAS(nm_fantasia), TIPOS_CONSULTORIA(nm_servico)`)
          .single();
        if (error) throw error;
        setProjetos([data as any, ...projetos]);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Erro ao salvar projeto.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      const { error } = await supabase
        .from("PROJETOS")
        .delete()
        .eq("cd_projeto", projectToDelete.cd_projeto);
      if (error) throw error;
      setProjetos(
        projetos.filter((p) => p.cd_projeto !== projectToDelete.cd_projeto),
      );
      setIsDeleteModalOpen(false);
    } catch (error) {
      alert("Erro ao deletar projeto.");
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "ATIVO":
        return "bg-blue-50 text-primary border border-primary/20";
      case "CONCLUIDO":
        return "bg-green-50 text-green-700 border border-green-200";
      case "CANCELADO":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const projetosFiltrados = projetos.filter(
    (p) =>
      p.EMPRESAS?.nm_fantasia
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.TIPOS_CONSULTORIA?.nm_servico
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-primary font-bold">
        Carregando...
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-background-light font-display antialiased overflow-hidden">
      <Sidebar onLogout={() => router.push("/login")} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* HEADER RESPONSIVO */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white px-4 sm:px-8 py-4 sm:h-20 shadow-sm border-b border-slate-200 z-10 flex-shrink-0 gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-black text-primary pl-12 lg:pl-0">
              Projetos
            </h2>
            <div className="hidden sm:block h-6 w-[1px] bg-slate-200"></div>
            <div className="relative flex-1 sm:w-80 lg:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Buscar cliente ou serviço..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleOpenCreateModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-secondary hover:bg-orange-600 text-white font-black py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 text-sm uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden xs:inline">Novo Projeto</span>
              <span className="xs:hidden">Novo</span>
            </button>
          </div>
        </header>

        {/* LISTAGEM RESPONSIVA (Tabela vs Cards) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-[1400px] mx-auto">
            {/* VERSÃO DESKTOP (Tabela) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Cliente / Serviço</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5">Progresso de Horas</th>
                    <th className="px-6 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projetosFiltrados.map((p) => (
                    <tr
                      key={p.cd_projeto}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800">
                          {p.EMPRESAS?.nm_fantasia}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {p.TIPOS_CONSULTORIA?.nm_servico}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${getBadgeStyle(p.tp_status)}`}
                        >
                          {p.tp_status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5 max-w-[180px]">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                            <span>{p.nr_horas_consumidas}h</span>
                            <span>Total {p.nr_horas_contratadas}h</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.min((p.nr_horas_consumidas / p.nr_horas_contratadas) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() =>
                              router.push(`/projetos/${p.cd_projeto}`)
                            }
                            className="p-2 text-slate-400 hover:text-primary transition-all hover:bg-blue-50 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-[22px]">
                              visibility
                            </span>
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-2 text-slate-400 hover:text-secondary transition-all hover:bg-orange-50 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-[22px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setProjectToDelete(p);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-[22px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VERSÃO MOBILE (Cards) */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {projetosFiltrados.map((p) => (
                <div
                  key={p.cd_projeto}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">
                        {p.EMPRESAS?.nm_fantasia}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {p.TIPOS_CONSULTORIA?.nm_servico}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-[9px] font-black rounded-md uppercase ${getBadgeStyle(p.tp_status)}`}
                    >
                      {p.tp_status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>
                        Horas: {p.nr_horas_consumidas}h /{" "}
                        {p.nr_horas_contratadas}h
                      </span>
                      <span>
                        {Math.round(
                          (p.nr_horas_consumidas / p.nr_horas_contratadas) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min((p.nr_horas_consumidas / p.nr_horas_contratadas) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => router.push(`/projetos/${p.cd_projeto}`)}
                      className="flex-1 bg-blue-50 text-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        visibility
                      </span>{" "}
                      Detalhes
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-2 bg-slate-50 text-slate-400 rounded-xl"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setProjectToDelete(p);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-2 bg-red-50 text-red-400 rounded-xl"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {projetosFiltrados.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">
                  search_off
                </span>
                <p className="text-slate-400 font-medium">
                  Nenhum projeto encontrado.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-primary uppercase tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  {editingId ? "edit_square" : "add_box"}
                </span>
                {editingId ? "Editar Projeto" : "Novo Projeto"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="size-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Cliente *
                </label>
                <select
                  required
                  value={formData.cd_empresa}
                  onChange={(e) =>
                    setFormData({ ...formData, cd_empresa: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                >
                  <option value="">Selecione o cliente...</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Tipo de Consultoria *
                </label>
                <select
                  required
                  value={formData.cd_tipo_consultoria}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cd_tipo_consultoria: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                >
                  <option value="">Selecione o serviço...</option>
                  {servicos.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Horas Contratadas *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.nr_horas_contratadas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nr_horas_contratadas: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Status do Projeto
                  </label>
                  <select
                    value={formData.tp_status}
                    onChange={(e) =>
                      setFormData({ ...formData, tp_status: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="PAUSADO">Pausado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] py-3.5 bg-primary text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "Gravando..." : "Confirmar Projeto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DELEÇÃO RESPONSIVO */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">
                delete_forever
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">
              Excluir Projeto?
            </h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
              Esta ação removerá permanentemente o projeto de <br />
              <b className="text-slate-800">
                {projectToDelete?.EMPRESAS.nm_fantasia}
              </b>
              .
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmDelete}
                className="w-full py-4 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-600 shadow-xl shadow-red-200 active:scale-95 transition-all"
              >
                Sim, Excluir Registro
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
              >
                Manter Projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
