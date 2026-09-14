"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Assinatura {
  tp_status: string;
  ds_plano: string;
  dt_vencimento: string | null;
}

export default function AssinaturaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [consultor, setConsultor] = useState<{ id: string; nome: string; email: string } | null>(null);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);

  useEffect(() => {
    const carregar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: consultorData } = await supabase
        .from("CONSULTORES")
        .select("cd_consultor, nm_completo, ds_email")
        .eq("cd_auth_supabase", session.user.id)
        .maybeSingle();

      if (!consultorData) {
        setLoading(false);
        return;
      }

      setConsultor({
        id: consultorData.cd_consultor,
        nome: consultorData.nm_completo,
        email: consultorData.ds_email,
      });

      const { data: assinaturaData } = await supabase
        .from("ASSINATURAS")
        .select("tp_status, ds_plano, dt_vencimento")
        .eq("cd_consultor", consultorData.cd_consultor)
        .maybeSingle();

      setAssinatura(assinaturaData);
      setLoading(false);
    };

    carregar();
  }, [router]);

  const handleAssinar = async (plano: "MENSAL" | "ANUAL") => {
    if (!consultor) return;
    setEnviando(true);
    setErro("");

    try {
      const res = await fetch("/api/assinatura/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cdConsultor: consultor.id,
          email: consultor.email,
          plano,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.initPoint) {
        setErro(data.error || "Erro ao iniciar assinatura.");
        setEnviando(false);
        return;
      }

      window.location.href = data.initPoint;
    } catch {
      setErro("Erro de conexão ao iniciar assinatura.");
      setEnviando(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center flex-col gap-4 text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando...</span>
      </div>
    );
  }

  const statusAtivo = assinatura?.tp_status === "ATIVA" || assinatura?.tp_status === "TRIAL";

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-background-light font-display text-text-main antialiased">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <TopBar />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 scrollbar-hide">
          <section>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4">
              Assinatura
            </h3>

            {statusAtivo && (
              <div className="mb-6 rounded-2xl bg-green-50 border border-green-100 p-5 flex items-center gap-4">
                <span className="material-symbols-outlined text-green-600 text-3xl">
                  check_circle
                </span>
                <div>
                  <p className="font-bold text-green-800">
                    Assinatura {assinatura?.tp_status === "TRIAL" ? "em período de teste" : "ativa"} — Plano{" "}
                    {assinatura?.ds_plano === "ANUAL" ? "Anual" : "Mensal"}
                  </p>
                  {assinatura?.dt_vencimento && (
                    <p className="text-sm text-green-700">
                      Próximo vencimento: {new Date(assinatura.dt_vencimento).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {erro && (
              <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm font-bold text-red-700">
                {erro}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <h4 className="font-black text-slate-800 text-lg mb-1">Mensal</h4>
                <p className="text-3xl font-black text-primary mb-4">
                  R$ 97<span className="text-sm text-slate-400 font-bold">/mês</span>
                </p>
                <button
                  onClick={() => handleAssinar("MENSAL")}
                  disabled={enviando}
                  className="w-full rounded-xl bg-primary text-white font-bold py-3 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {enviando ? "Processando..." : "Assinar Mensal"}
                </button>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm border-2 border-accent relative">
                <span className="absolute -top-3 right-4 bg-accent text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
                  Economize
                </span>
                <h4 className="font-black text-slate-800 text-lg mb-1">Anual</h4>
                <p className="text-3xl font-black text-primary mb-4">
                  R$ 970<span className="text-sm text-slate-400 font-bold">/ano</span>
                </p>
                <button
                  onClick={() => handleAssinar("ANUAL")}
                  disabled={enviando}
                  className="w-full rounded-xl bg-accent text-white font-bold py-3 hover:bg-accent/90 transition-all disabled:opacity-50"
                >
                  {enviando ? "Processando..." : "Assinar Anual"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
