"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Consultor {
  cd_consultor: string;
  nm_completo: string;
  ds_email: string;
  nr_telefone: string;
  ds_especialidade: string;
  tp_senioridade: string;
  sn_ativo: boolean;
}

export default function ListaConsultoresPage() {
  const router = useRouter();
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const carregarConsultores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("CONSULTORES")
        .select("*")
        .order("nm_completo", { ascending: true });

      if (error) throw error;
      setConsultores(data || []);
    } catch (error) {
      console.error("Erro ao carregar consultores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarConsultores();
  }, []);

  const handleToggleAtivo = async (id: string, statusAtual: boolean) => {
    try {
      const { error } = await supabase
        .from("CONSULTORES")
        .update({ sn_ativo: !statusAtual })
        .eq("cd_consultor", id);

      if (error) throw error;

      // Atualiza o estado localmente sem precisar recarregar o banco
      setConsultores(
        consultores.map((c) =>
          c.cd_consultor === id ? { ...c, sn_ativo: !statusAtual } : c,
        ),
      );
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Não foi possível alterar o status do consultor.");
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o consultor ${nome}? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("CONSULTORES")
        .delete()
        .eq("cd_consultor", id);

      if (error) throw error;

      setConsultores(consultores.filter((c) => c.cd_consultor !== id));
      alert("Consultor excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir consultor:", error);
      alert(
        "Erro ao excluir. O consultor pode estar vinculado a projetos existentes.",
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Filtra os consultores pela barra de pesquisa
  const consultoresFiltrados = consultores.filter(
    (c) =>
      c.nm_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ds_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ds_especialidade?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getIniciais = (nome: string) => nome.substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden">
      {/* 1. SIDEBAR GLOBAL (Fica fixa na esquerda) */}
      <Sidebar onLogout={handleLogout} />

      {/* 2. COLUNA DA DIREITA (Ocupa o resto da tela) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* HEADER (Fixo no topo da coluna da direita) */}
        <header className="bg-white/95 backdrop-blur-sm px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 shadow-sm shrink-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#064384] tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF8323] text-3xl">
                  badge
                </span>
                Equipa de Consultores
              </h1>
              <span className="bg-blue-50 text-[#064384] px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                {consultores.length} Registados
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Gira os acessos, perfis e especialidades da sua equipa.
            </p>
          </div>

          <button
            onClick={() => router.push("/consultores/novo")}
            className="flex items-center gap-2 bg-[#064384] hover:bg-blue-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              person_add
            </span>
            Novo Consultor
          </button>
        </header>

        {/* CONTEÚDO PRINCIPAL (Área que rola para baixo) */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1400px] mx-auto w-full pb-20">
            {/* BARRA DE PESQUISA */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 pl-2">
                search
              </span>
              <input
                type="text"
                placeholder="Pesquisar por nome, e-mail ou especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400"
              />
            </div>

            {/* TABELA DE CONSULTORES */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-5 w-2/5">Consultor</th>
                      <th className="p-5">Especialidade</th>
                      <th className="p-5">Nível</th>
                      <th className="p-5 text-center">Status</th>
                      <th className="p-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-10 text-center text-slate-500 font-bold"
                        >
                          <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-[#064384]">
                            sync
                          </span>
                          <p>A carregar equipa...</p>
                        </td>
                      </tr>
                    ) : consultoresFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-10 text-center text-slate-500 font-bold"
                        >
                          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                            search_off
                          </span>
                          <p>Nenhum consultor encontrado.</p>
                        </td>
                      </tr>
                    ) : (
                      consultoresFiltrados.map((consultor) => (
                        <tr
                          key={consultor.cd_consultor}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          {/* NOME E EMAIL */}
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-blue-100 text-[#064384] flex items-center justify-center font-black text-sm uppercase shrink-0">
                                {getIniciais(consultor.nm_completo)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">
                                  {consultor.nm_completo}
                                </p>
                                <p className="text-xs font-medium text-slate-500">
                                  {consultor.ds_email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* ESPECIALIDADE */}
                          <td className="p-5">
                            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-bold border border-slate-200 inline-block">
                              {consultor.ds_especialidade || "Geral"}
                            </span>
                          </td>

                          {/* NÍVEL */}
                          <td className="p-5">
                            <span
                              className={`text-xs font-black uppercase tracking-widest ${consultor.tp_senioridade === "Sênior" || consultor.tp_senioridade === "Especialista" ? "text-[#FF8323]" : "text-[#064384]"}`}
                            >
                              {consultor.tp_senioridade || "Pleno"}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td className="p-5 text-center">
                            <button
                              onClick={() =>
                                handleToggleAtivo(
                                  consultor.cd_consultor,
                                  consultor.sn_ativo,
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${consultor.sn_ativo ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"}`}
                              title="Clique para ativar/desativar"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {consultor.sn_ativo ? "check_circle" : "cancel"}
                              </span>
                              {consultor.sn_ativo ? "Ativo" : "Inativo"}
                            </button>
                          </td>

                          {/* AÇÕES */}
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* <button
                                className="h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#064384] hover:border-[#064384] flex items-center justify-center transition-all shadow-sm"
                                title="Editar Consultor"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  edit
                                </span>
                              </button> */}

                              <button
                                onClick={() =>
                                  handleDelete(
                                    consultor.cd_consultor,
                                    consultor.nm_completo,
                                  )
                                }
                                className="h-8 w-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all shadow-sm"
                                title="Excluir Consultor"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
