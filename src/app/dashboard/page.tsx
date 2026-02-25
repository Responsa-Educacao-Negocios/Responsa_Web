"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProjetoDashboard {
  cd_projeto: string;
  nr_horas_contratadas: number;
  nr_horas_consumidas: number;
  tp_status: string;
  EMPRESAS: {
    nm_fantasia: string;
  };
  TIPOS_CONSULTORIA: {
    nm_servico: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [projetos, setProjetos] = useState<ProjetoDashboard[]>([]);
  const [metricas, setMetricas] = useState({
    horasMes: 0,
    faturasPendentes: 0,
    totalFaturado: 0,
  });

  useEffect(() => {
    const carregarDashboard = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const { data: projetosData } = await supabase
          .from("PROJETOS")
          .select(
            `
            cd_projeto, nr_horas_contratadas, nr_horas_consumidas, tp_status,
            EMPRESAS ( nm_fantasia ),
            TIPOS_CONSULTORIA ( nm_servico )
          `,
          )
          .eq("tp_status", "ATIVO")
          .order("ts_atualizacao", { ascending: false })
          .limit(5);

        const { count: faturasPendentesCount } = await supabase
          .from("FATURAS")
          .select("*", { count: "exact", head: true })
          .eq("tp_status", "PENDENTE");

        const { data: faturasPagas } = await supabase
          .from("FATURAS")
          .select("vl_fatura")
          .eq("tp_status", "PAGA");

        const totalFaturado =
          faturasPagas?.reduce(
            (acc, fatura) => acc + Number(fatura.vl_fatura),
            0,
          ) || 0;

        if (projetosData) setProjetos(projetosData as any);
        setMetricas({
          horasMes: 124,
          faturasPendentes: faturasPendentesCount || 0,
          totalFaturado: totalFaturado,
        });
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDashboard();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const getProgressColor = (consumido: number, total: number) => {
    if (!total) return "bg-primary";
    const percentual = (consumido / total) * 100;
    if (percentual >= 90) return "bg-red-500";
    if (percentual >= 75) return "bg-accent";
    return "bg-primary";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center flex-col gap-4 text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando Painel...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light font-display text-text-main antialiased">
      {/* COMPONENTE SIDEBAR INJETADO AQUI */}
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* COMPONENTE TOPBAR INJETADO AQUI */}
        <TopBar />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* CARDS DINÂMICOS */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 group hover:border-primary/30 transition-all">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/5 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-blue-50 p-2 text-primary">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Horas Faturáveis (Mês)
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-main">
                    {metricas.horasMes}h
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 group hover:border-accent/30 transition-all">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-orange-50 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-orange-50 p-2 text-accent">
                    <span className="material-symbols-outlined">
                      receipt_long
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Faturas Pendentes
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-main">
                    {metricas.faturasPendentes}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">
                    Aguardando
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 group hover:border-primary/30 transition-all">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-green-50 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-lg bg-green-50 p-2 text-green-600">
                    <span className="material-symbols-outlined">
                      attach_money
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Total Faturado
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-main">
                    {formatarMoeda(metricas.totalFaturado)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* LISTA DE PROJETOS DINÂMICA */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">
                Projetos Ativos
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {projetos.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                  Nenhum projeto ativo encontrado. Comece prospectando um novo
                  cliente!
                </div>
              ) : (
                projetos.map((projeto) => {
                  const IniciaisEmpresa =
                    projeto.EMPRESAS?.nm_fantasia
                      ?.substring(0, 2)
                      .toUpperCase() || "PR";
                  const consumido = Number(projeto.nr_horas_consumidas || 0);
                  const total = Number(projeto.nr_horas_contratadas || 1);
                  const percentualProgresso = Math.min(
                    (consumido / total) * 100,
                    100,
                  );
                  const corBarra = getProgressColor(consumido, total);

                  return (
                    <div
                      key={projeto.cd_projeto}
                      className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4 w-full md:w-1/3">
                        <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl">
                          {IniciaisEmpresa}
                        </div>
                        <div>
                          <h4 className="font-bold text-text-main truncate max-w-[200px]">
                            {projeto.EMPRESAS?.nm_fantasia || "Empresa"}
                          </h4>
                          <p className="text-sm text-slate-500 truncate max-w-[200px]">
                            {projeto.TIPOS_CONSULTORIA?.nm_servico ||
                              "Consultoria Padrão"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col w-full md:w-1/3 gap-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-slate-600">
                            Progresso de Horas
                          </span>
                          <span className="text-text-main">
                            {consumido}h{" "}
                            <span className="text-slate-400 font-normal">
                              de {projeto.nr_horas_contratadas}h
                            </span>
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${corBarra} transition-all duration-500`}
                            style={{ width: `${percentualProgresso}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex w-full md:w-auto items-center justify-end gap-3">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                          {projeto.tp_status}
                        </span>
                        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors focus:outline-none">
                          <span className="material-symbols-outlined">
                            more_vert
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* FERRAMENTAS DE CONSULTORIA */}
          <section className="space-y-4 pb-8">
            <h3 className="text-lg font-bold text-text-main">
              Ferramentas de Consultoria
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex flex-col items-start gap-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-accent hover:shadow-md transition-all group text-left focus:outline-none">
                <div className="rounded-lg bg-blue-50 p-3 text-primary group-hover:bg-accent group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">
                    description
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-main text-sm">
                    Nova Descrição de Cargo
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Criar a partir de template
                  </p>
                </div>
              </button>

              <button className="flex flex-col items-start gap-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-accent hover:shadow-md transition-all group text-left focus:outline-none">
                <div className="rounded-lg bg-purple-50 p-3 text-purple-600 group-hover:bg-accent group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">
                    link
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-main text-sm">
                    Gerar Link de Pesquisa
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Clima ou satisfação
                  </p>
                </div>
              </button>

              <button className="flex flex-col items-start gap-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-accent hover:shadow-md transition-all group text-left focus:outline-none">
                <div className="rounded-lg bg-rose-50 p-3 text-rose-600 group-hover:bg-accent group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">
                    psychology
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-main text-sm">
                    Novo Diagnóstico DISC
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Avaliação comportamental
                  </p>
                </div>
              </button>

              <button className="flex flex-col items-start gap-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-accent hover:shadow-md transition-all group text-left focus:outline-none">
                <div className="rounded-lg bg-teal-50 p-3 text-teal-600 group-hover:bg-accent group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">
                    download
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-main text-sm">
                    Relatório Consolidado
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Exportar PDF/Excel
                  </p>
                </div>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
