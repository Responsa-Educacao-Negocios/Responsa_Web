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
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-background-light font-display text-text-main antialiased">
      {/* SIDEBAR - A responsividade agora é tratada internamente no componente */}
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <TopBar />

        {/* ÁREA DE CONTEÚDO COM SCROLL OTIMIZADO */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 scrollbar-hide">
          {/* CARDS DE MÉTRICAS - 1 col mobile, 2 col tablet, 3 col desktop */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Horas */}
              <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 group transition-all hover:shadow-md">
                <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/5 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-primary">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Horas (Mês)
                  </h3>
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl font-black text-slate-800">
                    {metricas.horasMes}h
                  </span>
                </div>
              </div>

              {/* Faturas */}
              <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 group transition-all hover:shadow-md">
                <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-orange-50 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="rounded-xl bg-orange-50 p-2.5 text-accent">
                    <span className="material-symbols-outlined">
                      receipt_long
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Pendentes
                  </h3>
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl font-black text-slate-800">
                    {metricas.faturasPendentes}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    faturas
                  </span>
                </div>
              </div>

              {/* Total - Ocupa 2 colunas no tablet para equilíbrio visual */}
              <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 group transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
                <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-green-50 transition-transform group-hover:scale-110"></div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="rounded-xl bg-green-50 p-2.5 text-green-600">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Faturado
                  </h3>
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                  <span className="text-2xl sm:text-3xl font-black text-green-700 truncate">
                    {formatarMoeda(metricas.totalFaturado)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* LISTA DE PROJETOS ATIVOS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                Projetos Ativos
              </h3>
              <button className="text-xs font-bold text-primary hover:underline">
                Ver todos
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {projetos.length === 0 ? (
                <div className="text-center py-12 px-6 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100 font-medium">
                  Nenhum projeto ativo no momento.
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
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 rounded-2xl bg-white p-5 shadow-sm border border-slate-50 hover:border-primary/20 hover:shadow-md transition-all"
                    >
                      {/* Logo e Nome */}
                      <div className="flex items-center gap-4 w-full md:w-1/3">
                        <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xl border border-slate-200">
                          {IniciaisEmpresa}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 truncate text-sm sm:text-base">
                            {projeto.EMPRESAS?.nm_fantasia}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {projeto.TIPOS_CONSULTORIA?.nm_servico}
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="flex flex-col w-full md:flex-1 gap-2">
                        <div className="flex justify-between text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                          <span className="text-slate-400">Progresso</span>
                          <span className="text-slate-700">
                            {consumido}h{" "}
                            <span className="text-slate-300">
                              / {projeto.nr_horas_contratadas}h
                            </span>
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${corBarra} transition-all duration-700 ease-out`}
                            style={{ width: `${percentualProgresso}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Status e Ações */}
                      <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-4 border-t md:border-none pt-4 md:pt-0">
                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-primary border border-primary/10">
                          {projeto.tp_status}
                        </span>
                        <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-primary transition-all">
                          <span className="material-symbols-outlined">
                            open_in_new
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* FERRAMENTAS - Grid Adaptativo */}
          <section className="space-y-4 pb-12">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight px-1">
              Ferramentas Rápidas
            </h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/templates")}
                className="flex flex-row xs:flex-col items-center xs:items-start gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:border-accent hover:shadow-md transition-all group w-full"
              >
                <div className="rounded-xl bg-blue-50 p-3 text-primary group-hover:bg-accent group-hover:text-white transition-all shrink-0 shadow-sm group-hover:shadow-accent/30">
                  <span className="material-symbols-outlined text-2xl">
                    description
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    Novo Cargo
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
                    Templates prontos
                  </p>
                </div>
              </button>

              <button className="flex flex-row xs:flex-col items-center xs:items-start gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:border-accent hover:shadow-md transition-all group w-full">
                <div className="rounded-xl bg-purple-50 p-3 text-purple-600 group-hover:bg-accent group-hover:text-white transition-all shrink-0 shadow-sm group-hover:shadow-accent/30">
                  <span className="material-symbols-outlined text-2xl">
                    link
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    Pesquisas
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
                    Clima e NPS
                  </p>
                </div>
              </button>

              <button className="flex flex-row xs:flex-col items-center xs:items-start gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:border-accent hover:shadow-md transition-all group w-full">
                <div className="rounded-xl bg-rose-50 p-3 text-rose-600 group-hover:bg-accent group-hover:text-white transition-all shrink-0 shadow-sm group-hover:shadow-accent/30">
                  <span className="material-symbols-outlined text-2xl">
                    psychology
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    Teste DISC
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
                    Comportamento
                  </p>
                </div>
              </button>

              <button className="flex flex-row xs:flex-col items-center xs:items-start gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:border-accent hover:shadow-md transition-all group w-full">
                <div className="rounded-xl bg-teal-50 p-3 text-teal-600 group-hover:bg-accent group-hover:text-white transition-all shrink-0 shadow-sm group-hover:shadow-accent/30">
                  <span className="material-symbols-outlined text-2xl">
                    file_download
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    Exportar
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
                    Relatórios PDF
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
