"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Tipagens para o Portal do Cliente
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
}

export default function PortalClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dadosPortal, setDadosPortal] = useState<DadosPortal | null>(null);

  useEffect(() => {
    const carregarDadosDoCliente = async () => {
      try {
        // 1. Pega a sessão atual
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const userId = session.user.id;

        // 2. Busca o vínculo do usuário com a empresa
        const { data: usuarioCliente, error: userError } = await supabase
          .from("USUARIOS_CLIENTE")
          .select("cd_empresa, EMPRESAS ( nm_fantasia, nm_razao_social )")
          .eq("cd_auth_supabase", userId)
          .single();

        // Se não achar, não é cliente (talvez um consultor perdido aqui), manda pro login
        if (userError || !usuarioCliente) {
          router.push("/login");
          return;
        }

        const cdEmpresa = usuarioCliente.cd_empresa;
        const empresa = Array.isArray(usuarioCliente.EMPRESAS)
          ? usuarioCliente.EMPRESAS[0]
          : usuarioCliente.EMPRESAS;
        const nomeDaEmpresa =
          empresa?.nm_fantasia || empresa?.nm_razao_social;

        // 3. Busca os projetos ativos dessa empresa e quem é o consultor responsável
        // Como a modelagem não tem um "consultor_responsavel" direto na empresa ainda,
        // vamos buscar os projetos e assumir que a empresa tem projetos rodando.
        const { data: projetos } = await supabase
          .from("PROJETOS")
          .select(
            `
            cd_projeto, dt_prazo_estimado, nr_horas_consumidas, nr_horas_contratadas, tp_status,
            TIPOS_CONSULTORIA ( nm_servico )
          `,
          )
          .eq("cd_empresa", cdEmpresa)
          .order("ts_atualizacao", { ascending: false });

        setDadosPortal({
          empresaNome: nomeDaEmpresa,
          consultorNome: "Equipe RESPONSA", // Hardcoded temporariamente até termos o vínculo de consultor-empresa
          projetos: (projetos as any) || [],
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

  if (loading || !dadosPortal) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center flex-col gap-4 text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando seu portal...</span>
      </div>
    );
  }

  // Pega o projeto mais recente/ativo para exibir na timeline
  const projetoAtual =
    dadosPortal.projetos.length > 0 ? dadosPortal.projetos[0] : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light font-display text-text-main">
      {/* SIDEBAR EXCLUSIVA DO CLIENTE */}
      <aside className="hidden w-72 flex-col bg-primary lg:flex z-20 shadow-lg text-white flex-shrink-0">
        <div className="flex h-20 items-center gap-3 px-6 border-b border-white/10">
          <div className="flex items-center justify-center rounded-lg bg-white/10 p-2 text-white">
            <span className="material-symbols-outlined filled">
              verified_user
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight tracking-wide">
              RESPONSA
            </h1>
            <p className="text-xs text-white/60 font-medium uppercase tracking-wider">
              Portal do Cliente
            </p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
          <Link
            href="/portal"
            className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-white border-l-4 border-accent transition-all"
          >
            <span className="material-symbols-outlined filled">dashboard</span>
            <span className="text-sm font-semibold">
              Visão Geral do Projeto
            </span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-colors group"
          >
            <div className="relative">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm">
                2
              </span>
            </div>
            <span className="text-sm font-medium">Aprovações</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-colors group"
          >
            <span className="material-symbols-outlined">folder_open</span>
            <span className="text-sm font-medium">Documentos</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <Link
            href="#"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="text-sm font-medium">Ajuda & Suporte</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors text-left focus:outline-none"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col h-full overflow-hidden relative">
        {/* HEADER DO CLIENTE */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-10 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500 hover:text-primary focus:outline-none">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h2 className="text-xl font-bold text-primary tracking-tight">
                Painel da Empresa {dadosPortal.empresaNome}
              </h2>
              {projetoAtual && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span className="text-xs text-slate-500">
                    Projeto Ativo:{" "}
                    {projetoAtual.TIPOS_CONSULTORIA?.nm_servico ||
                      "Consultoria"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Consultor Responsável
              </span>
              <span className="text-sm font-bold text-text-main">
                {dadosPortal.consultorNome}
              </span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <button className="relative flex items-center justify-center rounded-full bg-slate-50 p-2 text-slate-600 hover:text-primary hover:bg-blue-50 transition-colors focus:outline-none">
                <span className="material-symbols-outlined">mail</span>
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-accent border-2 border-white"></span>
              </button>
              <div className="h-10 w-10 rounded-full bg-cover bg-center ring-2 ring-slate-100 bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                EQ
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto bg-background-light p-6 lg:p-10">
          <div className="mx-auto max-w-6xl flex flex-col gap-10">
            {/* Título da Página */}
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold text-primary tracking-tight">
                Visão Geral do Projeto
              </h1>
              <p className="text-text-main/70 max-w-2xl font-medium">
                Acompanhe o progresso da consultoria de RH em tempo real. Valide
                as etapas pendentes para avançarmos para a próxima fase.
              </p>
            </div>

            {/* TIMELINE DO PROJETO (Dinâmica) */}
            <section className="rounded-xl bg-white p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent">
                    timeline
                  </span>
                  Timeline do Projeto
                </h3>
                <span className="text-sm font-bold text-accent bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  {projetoAtual ? "Em Execução" : "Aguardando Início"}
                </span>
              </div>

              <div className="relative px-4">
                {/* Linha de fundo */}
                <div className="absolute left-0 top-[22px] h-1.5 w-full bg-slate-100 rounded-full -z-0"></div>
                {/* Linha de progresso */}
                <div className="absolute left-0 top-[22px] h-1.5 w-1/2 bg-gradient-to-r from-success via-accent to-slate-200 rounded-full -z-0"></div>

                <div className="relative z-10 flex w-full justify-between">
                  {/* Step 1: Concluído */}
                  <div className="flex flex-col items-center gap-4 group">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-white shadow-md ring-4 ring-white">
                      <span className="material-symbols-outlined">check</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-sm font-bold text-text-main">
                        Diagnóstico Inicial
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-success mt-1 bg-green-50 px-2 py-0.5 rounded">
                        Concluído
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Em Andamento */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-orange-200 ring-4 ring-white">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40"></span>
                      <span
                        className="material-symbols-outlined relative z-10 animate-spin-slow"
                        style={{ animationDuration: "3s" }}
                      >
                        sync
                      </span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-sm font-bold text-accent">
                        {projetoAtual
                          ? projetoAtual.TIPOS_CONSULTORIA?.nm_servico
                          : "Definição de Escopo"}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent mt-1 bg-orange-50 px-2 py-0.5 rounded">
                        Em Andamento
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        Prazo:{" "}
                        {projetoAtual?.dt_prazo_estimado
                          ? new Date(
                              projetoAtual.dt_prazo_estimado,
                            ).toLocaleDateString("pt-BR")
                          : "Não definido"}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Aguardando */}
                  <div className="flex flex-col items-center gap-4 opacity-50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 border-2 border-slate-200 ring-4 ring-white">
                      <span className="material-symbols-outlined">
                        rocket_launch
                      </span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-sm font-semibold text-slate-500">
                        Implementação
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1 bg-slate-100 px-2 py-0.5 rounded">
                        Aguardando
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* GRIDS INFERIORES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Central de Aprovações */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined filled text-accent">
                    fact_check
                  </span>
                  Central de Aprovações
                </h3>

                <div className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200 group hover:border-accent/30 transition-colors">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-50 text-accent text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                          Ação Necessária
                        </span>
                        <span className="text-slate-400 text-xs">
                          Atualizado hoje
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-text-main">
                        Aprovação de Mapeamento
                      </h4>
                      <p className="text-text-main/70 text-sm leading-relaxed font-medium">
                        A equipe de consultoria enviou os documentos referentes
                        à fase inicial do projeto. Precisamos da sua validação
                        para prosseguir com a próxima etapa.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3 min-w-[160px]">
                      <button className="w-full rounded-lg bg-accent hover:bg-accent-dark text-white font-bold py-3 px-6 shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none">
                        <span>Revisar Agora</span>
                        <span className="material-symbols-outlined text-[18px]">
                          arrow_forward
                        </span>
                      </button>
                      <span className="text-xs text-primary font-bold">
                        2 itens pendentes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entregáveis e Documentos */}
              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined filled text-primary">
                    folder_shared
                  </span>
                  Entregáveis
                </h3>

                <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    <div className="p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                            <span className="material-symbols-outlined">
                              picture_as_pdf
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                              Cronograma Inicial
                            </span>
                            <span className="text-xs text-slate-400">
                              Documento • 2.4 MB
                            </span>
                          </div>
                        </div>
                        <button className="p-2 rounded-full hover:bg-blue-50 text-slate-400 hover:text-primary transition-colors focus:outline-none">
                          <span className="material-symbols-outlined">
                            download
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary border border-blue-100">
                            <span className="material-symbols-outlined">
                              description
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                              Apresentação de Kickoff
                            </span>
                            <span className="text-xs text-slate-400">
                              Slide • 1.1 MB
                            </span>
                          </div>
                        </div>
                        <button className="p-2 rounded-full hover:bg-blue-50 text-slate-400 hover:text-primary transition-colors focus:outline-none">
                          <span className="material-symbols-outlined">
                            download
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                    <button className="text-xs font-bold text-primary hover:text-accent hover:underline uppercase tracking-wide focus:outline-none">
                      Ver todos os arquivos
                    </button>
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
