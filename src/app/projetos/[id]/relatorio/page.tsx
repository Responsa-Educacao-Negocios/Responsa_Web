"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RelatorioFinalPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    const carregarRelatorioCompleto = async () => {
      try {
        setLoading(true);
        const id = params.id as string;

        // 1. Dados do Projeto e Empresa
        const { data: proj, error: errP } = await supabase
          .from("PROJETOS")
          .select("*, EMPRESAS(*)")
          .eq("cd_projeto", id)
          .single();
        if (errP) throw errP;

        // 2. Diagnóstico Inicial e Risco (Indicadores RH)
        const { data: ind } = await supabase
          .from("INDICADORES_RH")
          .select("*")
          .eq("cd_projeto", id)
          .order("ts_criacao", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Média de Clima (Baseado nos votos individuais)
        const { data: respClima } = await supabase
          .from("RESPOSTAS_INDIVIDUAIS_CLIMA")
          .select("*")
          .eq("cd_projeto", id);

        let notaClima = 0;
        if (respClima && respClima.length > 0) {
          const soma = respClima.reduce(
            (acc, curr) =>
              acc +
              (curr.nr_lideranca +
                curr.nr_comunicac +
                curr.nr_reconhecir +
                curr.nr_desenvolvi +
                curr.nr_ambiente +
                curr.nr_engajamen) /
                6,
            0,
          );
          notaClima = Math.round((soma / respClima.length) * 10);
        }

        // 4. Perfil DISC da Equipe
        const { data: discData } = await supabase
          .from("AVALIACOES_DISC")
          .select("*")
          .eq("cd_projeto", id);

        let distribuicaoDisc = "D 0% | I 0% | S 0% | C 0%";
        if (discData && discData.length > 0) {
          const t = discData.length;
          const s = discData.reduce(
            (acc, c) => ({
              D: acc.D + (c.nr_dominancia || 0),
              I: acc.I + (c.nr_influencia || 0),
              S: acc.S + (c.nr_estabilidade || 0),
              C: acc.C + (c.nr_conformidade || 0),
            }),
            { D: 0, I: 0, S: 0, C: 0 },
          );
          distribuicaoDisc = `D ${Math.round(s.D / t)}% | I ${Math.round(s.I / t)}% | S ${Math.round(s.S / t)}% | C ${Math.round(s.C / t)}%`;
        }

        setDados({
          projeto: proj,
          empresa: proj.EMPRESAS,
          maturidade: ind?.nr_maturidade_rh || 0,
          risco: ind?.nr_risco_trabalhista || 0,
          clima: notaClima,
          disc: distribuicaoDisc,
          totalColabs: discData?.length || 0,
          indiceGeral: Math.round(
            ((ind?.nr_maturidade_rh || 0) +
              notaClima +
              (100 - (ind?.nr_risco_trabalhista || 0))) /
              3,
          ),
        });
      } catch (e) {
        console.error("Erro ao gerar relatório:", e);
      } finally {
        setLoading(false);
      }
    };

    carregarRelatorioCompleto();
  }, [params.id]);

  if (loading || !dados)
    return (
      <div className="p-20 text-center animate-pulse">
        Gerando Relatório Final Executivo...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 print:bg-white print:pb-0">
      {/* TOOLBAR SUPERIOR (Oculta na impressão) */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-600">
            description
          </span>
          <h1 className="text-xl font-bold">Relatório Final Executivo</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined text-lg">print</span>{" "}
            Imprimir
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#064384] text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition-all">
            <span className="material-symbols-outlined text-lg">
              picture_as_pdf
            </span>{" "}
            Exportar PDF
          </button>
        </div>
      </header>

      {/* DOCUMENTO (A4 Centralizado) */}
      <main className="max-w-[1000px] mx-auto mt-10 bg-white shadow-2xl border border-slate-200 p-16 print:shadow-none print:border-none print:mt-0 print:p-8">
        {/* CABEÇALHO DO DOCUMENTO */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="size-16 bg-[#FF8323] rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-6 shadow-xl">
            GP
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Relatório de Consultoria em Gestão de Pessoas
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {dados.empresa.nm_fantasia} • Data:{" "}
            {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* SEÇÕES DO RELATÓRIO */}
        <div className="space-y-10">
          {/* 1. Dados da Empresa */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
              <span className="material-symbols-outlined text-lg">
                business
              </span>{" "}
              1. Dados da Empresa
            </h3>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
              {dados.empresa.nm_fantasia} • CNPJ:{" "}
              {dados.empresa.cd_cnpj || "---"} • Segmento:{" "}
              {dados.empresa.ds_segmento || "Não informado"} •{" "}
              {dados.totalColabs} colaboradores • Faturamento médio: R${" "}
              {dados.empresa.nr_faturamento_anual || "---"}/mês
            </p>
          </section>

          {/* 2. Dor Principal */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
              <span className="material-symbols-outlined text-lg">
                priority_high
              </span>{" "}
              2. Dor Principal
            </h3>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
              {dados.projeto.ds_dor_principal ||
                "Nenhuma dor principal cadastrada no projeto."}
            </p>
          </section>

          {/* 3. Diagnóstico Inicial */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
              <span className="material-symbols-outlined text-lg">
                analytics
              </span>{" "}
              3. Diagnóstico Inicial
            </h3>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
              Maturidade de RH: {dados.maturidade}/100 (
              {dados.maturidade > 70 ? "Avançado" : "Estruturando"}). Foram
              identificados processos informais de gestão e necessidade de
              estruturação de cargos e salários.
            </p>
          </section>

          {/* 4. Análise DISC */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
              <span className="material-symbols-outlined text-lg">
                psychology
              </span>{" "}
              4. Análise DISC
            </h3>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
              Distribuição: {dados.disc}. Equipe com equilíbrio comportamental
              mapeado através de {dados.totalColabs} avaliações individuais
              concluídas.
            </p>
          </section>

          {/* 5. Análise de Clima */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
              <span className="material-symbols-outlined text-lg">
                thermostat
              </span>{" "}
              5. Análise de Clima
            </h3>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
              Índice geral: {dados.clima}/100. O clima organizacional é
              considerado{" "}
              <strong>{dados.clima >= 50 ? "Estável" : "Crítico"}</strong>{" "}
              baseado na percepção anônima dos colaboradores.
            </p>
          </section>

          {/* 6. Dashboard Geral */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
              <span className="material-symbols-outlined text-lg">
                grid_view
              </span>{" "}
              6. Dashboard Geral
            </h3>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
              Índice Geral de Gestão de Pessoas: {dados.indiceGeral}/100 — Risco
              trabalhista: {dados.risco > 50 ? "Alto" : "Médio"} ({dados.risco}
              /100).
            </p>
          </section>

          {/* 7. Intervenções Realizadas */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
              <span className="material-symbols-outlined text-lg">
                task_alt
              </span>{" "}
              7. Intervenções Realizadas
            </h3>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
              Mapeamento de competências, aplicação de testes comportamentais
              DISC, diagnóstico de clima organizacional e estruturação de plano
              de desenvolvimento individual (PDI).
            </p>
          </section>

          {/* 10. Recomendações Estratégicas */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
              <span className="material-symbols-outlined text-lg">
                lightbulb
              </span>{" "}
              10. Recomendações Estratégicas
            </h3>
            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
              {dados.projeto.ds_expectativ ||
                "Aguardando definição estratégica do consultor."}
            </p>
          </section>
        </div>

        {/* RODAPÉ DO DOCUMENTO */}
        <footer className="mt-20 pt-8 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <span>Gestão de Pessoas 360° • Consultoria Proprietária</span>
          <span>Documento Confidencial</span>
        </footer>
      </main>
    </div>
  );
}
