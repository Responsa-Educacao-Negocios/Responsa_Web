"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Carregando...");
  const [userRole, setUserRole] = useState("...");

  // Configuração dos links para evitar repetição de código (DRY)
  const menuItems = [
    { label: "Painel Geral", href: "/dashboard", icon: "dashboard" },
    { label: "Projetos", href: "/projetos", icon: "work" },
    { label: "Clientes", href: "/clientes", icon: "groups" },
    // { label: "Ferramentas", href: "/ferramentas", icon: "construction" },
    { label: "Relatórios", href: "/relatorios", icon: "bar_chart" },
  ];

  useEffect(() => {
    const buscarDadosUsuario = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: consultor } = await supabase
          .from("CONSULTORES")
          .select("nm_completo, ds_cargo")
          .eq("cd_auth_supabase", user.id)
          .maybeSingle();

        if (consultor) {
          setUserName(consultor.nm_completo || "Consultor");
          setUserRole(consultor.ds_cargo || "Administrador");
        } else {
          setUserName("Usuário");
          setUserRole("Administrador");
        }
      }
    };

    buscarDadosUsuario();
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    // bg-primary ao invés de hex code fixo
    <aside className="flex w-64 flex-col bg-primary text-white shadow-2xl flex-shrink-0 z-20 h-full border-r border-white/5">
      {/* LOGO SECTION */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner">
          <span className="material-symbols-outlined text-2xl">
            rocket_launch
          </span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter leading-none">
            RESPONSA
          </h1>
          <p className="text-[10px] text-blue-300/60 font-bold uppercase tracking-[2px] mt-1">
            Admin Panel
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 mt-4">
        <p className="px-4 text-[10px] font-bold uppercase tracking-[2px] text-blue-300/40 mb-4">
          Menu Principal
        </p>

        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              isActive(item.href)
                ? "bg-accent text-white shadow-lg shadow-orange-950/20 scale-[1.02]" // bg-accent
                : "text-blue-100/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span
              className={`material-symbols-outlined transition-transform duration-300 ${!isActive(item.href) && "group-hover:scale-110"}`}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* FOOTER: PERFIL & LOGOUT CORRIGIDO */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <button
          onClick={onLogout}
          className="group relative flex w-full items-center gap-3 rounded-2xl p-2 transition-all duration-300 ease-in-out hover:bg-white/5 focus:outline-none overflow-hidden"
        >
          {/* AVATAR COM STATUS */}
          <div className="relative h-11 w-11 shrink-0">
            <div
              className="h-full w-full rounded-full border-2 border-white/10 bg-slate-700 bg-cover bg-center transition-all duration-300 group-hover:border-red-400/50 shadow-lg"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop')",
              }}
            />
            {/* Borda azul com a mesma cor principal do menu */}
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-primary bg-green-500 shadow-sm" />
          </div>

          {/* CONTAINER DE ANIMAÇÃO (SWAP VERTICAL) */}
          <div className="relative flex flex-1 flex-col h-10 justify-center overflow-hidden">
            {/* ESTADO NORMAL: NOME E CARGO */}
            <div className="flex flex-col text-left transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-12 group-hover:opacity-0">
              <span className="truncate text-sm font-bold text-white tracking-tight">
                {userName}
              </span>
              <span className="truncate text-[10px] font-bold uppercase tracking-wider text-blue-300/50">
                {userRole}
              </span>
            </div>

            {/* ESTADO HOVER: BOTÃO LOGOUT */}
            {/* MUDANÇA AQUI: Adicionado 'justify-end' e 'pr-2' */}
            <div className="absolute inset-0 flex justify-end translate-y-12 items-center opacity-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0 group-hover:opacity-100 pr-2">
              <span className="flex items-center gap-2 text-sm font-black text-red-400 hover:text-red-300">
                <span className="material-symbols-outlined text-[20px]">
                  logout
                </span>
              </span>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}
