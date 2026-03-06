"use client";

import "@/app/globals.css";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjetoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const projetoId = params.id as string;

  const [empresaNome, setEmpresaNome] = useState("Carregando...");
  const [servicoNome, setServicoNome] = useState("...");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para o menu Mobile

  useEffect(() => {
    const buscarCabecalhoProjeto = async () => {
      if (!projetoId) return;
      const { data } = await supabase
        .from("PROJETOS")
        .select("EMPRESAS(nm_fantasia), TIPOS_CONSULTORIA(nm_servico)")
        .eq("cd_projeto", projetoId)
        .single();

      if (data) {
        const empresa = Array.isArray(data.EMPRESAS)
          ? data.EMPRESAS[0]
          : data.EMPRESAS;
        const servico = Array.isArray(data.TIPOS_CONSULTORIA)
          ? data.TIPOS_CONSULTORIA[0]
          : data.TIPOS_CONSULTORIA;

        setEmpresaNome((empresa as any)?.nm_fantasia || "Empresa");
        setServicoNome((servico as any)?.nm_servico || "Projeto");
      }
    };
    buscarCabecalhoProjeto();
  }, [projetoId]);

  // Fecha o menu lateral automaticamente sempre que uma nova página do projeto é carregada (no mobile)
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Menu Inteligente
  const menuProjeto = [
    { label: "Dashboard", icon: "dashboard", href: `/projetos/${projetoId}` },
    {
      label: "Ficha da Empresa",
      icon: "business",
      href: `/projetos/${projetoId}/empresa`,
    },
    {
      label: "Diagnóstico RH",
      icon: "fact_check",
      href: `/projetos/${projetoId}/diagnostico`,
    },
    {
      label: "Mapa de Equipe",
      icon: "groups",
      href: `/projetos/${projetoId}/equipe`,
    },
    {
      label: "Análise DISC",
      icon: "psychology",
      href: `/projetos/${projetoId}/disc`,
    },
    {
      label: "Clima Organizacional",
      icon: "thermostat",
      href: `/projetos/${projetoId}/clima`,
    },
    {
      label: "Templates",
      icon: "description",
      href: `/projetos/${projetoId}/templates`,
    },
    {
      label: "Relatório Final",
      icon: "analytics",
      href: `/projetos/${projetoId}/relatorio`,
    },
  ];

  const siglaEmpresa = empresaNome.substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light font-display text-text-main antialiased relative">
      {/* BOTÃO HAMBÚRGUER (MOBILE APENAS) */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-primary text-white p-2 rounded-xl shadow-lg focus:outline-none active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined">
          {isMenuOpen ? "close" : "menu"}
        </span>
      </button>

      {/* OVERLAY ESCURO (MOBILE APENAS) */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[40]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* SIDEBAR DO PROJETO */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-[50] lg:static
        w-64 bg-primary text-white flex flex-col shadow-2xl lg:shadow-xl flex-shrink-0
        transition-transform duration-300 ease-in-out h-full
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* HEADER DA SIDEBAR */}
        <div className="p-6 pt-16 lg:pt-6 border-b border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-inner">
            {siglaEmpresa}
          </div>
          <div className="overflow-hidden">
            <h1
              className="text-sm font-bold leading-tight truncate w-full"
              title={empresaNome}
            >
              {empresaNome}
            </h1>
            <p
              className="text-xs text-blue-200 truncate w-full"
              title={servicoNome}
            >
              {servicoNome}
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO INTERNA DO PROJETO */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 mt-2 scrollbar-hide">
          <p className="px-4 text-[10px] font-bold uppercase tracking-[2px] text-blue-300/40 mb-3">
            Módulos do Projeto
          </p>

          {menuProjeto.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 text-left outline-none ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10 scale-[1.02]"
                    : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${!isActive && "group-hover:scale-110"}`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* BOTÃO VOLTAR */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => router.push("/projetos")}
            className="w-full flex items-center justify-center gap-2 text-blue-200 hover:text-white hover:bg-white/5 rounded-lg py-3 lg:py-2 transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Sair do Projeto
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL ONDE AS PÁGINAS (FILHOS) SÃO INJETADAS */}
      <main className="flex-1 overflow-y-auto relative bg-[#F5F7FA] w-full">
        {children}
      </main>
    </div>
  );
}
