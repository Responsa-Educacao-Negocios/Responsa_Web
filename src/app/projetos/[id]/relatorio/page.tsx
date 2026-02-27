"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RelatorioFinalPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const carregarRelatorioCompleto = async () => {
      try {
        setLoading(true);
        const id = params.id as string;

        const { data: proj, error: errP } = await supabase
          .from("PROJETOS")
          .select("*, EMPRESAS(*)")
          .eq("cd_projeto", id)
          .single();
        if (errP) throw errP;

        const { data: ind } = await supabase
          .from("INDICADORES_RH")
          .select("*")
          .eq("cd_projeto", id)
          .order("ts_criacao", { ascending: false })
          .limit(1)
          .maybeSingle();

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
          empresa: Array.isArray(proj.EMPRESAS)
            ? proj.EMPRESAS[0]
            : proj.EMPRESAS,
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

  const handleExportPDF = () => {
    setIsExporting(true);

    const element = document.getElementById("relatorio-conteudo");
    if (!element) {
      setIsExporting(false);
      return;
    }

    element.classList.remove("shadow-2xl", "border", "mt-10");
    element.classList.add("p-8");

    const nomeArquivo = `Relatorio_${dados?.empresa?.nm_fantasia?.replace(/\s+/g, "_") || "Consultoria"}.pdf`;

    const opt = {
      margin: 10,
      filename: nomeArquivo,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc: Document) => {
          const styles = clonedDoc.querySelectorAll("style");
          Array.from(styles).forEach((style) => {
            if (
              style.innerHTML.includes("lab(") ||
              style.innerHTML.includes("oklch(")
            ) {
              style.innerHTML = style.innerHTML.replace(
                /(?:oklch|lab|lch)\([^)]+\)/g,
                "rgb(200, 200, 200)",
              );
            }
          });

          const allElements = clonedDoc.querySelectorAll("*");
          Array.from(allElements).forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (!htmlEl.style) return;

            const computedStyle = window.getComputedStyle(htmlEl);
            const color = computedStyle.color || "";
            const bg = computedStyle.backgroundColor || "";
            const border = computedStyle.borderColor || "";

            if (color.includes("lab") || color.includes("oklch"))
              htmlEl.style.color = "rgb(15, 23, 42)";
            if (bg.includes("lab") || bg.includes("oklch"))
              htmlEl.style.backgroundColor = "rgb(255, 255, 255)";
            if (border.includes("lab") || border.includes("oklch"))
              htmlEl.style.borderColor = "rgb(226, 232, 240)";
          });
        },
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    const restaurarInterface = () => {
      element.classList.add("shadow-2xl", "border", "mt-10");
      element.classList.remove("p-8");
      setIsExporting(false);
    };

    const executarGeracao = () => {
      const win = window as any;
      win
        .html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => restaurarInterface())
        .catch((err: any) => {
          console.error("Erro interno do gerador PDF:", err);
          restaurarInterface();
          alert("Erro ao exportar. Usando modo de impressão alternativo.");
          window.print();
        });
    };

    const win = window as any;
    if (typeof window !== "undefined" && win.html2pdf) {
      executarGeracao();
    } else {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = executarGeracao;
      script.onerror = () => {
        alert("Erro ao carregar os recursos para PDF. Verifique sua conexão.");
        restaurarInterface();
      };
      document.body.appendChild(script);
    }
  };

  if (loading || !dados)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#064384]">
          <span className="material-symbols-outlined animate-spin text-4xl">
            progress_activity
          </span>
          <span className="font-bold animate-pulse">
            Gerando Relatório Executivo...
          </span>
        </div>
      </div>
    );

  return (
    <>
      {/* MÁGICA DA IMPRESSÃO AQUI: Força o navegador a manter as cores e esconde a Sidebar */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              margin: 15mm;
              size: A4 portrait;
            }
            body {
              background-color: white !important;
            }
            /* ESCONDE A SIDEBAR DO NEXT.JS NO MOMENTO DA IMPRESSÃO */
            aside, nav, [data-sidebar], .sidebar {
              display: none !important;
            }
            /* GARANTE QUE O CONTEÚDO OCUPE 100% DO PAPEL SEM MARGENS LATERAIS */
            main {
              margin-left: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
          }
        `,
        }}
      />

      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 print:bg-white print:pb-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-slate-400 hover:text-[#064384] transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-xl">
                arrow_back
              </span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <span className="material-symbols-outlined text-[#064384]">
              description
            </span>
            <h1 className="text-lg font-bold">Relatório Final Executivo</h1>
          </div>

          <div className="flex gap-3">
            {/* <button
              onClick={() => window.print()}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                print
              </span>
              Imprimir
            </button> */}

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#064384] text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    sync
                  </span>
                  Processando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    picture_as_pdf
                  </span>
                  Exportar PDF
                </>
              )}
            </button>
          </div>
        </header>

        <main
          id="relatorio-conteudo"
          className="max-w-[1000px] mx-auto mt-10 bg-white shadow-2xl border border-slate-200 p-16 print:shadow-none print:border-none print:mt-0 print:p-0 print:max-w-none"
        >
          <div className="flex flex-col items-center text-center mb-12 print:mb-8">
            <div className="size-16 bg-[#FF8323] rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-6 shadow-xl print:shadow-none">
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

          <div className="space-y-10 print:space-y-8">
            <section className="border-t border-slate-100 pt-6 break-inside-avoid">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
                <span className="material-symbols-outlined text-lg">
                  business
                </span>
                1. Dados da Empresa
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
                {dados.empresa.nm_fantasia} • CNPJ:{" "}
                {dados.empresa.cd_cnpj || "---"} • Segmento:{" "}
                {dados.empresa.ds_segmento || "Não informado"} •{" "}
                {dados.totalColabs} colaboradores mapeados • Faturamento médio:
                R$ {dados.empresa.nr_faturamento_anual || "---"}/mês
              </p>
            </section>

            <section className="border-t border-slate-100 pt-6 break-inside-avoid">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
                <span className="material-symbols-outlined text-lg">
                  priority_high
                </span>
                2. Dor Principal
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
                {dados.projeto.ds_dor_principal ||
                  "Nenhuma dor principal registrada no momento da concepção do projeto."}
              </p>
            </section>

            <section className="border-t border-slate-100 pt-6 break-inside-avoid">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
                <span className="material-symbols-outlined text-lg">
                  analytics
                </span>
                3. Diagnóstico Inicial
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
                Maturidade de RH: {dados.maturidade}/100 (
                {dados.maturidade > 70 ? "Avançado" : "Estruturando"}). Foram
                identificados processos informais de gestão e necessidade de
                estruturação de práticas contínuas de avaliação e
                desenvolvimento.
              </p>
            </section>

            <section className="border-t border-slate-100 pt-6 break-inside-avoid">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
                <span className="material-symbols-outlined text-lg">
                  psychology
                </span>
                4. Análise Comportamental (DISC)
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
                Distribuição da Equipe: {dados.disc}. Equipe com equilíbrio
                comportamental mapeado através de {dados.totalColabs} avaliações
                individuais concluídas.
              </p>
            </section>

            <section className="border-t border-slate-100 pt-6 break-inside-avoid">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
                <span className="material-symbols-outlined text-lg">
                  thermostat
                </span>
                5. Diagnóstico de Clima Organizacional
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
                Índice geral de satisfação: {dados.clima}/100. O clima
                organizacional atual é considerado{" "}
                <strong>{dados.clima >= 50 ? "Estável" : "Crítico"}</strong>,
                calculado com base na percepção anônima e segmentada dos
                colaboradores.
              </p>
            </section>

            <section className="border-t border-slate-100 pt-6 break-inside-avoid">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
                <span className="material-symbols-outlined text-lg">
                  grid_view
                </span>
                6. Índice Geral do Projeto
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
                Índice Geral de Gestão de Pessoas (Saúde): {dados.indiceGeral}
                /100 — Nível de Risco Trabalhista percebido:{" "}
                {dados.risco > 50 ? "Alto" : "Médio ou Controlado"} (
                {dados.risco}
                /100).
              </p>
            </section>

            <section className="border-t border-slate-100 pt-6 break-inside-avoid">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#064384] mb-4">
                <span className="material-symbols-outlined text-lg">
                  lightbulb
                </span>
                7. Recomendações Estratégicas
              </h3>
              <p className="text-[13px] leading-relaxed text-slate-600 font-medium whitespace-pre-line">
                {dados.projeto.ds_expectativ ||
                  "Aguardando definição final do consultor para consolidação do plano de ação."}
              </p>
            </section>
          </div>

          <footer className="mt-20 pt-8 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest break-inside-avoid print:mt-10">
            <span>CoreConsulta • Gestão de Pessoas 360°</span>
            <span>Documento Confidencial</span>
          </footer>
        </main>
      </div>
    </>
  );
}
