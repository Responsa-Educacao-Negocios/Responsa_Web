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
  TIPOS_CONSULTORIA: {
    nm_servico: string;
  };
}

interface DadosPortal {
  empresaNome: string;
  consultorNome: string;
  projetos: ProjetoCliente[];
  progresso: {
    temDiagnostico: boolean;
    temClima: boolean;
    climaStatus: string;
    qtdDisc: number;
  };
}

export default function PortalClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dadosPortal, setDadosPortal] = useState<DadosPortal | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    const carregarDadosDoCliente = async () => {
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
          .select("cd_empresa, EMPRESAS ( nm_fantasia, nm_razao_social )")
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
        const nomeDaEmpresa = empresa?.nm_fantasia || empresa?.nm_razao_social;

        // 2. Busca os projetos ativos
        const { data: projetos } = await supabase
          .from("PROJETOS")
          .select(
            `cd_projeto, dt_prazo_estimado, nr_horas_consumidas, nr_horas_contratadas, tp_status, TIPOS_CONSULTORIA ( nm_servico )`,
          )
          .eq("cd_empresa", cdEmpresa)
          .order("ts_atualizacao", { ascending: false });

        // 3. Busca o progresso real nas tabelas satélites do projeto principal
        const progresso = {
          temDiagnostico: false,
          temClima: false,
          climaStatus: "",
          qtdDisc: 0,
        };

        if (projetos && projetos.length > 0) {
          const pId = projetos[0].cd_projeto;

          // Usamos 'cd_projeto' (que sabemos que existe) ou '*' com 'head: true' para evitar erros de colunas inexistentes
          const [resInd, resClima, resDisc] = await Promise.all([
            supabase
              .from("INDICADORES_RH")
              .select("cd_projeto")
              .eq("cd_projeto", pId)
              .limit(1),
            supabase
              .from("AVALIACOES_CLIMA")
              .select("tp_status")
              .eq("cd_projeto", pId)
              .limit(1)
              .maybeSingle(),
            supabase
              .from("AVALIACOES_DISC")
              .select("*", { count: "exact", head: true })
              .eq("cd_projeto", pId),
          ]);

          progresso.temDiagnostico = (resInd.data &&
            resInd.data.length > 0) as boolean;
          progresso.temClima = !!resClima.data;
          progresso.climaStatus = resClima.data?.tp_status || "";
          progresso.qtdDisc = resDisc.count || 0;
        }

        setDadosPortal({
          empresaNome: nomeDaEmpresa,
          consultorNome: "Equipe Responsa", // Pode ser ajustado futuramente com tabela de relacionamento
          projetos: (projetos as any) || [],
          progresso,
        });
      } catch (error) {
        console.error("Erro ao carregar portal:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosDoCliente();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const copiarLinkClima = (projetoId: string) => {
    const link = `${window.location.origin}/pesquisa/clima/${projetoId}`;
    navigator.clipboard.writeText(link);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 3000);
  };

  if (loading || !dadosPortal) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center flex-col gap-4 text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando seu portal...</span>
      </div>
    );
  }

  const projetoAtual =
    dadosPortal.projetos.length > 0 ? dadosPortal.projetos[0] : null;
  const progresso = dadosPortal.progresso;

  // Lógica da Timeline baseada em dados reais
  const fase1Concluida = progresso.temDiagnostico;
  const fase2Concluida =
    progresso.climaStatus === "CONCLUIDO" || progresso.qtdDisc > 0;
  const fase3Concluida = projetoAtual?.tp_status === "CONCLUIDO";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F1F5F9] font-sans text-slate-800">
      {/* SIDEBAR EXCLUSIVA DO CLIENTE */}
      <aside className="hidden w-72 flex-col bg-[#064384] lg:flex z-20 shadow-xl text-white flex-shrink-0">
        <div className="flex h-20 items-center gap-3 px-8 border-b border-white/10">
          <div className="flex items-center justify-center rounded-lg bg-white/10 p-2 text-[#FF8323]">
            <span className="material-symbols-outlined font-black">
              dashboard_customize
            </span>
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight tracking-tighter uppercase">
              Responsa
            </h1>
            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-0.5">
              Portal do Cliente
            </p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto">
          <Link
            href="/portal"
            className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-white border-l-4 border-[#FF8323] transition-all font-bold text-sm shadow-md"
          >
            <span className="material-symbols-outlined">grid_view</span> Visão
            Geral
          </Link>
          <Link
            href="/portal/contratos"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-blue-200 hover:bg-white/5 hover:text-white transition-colors font-bold text-sm"
          >
            <span className="material-symbols-outlined">description</span> Meus
            Contratos
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
                {dadosPortal.empresaNome}
              </h2>
              {projetoAtual && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Projeto:{" "}
                    {projetoAtual.TIPOS_CONSULTORIA?.nm_servico || "Ativo"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                Consultor Responsável
              </span>
              <span className="text-sm font-bold text-[#064384]">
                {dadosPortal.consultorNome}
              </span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-[#064384]">
                CC
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8 lg:p-10">
          <div className="mx-auto max-w-[1200px] flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                Andamento da Consultoria
              </h1>
              <p className="text-slate-500 font-medium">
                Acompanhe a evolução do seu projeto e conclua as ações pendentes
                sob sua responsabilidade.
              </p>
            </div>

            {/* TIMELINE DO PROJETO (Totalmente Dinâmica) */}
            <section className="rounded-3xl bg-white p-8 lg:p-10 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-lg font-black text-[#064384] flex items-center gap-2 uppercase tracking-widest text-sm">
                  <span className="material-symbols-outlined text-[#FF8323]">
                    timeline
                  </span>{" "}
                  Mapa do Projeto
                </h3>
              </div>

              <div className="relative px-4">
                {/* Linha de fundo cinza */}
                <div className="absolute left-0 top-[24px] h-1.5 w-full bg-slate-100 rounded-full"></div>

                {/* Linha de progresso colorida baseada no status */}
                <div
                  className="absolute left-0 top-[24px] h-1.5 rounded-full transition-all duration-1000 bg-gradient-to-r from-green-400 to-green-500"
                  style={{
                    width: fase3Concluida
                      ? "100%"
                      : fase2Concluida
                        ? "50%"
                        : fase1Concluida
                          ? "25%"
                          : "0%",
                  }}
                ></div>

                <div className="relative z-10 flex w-full justify-between">
                  {/* Step 1: Diagnóstico */}
                  <div className="flex flex-col items-center gap-4 w-1/3">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md ring-8 ring-white transition-all
                      ${fase1Concluida ? "bg-green-500 text-white" : "bg-orange-50 text-[#FF8323] border border-orange-200"}`}
                    >
                      <span className="material-symbols-outlined font-bold">
                        {fase1Concluida ? "check" : "analytics"}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-slate-800 block">
                        Diagnóstico RH
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mt-1 inline-block
                        ${fase1Concluida ? "text-green-600 bg-green-50" : "text-[#FF8323] bg-orange-50"}`}
                      >
                        {fase1Concluida ? "Concluído" : "Em Andamento"}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Mapeamento & Coleta */}
                  <div
                    className={`flex flex-col items-center gap-4 w-1/3 transition-all ${!fase1Concluida ? "opacity-40 grayscale" : ""}`}
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md ring-8 ring-white transition-all
                      ${fase2Concluida ? "bg-green-500 text-white" : fase1Concluida ? "bg-[#064384] text-white shadow-blue-900/20" : "bg-slate-100 text-slate-400"}`}
                    >
                      <span
                        className={`material-symbols-outlined font-bold ${!fase2Concluida && fase1Concluida ? "animate-spin-slow" : ""}`}
                      >
                        {fase2Concluida ? "check" : "sync"}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-slate-800 block">
                        Coleta de Dados
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mt-1 inline-block
                        ${fase2Concluida ? "text-green-600 bg-green-50" : fase1Concluida ? "text-[#064384] bg-blue-50" : "text-slate-500 bg-slate-100"}`}
                      >
                        {fase2Concluida
                          ? "Concluído"
                          : fase1Concluida
                            ? "Ação Necessária"
                            : "Aguardando"}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Relatório e Fechamento */}
                  <div
                    className={`flex flex-col items-center gap-4 w-1/3 transition-all ${!fase2Concluida ? "opacity-40 grayscale" : ""}`}
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md ring-8 ring-white transition-all
                      ${fase3Concluida ? "bg-green-500 text-white" : fase2Concluida ? "bg-[#FF8323] text-white" : "bg-slate-100 text-slate-400"}`}
                    >
                      <span className="material-symbols-outlined font-bold">
                        {fase3Concluida ? "verified" : "description"}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-slate-800 block">
                        Entrega Final
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mt-1 inline-block
                        ${fase3Concluida ? "text-green-600 bg-green-50" : fase2Concluida ? "text-[#FF8323] bg-orange-50" : "text-slate-500 bg-slate-100"}`}
                      >
                        {fase3Concluida
                          ? "Projeto Finalizado"
                          : fase2Concluida
                            ? "Análise Final"
                            : "Aguardando"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* GRIDS INFERIORES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ações da Empresa (Dinâmico) */}
              <div className="flex flex-col gap-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#064384] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8323]">
                    fact_check
                  </span>{" "}
                  Tarefas da Empresa
                </h3>

                {progresso.climaStatus === "ATIVO" && projetoAtual ? (
                  <div className="rounded-2xl bg-white shadow-sm border border-orange-200 p-6 flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF8323]"></div>
                    <div>
                      <span className="bg-orange-50 text-[#FF8323] text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                        Urgente
                      </span>
                      <h4 className="text-lg font-black text-slate-800 mt-3">
                        Aplicação da Pesquisa de Clima
                      </h4>
                      <p className="text-slate-500 text-sm font-medium mt-1">
                        A pesquisa está liberada. Copie o link abaixo e envie
                        para todos os colaboradores responderem de forma
                        anônima.
                      </p>
                    </div>
                    <button
                      onClick={() => copiarLinkClima(projetoAtual.cd_projeto)}
                      className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2
                        ${linkCopiado ? "bg-green-500 text-white" : "bg-[#FF8323] hover:bg-orange-600 text-white"}`}
                    >
                      <span className="material-symbols-outlined">
                        {linkCopiado ? "check_circle" : "content_copy"}
                      </span>
                      {linkCopiado
                        ? "Link Copiado para Envio!"
                        : "Copiar Link da Pesquisa"}
                    </button>
                  </div>
                ) : progresso.qtdDisc === 0 && fase1Concluida ? (
                  <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                    <h4 className="text-lg font-black text-slate-800">
                      Mapeamento DISC
                    </h4>
                    <p className="text-slate-500 text-sm font-medium">
                      Sua equipe precisa realizar os testes comportamentais.
                      Aguarde as instruções do consultor.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 border-dashed p-8 text-center flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
                      task_alt
                    </span>
                    <h4 className="text-sm font-bold text-slate-500">
                      Nenhuma ação pendente
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      O projeto está rodando conforme o cronograma.
                    </p>
                  </div>
                )}
              </div>

              {/* Entregáveis e Documentos (Dinâmico) */}
              <div className="flex flex-col gap-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#064384] flex items-center gap-2">
                  <span className="material-symbols-outlined">
                    folder_shared
                  </span>{" "}
                  Entregáveis Disponíveis
                </h3>

                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {fase1Concluida ? (
                      <div className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#064384]">
                            <span className="material-symbols-outlined">
                              analytics
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800 block">
                              Diagnóstico de Maturidade RH
                            </span>
                            <span className="text-xs text-green-600 font-bold mt-0.5">
                              Disponível no sistema
                            </span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-300">
                          chevron_right
                        </span>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm font-medium text-slate-400 italic">
                        Diagnóstico em elaboração pelo consultor.
                      </div>
                    )}

                    {progresso.temClima &&
                      progresso.climaStatus === "CONCLUIDO" && (
                        <div className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF8323]">
                              <span className="material-symbols-outlined">
                                thermostat
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-bold text-slate-800 block">
                                Relatório de Clima
                              </span>
                              <span className="text-xs text-slate-400 font-medium mt-0.5">
                                Análise Estatística Concluída
                              </span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-300">
                            chevron_right
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
