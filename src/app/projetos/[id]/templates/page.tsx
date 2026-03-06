"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const templatesList = [
  {
    id: 1,
    category: "Estrutura",
    title: "Descrição de Cargos",
    desc: "Modelo padronizado para definir responsabilidades, requisitos e competências de cada cargo.",
    arquivo: "descricao-cargos.docx",
    slug: "descricao-cargos",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    id: 2,
    category: "R&S",
    title: "Fluxo de Recrutamento",
    desc: "Processo completo de recrutamento e seleção: divulgação, triagem, entrevista, admissão.",
    arquivo: "fluxo-recrutamento.xlsx",
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
  {
    id: 3,
    category: "R&S",
    title: "Roteiro de Entrevista",
    desc: "Perguntas comportamentais e técnicas estruturadas por competência.",
    arquivo: "roteiro-entrevista.doc",
    slug: "roteiro-entrevista",
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
  {
    id: 4,
    category: "Desempenho",
    title: "Matriz de Avaliação",
    desc: "Critérios objetivos para avaliação de desempenho por competência e resultado.",
    arquivo: "matriz-avaliacao.pdf",
    color: "bg-sky-50 text-sky-600 border-sky-200",
  },
  {
    id: 5,
    category: "Remuneração",
    title: "Plano de Cargos e Salários",
    desc: "Estrutura de faixas salariais, progressão e enquadramento.",
    arquivo: "cargos-salarios.pdf",
    slug: "cargos-salarios",
    color: "bg-green-50 text-green-600 border-green-200",
  },
  {
    id: 6,
    category: "Remuneração",
    title: "Faixas Salariais",
    desc: "Tabela de faixas salariais por cargo com piso, médio e teto.",
    arquivo: "faixas-salariais.xlsx",
    color: "bg-green-50 text-green-600 border-green-200",
  },
  {
    id: 7,
    category: "Desenvolvimento",
    title: "LNT – Levantamento",
    desc: "Diagnóstico de gaps de competência e necessidades de treinamento.",
    arquivo: "lnt-levantamento.docx",
    slug: "lnt-levantamento",
    color: "bg-yellow-50 text-yellow-600 border-yellow-200",
  },
  {
    id: 9,
    category: "Desempenho",
    title: "Avaliação de Desempenho",
    desc: "Formulário completo de avaliação 90°/180°/360° adaptável.",
    arquivo: "avaliacao-desempenho.xlsx",
    color: "bg-sky-50 text-sky-600 border-sky-200",
  },
  {
    id: 11,
    category: "Gestão",
    title: "Plano de Ação 30/60/90",
    desc: "Plano de ações com responsáveis, prazos e indicadores.",
    arquivo: "plano-acao.xlsx",
    slug: "plano-acao", // <--- Adicionado o slug aqui!
    color: "bg-slate-50 text-slate-600 border-slate-200",
  },
  {
    id: 12,
    category: "Gestão",
    title: "Regulamento Interno",
    desc: "Documento completo com regras e procedimentos internos da empresa.",
    arquivo: "regulamento-interno.docx",
    slug: "regulamento-interno",
    color: "bg-slate-50 text-slate-600 border-slate-200",
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const [downloading, setDownloading] = useState<number | null>(null);

  const baixarTemplate = async (template: (typeof templatesList)[0]) => {
    setDownloading(template.id);
    try {
      const { data, error } = await supabase.storage
        .from("templates")
        .download(template.arquivo);
      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = template.arquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar:", error);
      alert(`Arquivo "${template.arquivo}" não encontrado no Storage.`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-20">
      <header className="bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-5 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 border-b border-slate-200 shadow-sm sticky top-0 z-10 shrink-0 w-full">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#064384] tracking-tight pl-12 lg:pl-0">
            Templates e Formulários
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium pl-12 lg:pl-0 leading-tight">
            Preencha documentos online ou baixe as planilhas para a consultoria.
          </p>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templatesList.map((template) => {
            // LÓGICA CORRIGIDA: Se tiver 'slug' configurado, abre a tela. Se não, baixa.
            const isOnlineForm = !!template.slug;

            return (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group"
              >
                <div className="mb-4">
                  <span
                    className={`text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-wider border ${template.color}`}
                  >
                    {template.category}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-2 group-hover:text-[#064384] transition-colors">
                  {template.title}
                </h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 flex-1">
                  {template.desc}
                </p>

                {isOnlineForm ? (
                  <button
                    onClick={() =>
                      router.push(
                        `/projetos/${params.id}/templates/${template.slug}`,
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#064384]/20 text-sm font-bold bg-blue-50 text-[#064384] hover:bg-[#064384] hover:text-white transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      edit_document
                    </span>
                    Preencher Online
                  </button>
                ) : (
                  <button
                    onClick={() => baixarTemplate(template)}
                    disabled={downloading === template.id}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 text-sm font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#064384] transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {downloading === template.id
                        ? "hourglass_empty"
                        : "download"}
                    </span>
                    {downloading === template.id
                      ? "Baixando..."
                      : "Baixar Arquivo"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
