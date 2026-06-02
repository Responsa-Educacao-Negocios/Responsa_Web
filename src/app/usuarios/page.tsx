"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Consultor {
  id: string;
  nm_completo: string;
  ds_cargo: string;
  ds_email?: string;
  tipo: "consultor";
  sn_ativo?: boolean;
  ts_criacao?: string;
}

interface UsuarioCliente {
  id: string;
  nm_usuario: string;
  ds_email: string;
  cd_empresa: string;
  nm_empresa?: string;
  tipo: "cliente";
  ts_criacao?: string;
}

interface Fatura {
  cd_fatura: string;
  cd_empresa: string;
  nm_empresa?: string;
  vl_fatura: number;
  tp_status: "PAGA" | "PENDENTE" | "VENCIDA" | "CANCELADA";
  dt_vencimento?: string;
  ts_criacao: string;
  ds_plano?: string;
}

type Tab = "usuarios" | "cobrancas";
type SubTab = "consultores" | "clientes";

export default function UsuariosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("usuarios");
  const [subTab, setSubTab] = useState<SubTab>("consultores");

  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [clientes, setClientes] = useState<UsuarioCliente[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [faturasAlerta, setFaturasAlerta] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      await Promise.all([carregarConsultores(), carregarClientes(), carregarFaturas()]);
      setLoading(false);
    };
    init();
  }, [router]);

  const carregarConsultores = async () => {
    const { data } = await supabase
      .from("CONSULTORES")
      .select("*")
      .order("nm_completo", { ascending: true });

    if (data) {
      setConsultores(data.map((c: any) => ({
        id: c.cd_consultor || c.id || c.cd_auth_supabase,
        nm_completo: c.nm_completo,
        ds_cargo: c.ds_cargo || "Consultor",
        ds_email: c.ds_email || c.email || "—",
        tipo: "consultor" as const,
        sn_ativo: c.sn_ativo ?? true,
        ts_criacao: c.ts_criacao || c.created_at,
      })));
    }
  };

  const carregarClientes = async () => {
    const { data } = await supabase
      .from("USUARIOS_CLIENTE")
      .select(`*, EMPRESAS(nm_fantasia)`)
      .order("nm_usuario", { ascending: true });

    if (data) {
      setClientes(data.map((c: any) => {
        const empresa = Array.isArray(c.EMPRESAS) ? c.EMPRESAS[0] : c.EMPRESAS;
        return {
          id: c.cd_usuario || c.id || c.cd_auth_supabase,
          nm_usuario: c.nm_usuario,
          ds_email: c.ds_email,
          cd_empresa: c.cd_empresa,
          nm_empresa: empresa?.nm_fantasia || "—",
          tipo: "cliente" as const,
          ts_criacao: c.ts_criacao || c.created_at,
        };
      }));
    }
  };

  const carregarFaturas = async () => {
    const { data } = await supabase
      .from("FATURAS")
      .select(`*, EMPRESAS(nm_fantasia)`)
      .order("ts_criacao", { ascending: false });

    if (data) {
      const hoje = new Date();
      let alertas = 0;

      const faturasFormatadas = data.map((f: any) => {
        const empresa = Array.isArray(f.EMPRESAS) ? f.EMPRESAS[0] : f.EMPRESAS;
        const vencimento = f.dt_vencimento ? new Date(f.dt_vencimento) : null;
        const diasRestantes = vencimento ? Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : null;

        if (f.tp_status === "PENDENTE" && (diasRestantes === null || diasRestantes <= 7)) alertas++;

        return {
          cd_fatura: f.cd_fatura || f.id,
          cd_empresa: f.cd_empresa,
          nm_empresa: empresa?.nm_fantasia || "—",
          vl_fatura: f.vl_fatura,
          tp_status: f.tp_status,
          dt_vencimento: f.dt_vencimento,
          ts_criacao: f.ts_criacao || f.created_at,
          ds_plano: f.ds_plano || "Padrão",
        };
      });

      setFaturas(faturasFormatadas);
      setFaturasAlerta(alertas);
    }
  };

  const getStatusFaturaBadge = (f: Fatura) => {
    const vencimento = f.dt_vencimento ? new Date(f.dt_vencimento) : null;
    const hoje = new Date();
    const diasRestantes = vencimento ? Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const quaseVencendo = f.tp_status === "PENDENTE" && diasRestantes !== null && diasRestantes <= 7 && diasRestantes > 0;
    const vencida = f.tp_status === "PENDENTE" && diasRestantes !== null && diasRestantes <= 0;

    if (f.tp_status === "PAGA") return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-2.5 py-1 rounded-full"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>Paga</span>;
    if (vencida || f.tp_status === "VENCIDA") return <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-xs font-black px-2.5 py-1 rounded-full"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>Vencida</span>;
    if (quaseVencendo) return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-black px-2.5 py-1 rounded-full animate-pulse"><span className="material-symbols-outlined text-[12px]">warning</span>Vence em {diasRestantes}d</span>;
    if (f.tp_status === "PENDENTE") return <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200 text-xs font-black px-2.5 py-1 rounded-full"><span className="material-symbols-outlined text-[12px]">pending</span>Pendente</span>;
    return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-black px-2.5 py-1 rounded-full">{f.tp_status}</span>;
  };

  const formatarData = (data?: string) => {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar onLogout={async () => { await supabase.auth.signOut(); router.push("/login"); }} />

      <main className="flex-1 overflow-y-auto flex flex-col h-full relative">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm px-8 py-6 border-b border-slate-200 shadow-sm sticky top-0 z-10 w-full flex items-center gap-4 shrink-0">
          <div className="size-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>manage_accounts</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-[#064384] tracking-tight">Gestão de Usuários</h2>
            <p className="text-sm font-bold text-slate-500">Controle de acesso e cobranças do sistema</p>
          </div>
          {faturasAlerta > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-black">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              {faturasAlerta} fatura(s) requer(em) atenção
            </div>
          )}
        </header>

        <div className="p-8 max-w-[1400px] mx-auto w-full space-y-6 flex-1">
          {/* Tabs principais */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
            {([["usuarios", "people", "Usuários"], ["cobrancas", "receipt_long", "Cobranças"]] as [Tab, string, string][]).map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${tab === id ? "bg-white text-[#064384] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                {label}
                {id === "cobrancas" && faturasAlerta > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{faturasAlerta}</span>
                )}
              </button>
            ))}
          </div>

          {/* === ABA: USUÁRIOS === */}
          {tab === "usuarios" && (
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSubTab("consultores")}
                  className={`text-sm font-black px-4 py-2 rounded-lg transition-all ${subTab === "consultores" ? "bg-[#064384] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                >
                  Consultores ({consultores.length})
                </button>
                <button
                  onClick={() => setSubTab("clientes")}
                  className={`text-sm font-black px-4 py-2 rounded-lg transition-all ${subTab === "clientes" ? "bg-[#064384] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                >
                  Clientes / Portal ({clientes.length})
                </button>
              </div>

              {/* Tabela Consultores */}
              {subTab === "consultores" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800">Consultores do Sistema</h3>
                    <button
                      onClick={() => router.push("/consultores/novo")}
                      className="flex items-center gap-2 bg-[#064384] hover:bg-blue-900 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Novo Consultor
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Nome</th>
                          <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Cargo / Função</th>
                          <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">E-mail</th>
                          <th className="text-center px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Permissão</th>
                          <th className="text-center px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                          <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Cadastro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultores.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm font-medium">Nenhum consultor cadastrado.</td></tr>
                        ) : (
                          consultores.map((c) => (
                            <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[#064384]/10 text-[#064384] flex items-center justify-center font-black text-sm">
                                    {(c.nm_completo || "?").substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-sm text-slate-800">{c.nm_completo}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 font-medium">{c.ds_cargo}</td>
                              <td className="px-6 py-4 text-sm text-slate-500">{c.ds_email}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="bg-[#064384]/10 text-[#064384] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Admin</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${(c.sn_ativo ?? true) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                  {(c.sn_ativo ?? true) ? "Ativo" : "Inativo"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-400 font-medium">{formatarData(c.ts_criacao)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabela Clientes */}
              {subTab === "clientes" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800">Usuários do Portal Cliente</h3>
                    <button
                      onClick={() => router.push("/clientes")}
                      className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Gerenciar em Clientes
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Nome</th>
                          <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">E-mail</th>
                          <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Empresa</th>
                          <th className="text-center px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Permissão</th>
                          <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Cadastro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientes.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm font-medium">Nenhum acesso de cliente gerado ainda.</td></tr>
                        ) : (
                          clientes.map((c) => (
                            <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[#FF8323]/10 text-[#FF8323] flex items-center justify-center font-black text-sm">
                                    {(c.nm_usuario || "?").substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-sm text-slate-800">{c.nm_usuario}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">{c.ds_email}</td>
                              <td className="px-6 py-4 text-sm text-slate-600 font-medium">{c.nm_empresa}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="bg-orange-50 text-[#FF8323] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Cliente</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-400 font-medium">{formatarData(c.ts_criacao)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === ABA: COBRANÇAS === */}
          {tab === "cobrancas" && (
            <div className="space-y-4">
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Faturado", valor: formatarValor(faturas.filter(f => f.tp_status === "PAGA").reduce((s, f) => s + f.vl_fatura, 0)), icon: "payments", cor: "text-emerald-600 bg-emerald-50" },
                  { label: "Pendentes", valor: formatarValor(faturas.filter(f => f.tp_status === "PENDENTE").reduce((s, f) => s + f.vl_fatura, 0)), icon: "pending", cor: "text-orange-600 bg-orange-50" },
                  { label: "Qtd. Pagas", valor: `${faturas.filter(f => f.tp_status === "PAGA").length}`, icon: "check_circle", cor: "text-blue-600 bg-blue-50" },
                  { label: "Qtd. Pendentes", valor: `${faturas.filter(f => f.tp_status === "PENDENTE").length}`, icon: "schedule", cor: "text-amber-600 bg-amber-50" },
                ].map((card) => (
                  <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.cor}`}>
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                      <p className="text-xl font-black text-slate-800">{card.valor}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela de faturas */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-black text-slate-800">Histórico de Cobranças</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Todas as faturas registradas no sistema</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Empresa</th>
                        <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Plano</th>
                        <th className="text-right px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Valor</th>
                        <th className="text-center px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Vencimento</th>
                        <th className="text-center px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Emissão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faturas.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm font-medium">Nenhuma fatura registrada.</td></tr>
                      ) : (
                        faturas.map((f) => (
                          <tr key={f.cd_fatura} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-sm text-slate-800">{f.nm_empresa}</td>
                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{f.ds_plano}</td>
                            <td className="px-6 py-4 text-right font-black text-slate-800">{formatarValor(f.vl_fatura)}</td>
                            <td className="px-6 py-4 text-center text-sm text-slate-500">{formatarData(f.dt_vencimento)}</td>
                            <td className="px-6 py-4 text-center">{getStatusFaturaBadge(f)}</td>
                            <td className="px-6 py-4 text-sm text-slate-400">{formatarData(f.ts_criacao)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
