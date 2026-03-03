"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

// Definição dos dados dos templates exatamente como no seu design
// Adicionei os nomes de arquivos para cada um deles buscar no Supabase
const templatesList = [
  {
    id: 1,
    category: "Estrutura",
    title: "Descrição de Cargos",
    desc: "Modelo padronizado para definir responsabilidades, requisitos e competências de cada cargo.",
    arquivo: "descricao-cargos.docx",
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: 2,
    category: "R&S",
    title: "Fluxo de Recrutamento",
    desc: "Processo completo de recrutamento e seleção: divulgação, triagem, entrevista, admissão.",
    arquivo: "fluxo-recrutamento.xlsx",
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: 3,
    category: "R&S",
    title: "Roteiro de Entrevista",
    desc: "Perguntas comportamentais e técnicas estruturadas por competência.",
    arquivo: "roteiro-entrevista.doc",
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: 4,
    category: "Desempenho",
    title: "Matriz de Avaliação",
    desc: "Critérios objetivos para avaliação de desempenho por competência e resultado.",
    arquivo: "matriz-avaliacao.pdf",
    color: "bg-sky-50 text-sky-600",
  },
  {
    id: 5,
    category: "Remuneração",
    title: "Plano de Cargos e Salários",
    desc: "Estrutura de faixas salariais, critérios de progressão e enquadramento.",
    arquivo: "plano-cargos-salarios.pdf",
    color: "bg-green-50 text-green-600",
  },
  {
    id: 6,
    category: "Remuneração",
    title: "Faixas Salariais",
    desc: "Tabela de faixas salariais por cargo com piso, médio e teto.",
    arquivo: "faixas-salariais.xlsx",
    color: "bg-green-50 text-green-600",
  },
  {
    id: 7,
    category: "Desenvolvimento",
    title: "LNT – Levantamento de Necessidades",
    desc: "Diagnóstico de gaps de competência e necessidades de treinamento.",
    arquivo: "lnt-levantamento.docx",
    color: "bg-yellow-50 text-yellow-600",
  },
  // {
  //   id: 8,
  //   category: "Desenvolvimento",
  //   title: "PDI – Plano de Desenvolvimento",
  //   desc: "Plano personalizado de desenvolvimento com metas, prazos e ações.",
  //   arquivo: "pdi-plano.pdf",
  //   color: "bg-yellow-50 text-yellow-600",
  // },
  {
    id: 9,
    category: "Desempenho",
    title: "Avaliação de Desempenho",
    desc: "Formulário completo de avaliação 90°/180°/360° adaptável.",
    arquivo: "avaliacao-desempenho.xlsx",
    color: "bg-sky-50 text-sky-600",
  },
  {
    id: 11,
    category: "Gestão",
    title: "Plano de Ação 30/60/90 dias",
    desc: "Plano de ações com responsáveis, prazos e indicadores de acompanhamento.",
    arquivo: "plano-acao.xlsx",
    color: "bg-slate-100 text-slate-600",
  },
  {
    id: 12,
    category: "Gestão",
    title: "Regulamento Interno",
    desc: "Documento completo com regras e procedimentos internos da empresa.",
    arquivo: "regulamento-interno.docx",
    color: "bg-slate-100 text-slate-600",
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const [downloading, setDownloading] = useState<number | null>(null);

  // Função que puxa do Supabase Storage
  const baixarTemplate = async (template: (typeof templatesList)[0]) => {
    if (!template.arquivo) return;

    setDownloading(template.id);

    try {
      // Puxa o arquivo de um Bucket do Supabase chamado "templates"
      const { data, error } = await supabase.storage
        .from("templates")
        .download(template.arquivo);

      if (error) {
        throw error;
      }

      // Transforma os dados em um link e força o navegador a fazer o download
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = template.arquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar do Supabase:", error);
      alert(
        `Não foi possível baixar "${template.title}". Verifique se o arquivo existe no Supabase Storage.`,
      );
    } finally {
      setDownloading(null);
    }
  };

  const baixarTodos = async () => {
    alert("Iniciando download consolidado de todos os templates do sistema...");
    for (const template of templatesList) {
      await baixarTemplate(template);
      // Pequeno delay entre um arquivo e outro para o navegador não bloquear pop-ups
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-20">
      {/* HEADER DE NAVEGAÇÃO */}
      <header className="bg-white/95 backdrop-blur-sm pt-8 pb-6 px-8 flex justify-between items-end border-b border-slate-200 shadow-sm sticky top-0 z-10 shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold text-[#064384] tracking-tight">
            Templates
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Templates padronizados para acelerar a entrega de resultados e
            garantir consistência em todos os projetos de consultoria.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-[#064384] transition-colors focus:outline-none flex items-center gap-2 font-bold text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Voltar
        </button>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-6 py-10 space-y-8">
        {/* TÍTULO E AÇÃO PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-600 text-4xl">
                description
              </span>
              Templates Padronizados
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {templatesList.length} materiais editáveis prontos para uso
              imediato
            </p>
          </div>

          <button
            onClick={baixarTodos}
            className="flex items-center justify-center gap-2 bg-[#064384] hover:bg-blue-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            Exportar Todos em Lote
          </button>
        </div>

        {/* GRID DOS TEMPLATES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templatesList.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
            >
              {/* TAG/BADGE */}
              <div className="mb-4">
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider ${template.color}`}
                >
                  <span className="material-symbols-outlined text-[12px] align-text-bottom mr-1">
                    feed
                  </span>
                  {template.category}
                </span>
              </div>

              {/* TÍTULO E DESCRIÇÃO */}
              <h3 className="font-bold text-slate-800 text-base leading-tight mb-2">
                {template.title}
              </h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 flex-1">
                {template.desc}
              </p>

              {/* BOTÃO DE DOWNLOAD CONECTADO AO SUPABASE */}
              <button
                onClick={() => baixarTemplate(template)}
                disabled={downloading === template.id}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-bold transition-all
                  ${
                    downloading === template.id
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-wait"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-[#064384] active:scale-[0.98]"
                  }
                `}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {downloading === template.id ? "hourglass_empty" : "download"}
                </span>
                {downloading === template.id ? "Baixando..." : "Baixar"}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
