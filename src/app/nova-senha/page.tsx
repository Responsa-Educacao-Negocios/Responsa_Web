"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NovaSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Opcional: Verificar se o usuário realmente tem uma sessão válida de recuperação
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Se ele tentar acessar essa tela sem vir do link do email, manda pro login
        router.push("/login");
      }
    });
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("A nova senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      // Como o link do e-mail já iniciou a sessão, basta atualizar os dados do usuário
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      alert("Senha alterada com sucesso!");

      // Desloga o usuário e manda para o login para ele entrar com a senha nova
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error: any) {
      setErrorMsg(error.message || "Ocorreu um erro ao atualizar a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-10">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-blue-50 text-[#064384] rounded-2xl flex items-center justify-center border border-blue-100">
            <span className="material-symbols-outlined text-3xl">key</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-center text-[#064384] tracking-tight mb-2">
          Criar Nova Senha
        </h2>
        <p className="text-center text-slate-500 font-medium mb-8 text-sm">
          Digite sua nova senha abaixo para acessar sua conta.
        </p>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Nova Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:bg-white focus:border-[#064384] focus:ring-4 focus:ring-[#064384]/10 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                lock_reset
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:bg-white focus:border-[#064384] focus:ring-4 focus:ring-[#064384]/10 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-[#FF8323] hover:bg-orange-600 text-white font-black py-3.5 rounded-xl shadow-lg shadow-orange-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 uppercase tracking-wider text-sm disabled:opacity-70"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">
                sync
              </span>
            ) : (
              "Salvar e Entrar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
