"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CadastrarConsultorPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    nm_consultor: "",
    ds_email: "",
    ds_senha: "",
    nr_telefone: "",
    ds_especialidade: "Recrutamento e Seleção",
    tp_senioridade: "Pleno",
    sn_ativo: true,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (formData.ds_senha.length < 6) {
      alert("A senha temporária deve ter pelo menos 6 caracteres.");
      setIsSaving(false);
      return;
    }

    try {
      // 1. Cria o utilizador no sistema de Autenticação do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.ds_email,
        password: formData.ds_senha,
      });

      if (authError) throw authError;

      // 2. Salva os dados completos na sua tabela de CONSULTORES
      const { error: dbError } = await supabase.from("CONSULTORES").insert([
        {
          nm_consultor: formData.nm_consultor,
          ds_email: formData.ds_email,
          nr_telefone: formData.nr_telefone,
          ds_especialidade: formData.ds_especialidade,
          tp_senioridade: formData.tp_senioridade,
          sn_ativo: formData.sn_ativo,
        },
      ]);

      if (dbError) throw dbError;

      alert(`Consultor criado! Envie a senha: ${formData.ds_senha} para ele.`);
      router.push("/consultores");
    } catch (error: any) {
      console.error("Erro ao guardar consultor:", error);
      alert(error.message || "Ocorreu um erro ao registar o consultor.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-20">
      {/* HEADER FIXO */}
      <header className="bg-white/95 backdrop-blur-sm px-8 py-5 flex items-center justify-between border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-[#064384] transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div>
            <h1 className="text-xl font-black text-[#064384] uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF8323]">
                person_add
              </span>
              Novo Consultor
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Registe um novo membro para a equipa de consultoria
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.nm_consultor || !formData.ds_email}
            className="flex items-center gap-2 bg-[#064384] hover:bg-blue-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  sync
                </span>
                A Guardar...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                Guardar Registo
              </>
            )}
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-[800px] mx-auto w-full px-6 py-10">
        <form id="form-consultor" onSubmit={handleSave} className="space-y-8">
          {/* BLOCO 1: DADOS PESSOAIS */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-[#064384] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">
                  badge
                </span>
              </div>
              <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                Dados Pessoais e Contacto
              </h2>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nome Completo *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: João Miguel Silva"
                  value={formData.nm_consultor}
                  onChange={(e) =>
                    setFormData({ ...formData, nm_consultor: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#064384] focus:ring-4 focus:ring-[#064384]/10 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    E-mail Profissional *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="joao.silva@coreconsulta.com"
                    value={formData.ds_email}
                    onChange={(e) =>
                      setFormData({ ...formData, ds_email: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#064384] focus:ring-4 focus:ring-[#064384]/10 outline-none transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Senha Temporária de Acesso *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Consultor@2026"
                    value={formData.ds_senha}
                    onChange={(e) =>
                      setFormData({ ...formData, ds_senha: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#064384] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Telemóvel / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.nr_telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, nr_telefone: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#064384] focus:ring-4 focus:ring-[#064384]/10 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* BLOCO 2: DADOS PROFISSIONAIS */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-100 text-[#FF8323] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">
                  work
                </span>
              </div>
              <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                Perfil e Atuação
              </h2>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Especialidade Principal
                </label>
                <div className="relative">
                  <select
                    value={formData.ds_especialidade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ds_especialidade: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 appearance-none focus:bg-white focus:border-[#064384] focus:ring-4 focus:ring-[#064384]/10 outline-none transition-all font-bold cursor-pointer"
                  >
                    <option value="Recrutamento e Seleção">
                      Recrutamento e Seleção
                    </option>
                    <option value="Cargos e Salários">Cargos e Salários</option>
                    <option value="Treinamento e Desenvolvimento">
                      Treinamento e Desenvolvimento
                    </option>
                    <option value="Clima Organizacional">
                      Clima Organizacional
                    </option>
                    <option value="Gestão de Desempenho">
                      Gestão de Desempenho
                    </option>
                    <option value="Generalista (Business Partner)">
                      Generalista (Business Partner)
                    </option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nível de Senioridade
                </label>
                <div className="relative">
                  <select
                    value={formData.tp_senioridade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tp_senioridade: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 appearance-none focus:bg-white focus:border-[#064384] focus:ring-4 focus:ring-[#064384]/10 outline-none transition-all font-bold cursor-pointer"
                  >
                    <option value="Júnior">Júnior</option>
                    <option value="Pleno">Pleno</option>
                    <option value="Sênior">Sênior</option>
                    <option value="Especialista">Especialista</option>
                    <option value="Sócio / Diretor">Sócio / Diretor</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* BLOCO 3: CONFIGURAÇÕES DE ACESSO */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-1">
                  Status do Consultor
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Determine se este consultor está ativo para ser alocado em
                  novos projetos.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.sn_ativo}
                  onChange={(e) =>
                    setFormData({ ...formData, sn_ativo: e.target.checked })
                  }
                />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                <span
                  className={`ml-3 text-sm font-bold ${formData.sn_ativo ? "text-green-600" : "text-slate-400"}`}
                >
                  {formData.sn_ativo ? "Conta Ativa" : "Inativo"}
                </span>
              </label>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
