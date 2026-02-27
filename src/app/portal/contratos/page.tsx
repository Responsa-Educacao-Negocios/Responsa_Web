"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Tipagens
interface ProjetoCliente {
  cd_projeto: string;
  dt_prazo_estimado: string;
  nr_horas_consumidas: number;
  nr_horas_contratadas: number;
  tp_status: string;
  ts_criacao: string;
  TIPOS_CONSULTORIA: {
    nm_servico: string;
  };
}

export default function MeusContratosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projetos, setProjetos] = useState<ProjetoCliente[]>([]);
  const [empresaNome, setEmpresaNome] = useState("");

  useEffect(() => {
    const carregarContratos = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const userId = session.user.id;

        // 1. Busca o vínculo do usuário com a empresa
        const { data: usuarioCliente, error: userError } = await supabase
          .from("USUARIOS_CLIENTE")
          .select("cd_empresa, EMPRESAS ( nm_fantasia )")
          .eq("cd_auth_supabase", userId)
          .single();

        if (userError || !usuarioCliente) {
          router.push("/login");
          return;
        }

        const cdEmpresa = usuarioCliente.cd_empresa;
        const empresa = Array.isArray(usuarioCliente.EMPRESAS)
          ? usuarioCliente.EMPRESAS[0]
          : usuarioCliente.EMPRESAS;
        setEmpresaNome(empresa?.nm_fantasia || "Empresa");

        // 2. Busca TODOS os projetos (contratos) dessa empresa
        const { data: projetosData } = await supabase
          .from("PROJETOS")
          .select(
            `cd_projeto, dt_prazo_estimado, nr_horas_consumidas, nr_horas_contratadas, tp_status, ts_criacao, TIPOS_CONSULTORIA ( nm_servico )`,
          )
          .eq("cd_empresa", cdEmpresa)
          .order("ts_criacao", { ascending: false });

        setProjetos((projetosData as any) || []);
      } catch (error) {
        console.error("Erro ao carregar contratos:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarContratos();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Helpers de UI
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "ATIVO":
        return {
          text: "Em Andamento",
          color: "bg-green-50 text-green-600 border-green-200",
          dot: "bg-green-500",
        };
      case "CONCLUIDO":
        return {
          text: "Finalizado",
          color: "bg-blue-50 text-blue-600 border-blue-200",
          dot: "bg-blue-500",
        };
      case "PAUSADO":
        return {
          text: "Pausado",
          color: "bg-orange-50 text-orange-600 border-orange-200",
          dot: "bg-orange-500",
        };
      case "CANCELADO":
        return {
          text: "Cancelado",
          color: "bg-red-50 text-red-600 border-red-200",
          dot: "bg-red-500",
        };
      default:
        return {
          text: "Em Análise",
          color: "bg-slate-50 text-slate-600 border-slate-200",
          dot: "bg-slate-500",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center flex-col gap-4 text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Buscando contratos...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F1F5F9] font-sans text-slate-800">
      {/* SIDEBAR EXCLUSIVA DO CLIENTE (Com "Meus Contratos" Ativo) */}
      <aside className="hidden w-72 flex-col bg-[#064384] lg:flex z-20 shadow-xl text-white flex-shrink-0">
        <div className="flex h-20 items-center gap-3 px-8 border-b border-white/10">
          <div className="flex items-center justify-center rounded-lg bg-white/10 p-2 text-[#FF8323]">
            <span className="material-symbols-outlined font-black">
              dashboard_customize
            </span>
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight tracking-tighter uppercase">
              CoreConsulta
            </h1>
            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-0.5">
              Portal do Cliente
            </p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto">
          <Link
            href="/portal"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-blue-200 hover:bg-white/5 hover:text-white transition-colors font-bold text-sm"
          >
            <span className="material-symbols-outlined">grid_view</span> Visão
            Geral
          </Link>
          <Link
            href="/portal/contratos"
            className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-white border-l-4 border-[#FF8323] transition-all font-bold text-sm shadow-md"
          >
            <span className="material-symbols-outlined">description</span> Meus
            Contratos
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-blue-200 hover:bg-white/5 hover:text-white transition-colors font-bold text-sm"
          >
            <span className="material-symbols-outlined">support_agent</span>{" "}
            Solicitar Suporte
          </Link>
        </nav>

        <div className="p-6 border-t border-white/10 flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-blue-200 hover:bg-red-500/20 hover:text-red-400 transition-colors text-left font-bold text-sm w-full"
          >
            <span className="material-symbols-outlined">logout</span> Sair do
            Sistema
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col h-full overflow-hidden relative">
        {/* HEADER DO CLIENTE */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 lg:px-10 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500 hover:text-[#064384]">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {empresaNome}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-[#064384]">
              {empresaNome.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8 lg:p-10">
          <div className="mx-auto max-w-[1200px] flex flex-col gap-8">
            <div className="flex flex-col gap-2 mb-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Meus Contratos
              </h1>
              <p className="text-slate-500 font-medium">
                Histórico completo de serviços e consultorias contratadas.
              </p>
            </div>

            {/* LISTA DE CONTRATOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projetos.length === 0 ? (
                <div className="col-span-full rounded-2xl bg-white border border-slate-200 border-dashed p-12 text-center flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">
                    folder_off
                  </span>
                  <h4 className="text-lg font-bold text-slate-600">
                    Nenhum contrato encontrado
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Você ainda não possui projetos cadastrados em seu portal.
                  </p>
                </div>
              ) : (
                projetos.map((projeto) => {
                  const status = getStatusInfo(projeto.tp_status);
                  const progresso = Math.min(
                    Math.round(
                      ((projeto.nr_horas_consumidas || 0) /
                        (projeto.nr_horas_contratadas || 1)) *
                        100,
                    ),
                    100,
                  );

                  return (
                    <div
                      key={projeto.cd_projeto}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group relative overflow-hidden"
                    >
                      {/* Borda de destaque dependendo do status */}
                      <div
                        className={`absolute top-0 left-0 w-full h-1 ${projeto.tp_status === "ATIVO" ? "bg-[#FF8323]" : "bg-slate-200"}`}
                      ></div>

                      <div className="flex justify-between items-start mb-6 mt-2">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${status.color}`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${status.dot} ${projeto.tp_status === "ATIVO" ? "animate-pulse" : ""}`}
                          ></span>
                          {status.text}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-800 leading-tight mb-2">
                        {projeto.TIPOS_CONSULTORIA?.nm_servico ||
                          "Consultoria Personalizada"}
                      </h3>

                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                        Início:{" "}
                        {new Date(projeto.ts_criacao).toLocaleDateString(
                          "pt-BR",
                        )}
                      </div>

                      {/* Progresso de Horas */}
                      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                          <span>Consumo de Horas</span>
                          <span>
                            {projeto.nr_horas_consumidas || 0}h /{" "}
                            {projeto.nr_horas_contratadas || 0}h
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${projeto.tp_status === "CONCLUIDO" ? "bg-green-500" : "bg-[#064384]"}`}
                            style={{ width: `${progresso}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Prazo */}
                      <div className="mt-6 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined text-[16px]">
                            calendar_month
                          </span>
                          <span className="text-xs font-bold uppercase">
                            Previsão
                          </span>
                        </div>
                        <span className="text-sm font-black text-[#064384]">
                          {projeto.dt_prazo_estimado
                            ? new Date(
                                projeto.dt_prazo_estimado,
                              ).toLocaleDateString("pt-BR")
                            : "A definir"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
