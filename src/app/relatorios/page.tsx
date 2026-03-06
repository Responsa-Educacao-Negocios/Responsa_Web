"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RelatorioItem {
  id: string;
  titulo: string;
  setor: string;
  formato: string;
  data: string;
  icon: string;
  color: string;
  href: string;
}

export default function RelatoriosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [relatorios, setRelatorios] = useState<RelatorioItem[]>([]);
  const [metricas, setMetricas] = useState({
    totalDiagnosticos: 0,
    climaMedioGlobal: 0.0,
    totalRelatorios: 0,
  });

  useEffect(() => {
    const carregarRelatorios = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const { data: projetosData, error: projError } = await supabase
          .from("PROJETOS")
          .select(`cd_projeto, ts_criacao, EMPRESAS ( nm_fantasia )`)
          .order("ts_criacao", { ascending: false });

        if (projError) throw projError;

        const relatoriosDinamicos =
          projetosData?.map((p) => {
            const empresa = Array.isArray(p.EMPRESAS)
              ? p.EMPRESAS[0]
              : p.EMPRESAS;
            return {
              id: p.cd_projeto,
              titulo: `Relatório Final Executivo - ${empresa?.nm_fantasia || "Empresa"}`,
              setor: "Gestão 360°",
              formato: "Web / PDF",
              data: new Date(p.ts_criacao).toLocaleDateString("pt-BR"),
              icon: "analytics",
              color: "text-[#064384] bg-blue-50",
              href: `/projetos/${p.cd_projeto}/relatorio`,
            };
          }) || [];

        setRelatorios(relatoriosDinamicos);

        const { count: diagCount } = await supabase
          .from("INDICADORES_RH")
          .select("*", { count: "exact", head: true });

        const { data: respostasClima } = await supabase
          .from("RESPOSTAS_INDIVIDUAIS_CLIMA")
          .select(
            "nr_lideranca, nr_comunicac, nr_reconhecir, nr_desenvolvi, nr_ambiente, nr_engajamen",
          );

        let mediaGlobal = 0;
        if (respostasClima && respostasClima.length > 0) {
          const somaTotal = respostasClima.reduce((acc, curr) => {
            const mediaResposta =
              (curr.nr_lideranca +
                curr.nr_comunicac +
                curr.nr_reconhecir +
                curr.nr_desenvolvi +
                curr.nr_ambiente +
                curr.nr_engajamen) /
              6;
            return acc + mediaResposta;
          }, 0);
          mediaGlobal = somaTotal / respostasClima.length;
        }

        setMetricas({
          totalDiagnosticos: diagCount || 0,
          climaMedioGlobal: Number(mediaGlobal.toFixed(1)),
          totalRelatorios: relatoriosDinamicos.length,
        });
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };
    carregarRelatorios();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center flex-col gap-4 text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Processando Relatórios...</span>
      </div>
    );
  }

  const percentualClima =
    metricas.climaMedioGlobal > 0 ? (metricas.climaMedioGlobal / 10) * 100 : 0;

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-[#F8FAFC] font-sans text-slate-800 antialiased">
      <Sidebar
        onLogout={() =>
          supabase.auth.signOut().then(() => router.push("/login"))
        }
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* HEADER RESPONSIVO */}
        <header className="flex h-16 sm:h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-sm flex-shrink-0 z-10 w-full gap-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate pl-12 lg:pl-0 uppercase">
            Central de Relatórios
          </h2>
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border border-slate-200">
            <span className="material-symbols-outlined text-slate-400 text-sm">
              calendar_today
            </span>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
              Semestre Atual
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scrollbar-hide">
          {/* CARDS DE MÉTRICAS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-xl bg-blue-50 p-2.5 text-[#064384]">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-tight">
                  Diagnósticos
                  <br />
                  Concluídos
                </h3>
              </div>
              <p className="text-3xl font-black text-slate-800">
                {metricas.totalDiagnosticos}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-xl bg-orange-50 p-2.5 text-[#FF8323]">
                  <span className="material-symbols-outlined">thermostat</span>
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-tight">
                  Clima Médio
                  <br />
                  Global
                </h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800">
                  {metricas.climaMedioGlobal || "0.0"}
                </span>
                <span className="text-xs font-bold text-slate-300">/ 10.0</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                <div
                  className="bg-[#FF8323] h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${percentualClima}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group transition-all sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                  <span className="material-symbols-outlined">
                    folder_shared
                  </span>
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-tight">
                  Arquivos
                  <br />
                  Disponíveis
                </h3>
              </div>
              <p className="text-3xl font-black text-slate-800">
                {metricas.totalRelatorios}
              </p>
            </div>
          </section>

          {/* LISTA DE RELATÓRIOS */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight px-1">
              Relatórios por Cliente
            </h3>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* HEADER DA TABELA (Oculto em Mobile) */}
              <div className="hidden md:grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <div className="col-span-6">Informações do Relatório</div>
                <div className="col-span-2 text-center">Formato</div>
                <div className="col-span-2">Data</div>
                <div className="col-span-2 text-right">Ação</div>
              </div>

              {/* LISTA / CARDS */}
              <div className="divide-y divide-slate-100">
                {relatorios.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium italic">
                    Nenhum relatório encontrado no banco de dados.
                  </div>
                ) : (
                  relatorios.map((relatorio) => (
                    <div
                      key={relatorio.id}
                      className="p-4 sm:px-6 sm:py-5 hover:bg-slate-50 transition-all flex flex-col md:grid md:grid-cols-12 gap-4 items-center group"
                    >
                      {/* Título e Ícone */}
                      <div className="w-full md:col-span-6 flex items-center gap-4">
                        <div
                          className={`size-12 rounded-2xl shrink-0 flex items-center justify-center ${relatorio.color} shadow-sm group-hover:scale-110 transition-transform`}
                        >
                          <span className="material-symbols-outlined text-2xl">
                            {relatorio.icon}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate leading-tight uppercase tracking-tight">
                            {relatorio.titulo}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            {relatorio.setor}
                          </p>
                        </div>
                      </div>

                      {/* Badge Formato (Mobile desce, Desktop coluna) */}
                      <div className="w-full md:col-span-2 flex md:justify-center">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
                          {relatorio.formato}
                        </span>
                      </div>

                      {/* Data */}
                      <div className="w-full md:col-span-2 text-xs font-bold text-slate-400 md:text-slate-500 flex items-center gap-2">
                        <span className="md:hidden material-symbols-outlined text-sm">
                          calendar_today
                        </span>
                        {relatorio.data}
                      </div>

                      {/* Ação */}
                      <div className="w-full md:col-span-2 flex justify-end">
                        <button
                          onClick={() => router.push(relatorio.href)}
                          className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-3 md:py-2 text-xs font-black uppercase tracking-widest text-[#064384] hover:bg-[#064384] hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          <span className="material-symbols-outlined text-lg">
                            visibility
                          </span>
                          Acessar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
