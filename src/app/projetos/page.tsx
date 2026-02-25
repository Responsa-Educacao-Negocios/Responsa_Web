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

  // --- FUNÇÕES DE AÇÃO ---

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
        // UPDATE
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
        // INSERT
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

  // --- HELPERS VISUAIS ---
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
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );

  return (
    <div className="flex h-screen w-full bg-background-light font-display antialiased relative">
      {/* 1. MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">
                  {editingId ? "edit_square" : "add_box"}
                </span>
                {editingId ? "Editar Projeto" : "Novo Projeto"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Cliente *
                </label>
                <select
                  required
                  value={formData.cd_empresa}
                  onChange={(e) =>
                    setFormData({ ...formData, cd_empresa: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Serviço *
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {servicos.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Horas *
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={formData.tp_status}
                    onChange={(e) =>
                      setFormData({ ...formData, tp_status: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="PAUSADO">Pausado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL DE CONFIRMAÇÃO DE DELEÇÃO */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">
                delete_forever
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Excluir Projeto?
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Esta ação não pode ser desfeita. O projeto de{" "}
              <b>{projectToDelete?.EMPRESAS.nm_fantasia}</b> será removido
              permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar onLogout={() => router.push("/login")} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex h-20 items-center justify-between bg-white px-8 shadow-sm border-b border-slate-200 z-10 flex-shrink-0">
          {" "}
          <div className="flex items-center gap-4">
            {" "}
            <h2 className="text-2xl font-bold text-primary">Projetos</h2>
            <div className="h-6 w-[1px] bg-slate-200"></div>{" "}
            <div className="relative w-96">
              {" "}
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search{" "}
              </span>{" "}
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Buscar por cliente ou projeto..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-4">
            {" "}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-md active:scale-95"
            >
              {" "}
              <span className="material-symbols-outlined">add</span>
              Novo Projeto{" "}
            </button>{" "}
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              {" "}
              <span className="material-symbols-outlined">
                notifications
              </span>{" "}
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white"></span>{" "}
            </button>{" "}
          </div>{" "}
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Horas</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projetosFiltrados.map((p) => (
                  <tr
                    key={p.cd_projeto}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {p.EMPRESAS?.nm_fantasia}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 text-[10px] font-bold rounded-full ${getBadgeStyle(p.tp_status)}`}
                      >
                        {p.tp_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {p.nr_horas_consumidas}h / {p.nr_horas_contratadas}h
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() =>
                            router.push(`/projetos/${p.cd_projeto}`)
                          }
                          className="p-2 text-slate-400 hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            visibility
                          </span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-2 text-slate-400 hover:text-accent transition-colors"
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
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">
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
        </div>
      </main>
    </div>
  );
}
