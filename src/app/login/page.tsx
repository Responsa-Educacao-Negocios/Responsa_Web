"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
// Importe o supabase do caminho onde você salvou a configuração:
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Novos estados para lidar com a requisição
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Tenta fazer o login no cofre do Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw new Error("E-mail ou senha incorretos.");
      }

      if (authData.user) {
        const userId = authData.user.id;

        // 2. Tenta achar na tabela de CONSULTORES (usando maybeSingle)
        const { data: consultor } = await supabase
          .from("CONSULTORES")
          .select("cd_consultor")
          .eq("cd_auth_supabase", userId)
          .maybeSingle(); // <-- MUDANÇA AQUI

        if (consultor) {
          router.push("/dashboard"); // É um Consultor, vai pro Admin!
          return;
        }

        // 3. Tenta achar na tabela de USUARIOS_CLIENTE (usando maybeSingle)
        const { data: cliente } = await supabase
          .from("USUARIOS_CLIENTE")
          .select("cd_empresa")
          .eq("cd_auth_supabase", userId)
          .maybeSingle(); // <-- MUDANÇA AQUI TAMBÉM

        if (cliente) {
          router.push("/portal"); // É um Cliente, vai pro Portal do Cliente!
          return;
        }

        // Se logou no Supabase mas não está em nenhuma das duas tabelas (Orfão)
        throw new Error("Usuário sem permissões de acesso configuradas.");
      }
    } catch (err: any) {
      await supabase.auth.signOut();
      setError(err.message || "Ocorreu um erro ao tentar fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light text-text-main antialiased h-screen overflow-hidden flex w-full">
      {/* LADO ESQUERDO - BRANDING (Oculto em telas pequenas) */}
      <div className="hidden lg:flex w-[40%] bg-primary relative flex-col justify-between p-12 overflow-hidden">
        {/* Efeitos de Fundo */}
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at top right, #3b82f6, transparent 60%)",
          }}
        ></div>
        <div
          className="absolute inset-0 z-0 mix-blend-overlay opacity-30 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop')",
          }}
        ></div>

        {/* Logo Superior */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded bg-white text-primary">
            <span className="material-symbols-outlined text-2xl">
              health_metrics
            </span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">
            RESPONSA
          </span>
        </div>

        {/* Texto Central */}
        <div className="relative z-10 max-w-md">
          <div className="mb-6">
            <span className="material-symbols-outlined text-secondary text-5xl opacity-80">
              format_quote
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Investindo no maior ativo da sua organização: as pessoas.
          </h2>
          <p className="text-blue-100 text-lg font-light">
            Gerencie a saúde organizacional e potencialize talentos com
            inteligência de dados.
          </p>
        </div>

        {/* Rodapé do Branding */}
        <div className="relative z-10">
          <p className="text-blue-200 text-sm">
            © 2026 RESPONSA Consultoria. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* LADO DIREITO - FORMULÁRIO */}
      <div className="w-full lg:w-[60%] flex flex-col items-center justify-center bg-white px-6 py-12 lg:px-24 overflow-y-auto">
        <div className="w-full max-w-[480px] flex flex-col gap-8">
          {/* Logo Mobile (Aparece só em telas menores) */}
          <div className="lg:hidden flex items-center gap-2 mb-4 self-center">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl">
                health_metrics
              </span>
            </div>
            <span className="text-text-main font-bold text-lg">RESPONSA</span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-text-main text-3xl font-bold tracking-tight">
              Acesse sua conta
            </h1>
            <p className="text-text-sub font-normal">
              Bem-vindo de volta! Por favor, insira seus dados para continuar.
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            {/* Mensagem de Erro (Aparece apenas se houver erro) */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Input E-mail */}
            <div className="flex flex-col gap-2">
              <label
                className="text-text-main text-sm font-medium"
                htmlFor="email"
              >
                E-mail corporativo
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 text-text-main placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  required
                />
                <span className="absolute right-4 top-3 text-slate-400 pointer-events-none">
                  <span className="material-symbols-outlined text-[20px]">
                    mail
                  </span>
                </span>
              </div>
            </div>

            {/* Input Senha */}
            <div className="flex flex-col gap-2">
              <label
                className="text-text-main text-sm font-medium"
                htmlFor="password"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 pr-12 text-text-main placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/esqueci-minha-senha"
                className="text-sm font-medium text-primary hover:text-blue-800 hover:underline transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-secondary hover:bg-[#e57015] text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin mr-2">
                  progress_activity
                </span>
              ) : null}
              {loading ? "Entrando..." : "Entrar"}
              {!loading && (
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-text-sub text-sm">
              Ainda não tem uma conta?{" "}
              <Link
                href="/solicitar-acesso"
                className="font-semibold text-primary hover:underline"
              >
                Solicite acesso à sua consultoria
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
