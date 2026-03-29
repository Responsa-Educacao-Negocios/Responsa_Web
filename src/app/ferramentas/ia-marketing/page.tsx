"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LeadIA {
  id: string;
  created_at: string;
  nm_empresa: string;
  nr_score_geral: number;
  ds_nivel_maturidade: string;
}

export default function DashboardIAPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadIA[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Busca os leads que responderam a pesquisa
      const { data } = await supabase
        .from("DIAGNOSTICO_IA_MARKETING")
        .select(
          "id, created_at, nm_empresa, nr_score_geral, ds_nivel_maturidade",
        )
        .order("created_at", { ascending: false });

      if (data) setLeads(data);
      setLoading(false);
    };

    carregarDados();
  }, [router]);

  const copiarLink = () => {
    // Pegando a URL atual e trocando para a rota da pesquisa pública
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "";
    const linkPublico = `${origin}/pesquisa/ia`;
    navigator.clipboard.writeText(linkPublico);
    alert("Link público copiado! Envie para seus clientes: " + linkPublico);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4 text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      <Sidebar
        onLogout={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#FF8323]">
              smart_toy
            </span>
            <h2 className="text-xl font-black text-[#064384] tracking-tight">
              Leads: Maturidade em IA
            </h2>
          </div>
          <button
            onClick={copiarLink}
            className="flex items-center gap-2 bg-[#FF8323] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              content_copy
            </span>
            Copiar Link Público
          </button>
        </header>

        {/* CONTEÚDO (LISTA DE RESULTADOS) */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Data
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Empresa / Lead
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500 text-center">
                    Score Geral
                  </th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Maturidade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-500 font-medium"
                    >
                      Nenhum diagnóstico respondido ainda. Compartilhe o link!
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-sm font-medium text-slate-500">
                        {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {lead.nm_empresa}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block bg-blue-50 text-[#064384] font-black px-3 py-1 rounded-lg">
                          {lead.nr_score_geral}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${
                            lead.nr_score_geral <= 25
                              ? "bg-slate-100 text-slate-600"
                              : lead.nr_score_geral <= 50
                                ? "bg-orange-50 text-orange-600"
                                : lead.nr_score_geral <= 75
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {lead.ds_nivel_maturidade}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
