"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Redireciona para a tela de criar nova senha
        redirectTo: `${window.location.origin}/nova-senha`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      setErrorMsg(error.message || "Ocorreu um erro ao enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-10">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-orange-50 text-[#FF8323] rounded-2xl flex items-center justify-center border border-orange-100">
            <span className="material-symbols-outlined text-3xl">
              lock_reset
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-center text-[#064384] tracking-tight mb-2">
          Recuperar Senha
        </h2>

        {success ? (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <p className="text-slate-600 font-medium mb-6">
              Enviamos um link de recuperação para{" "}
              <strong className="text-slate-800">{email}</strong>. Verifique sua
              caixa de entrada (e o spam).
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all"
            >
              Voltar para o Login
            </button>
          </div>
        ) : (
          <>
            <p className="text-center text-slate-500 font-medium mb-8 text-sm">
              Digite seu e-mail cadastrado e enviaremos um link para você criar
              uma nova senha.
            </p>

            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[18px]">
                  error
                </span>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  E-mail
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:bg-white focus:border-[#064384] focus:ring-4 focus:ring-[#064384]/10 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#064384] hover:bg-blue-900 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    sync
                  </span>
                ) : (
                  "Enviar Link"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => router.push("/login")}
                className="text-sm font-bold text-slate-400 hover:text-[#064384] transition-colors"
              >
                Lembrou a senha? Voltar ao login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
