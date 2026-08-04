"use client";

import Link from "next/link";
import { useState } from "react";

export default function SolicitarAcessoPage() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    empresa: "",
    cargo: "",
    telefone: "",
    mensagem: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");

    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Falha no envio");

      setEnviado(true);
    } catch (error) {
      console.error("Erro ao enviar solicitação de acesso:", error);
      setErro(
        "Não foi possível enviar sua solicitação agora. Tente novamente em instantes.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-7 text-white flex items-center justify-center bg-[#064384] rounded-lg shrink-0">
                <span className="material-symbols-outlined text-[18px]">diversity_3</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[#064384]">RESPONSA</span>
            </Link>
            <Link href="/login" className="text-sm font-bold text-[#064384] hover:underline">
              Já tenho uma conta
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {enviado ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[48px] text-green-500">check_circle</span>
              </div>
              <h2 className="text-2xl font-black text-[#064384] mb-3">Solicitação Enviada!</h2>
              <p className="text-slate-600 font-medium mb-6">
                Recebemos sua solicitação de acesso. Nossa equipe entrará em contato em breve para finalizar o seu cadastro e liberar o acesso à plataforma.
              </p>
              <p className="text-sm text-slate-400 mb-8">
                Prazo médio de resposta: <strong>até 24 horas úteis</strong>
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-[#064384] text-white font-bold hover:bg-blue-900 transition-all"
              >
                <span className="material-symbols-outlined mr-2 text-[18px]">home</span>
                Voltar para o início
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12">
              <div className="mb-8">
                <span className="text-xs font-bold text-[#FF8323] uppercase tracking-widest">Acesso à Plataforma</span>
                <h1 className="text-3xl font-black text-[#064384] mt-2 mb-3">Solicite seu Acesso</h1>
                <p className="text-slate-500 font-medium">
                  Preencha o formulário abaixo e nossa equipe entrará em contato para liberar o acesso à sua conta de consultor(a).
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-8">
                <span className="material-symbols-outlined text-[#064384] text-[20px] mt-0.5 shrink-0">info</span>
                <p className="text-sm text-[#064384] font-medium">
                  Você terá <strong>14 dias de acesso gratuito</strong> para explorar todas as ferramentas sem necessidade de cartão de crédito.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700" htmlFor="nome">
                      Nome Completo *
                    </label>
                    <input
                      id="nome"
                      name="nome"
                      type="text"
                      required
                      placeholder="Seu nome completo"
                      value={form.nome}
                      onChange={handleChange}
                      className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700" htmlFor="email">
                      E-mail Profissional *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="nome@empresa.com.br"
                      value={form.email}
                      onChange={handleChange}
                      className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700" htmlFor="empresa">
                      Empresa / Consultoria
                    </label>
                    <input
                      id="empresa"
                      name="empresa"
                      type="text"
                      placeholder="Nome da sua empresa"
                      value={form.empresa}
                      onChange={handleChange}
                      className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700" htmlFor="telefone">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      id="telefone"
                      name="telefone"
                      type="tel"
                      required
                      placeholder="(00) 00000-0000"
                      value={form.telefone}
                      onChange={handleChange}
                      className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700" htmlFor="cargo">
                    Cargo / Função
                  </label>
                  <select
                    id="cargo"
                    name="cargo"
                    value={form.cargo}
                    onChange={handleChange}
                    className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none transition-all text-sm font-medium"
                  >
                    <option value="">Selecione seu cargo...</option>
                    <option value="consultor_rh">Consultor(a) de RH</option>
                    <option value="consultor_independente">Consultor(a) Independente</option>
                    <option value="gestor_rh">Gestor(a) de RH</option>
                    <option value="psicólogo">Psicólogo(a) Organizacional</option>
                    <option value="coach">Coach / Mentora</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700" htmlFor="mensagem">
                    Como pretende usar a plataforma?
                  </label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    rows={3}
                    placeholder="Descreva brevemente seu uso pretendido..."
                    value={form.mensagem}
                    onChange={handleChange}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-[#064384] focus:ring-1 focus:ring-[#064384] outline-none transition-all text-sm font-medium resize-none"
                  />
                </div>

                {erro && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                    <span className="material-symbols-outlined text-[18px]">
                      error
                    </span>
                    {erro}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full h-14 bg-[#FF8323] hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 text-base active:scale-95 disabled:opacity-70"
                >
                  {enviando ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  )}
                  {enviando ? "Enviando..." : "Solicitar Acesso Gratuito"}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Ao enviar, você concorda com nossos{" "}
                  <Link href="/termos-de-uso" className="text-[#064384] hover:underline">Termos de Uso</Link>{" "}
                  e{" "}
                  <Link href="/privacidade" className="text-[#064384] hover:underline">Política de Privacidade</Link>.
                </p>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
