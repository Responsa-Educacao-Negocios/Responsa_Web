"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TEXTO_PADRAO = `Este Regulamento Interno faz parte integrante do Contrato Individual de Trabalho de todos os funcionários da Empresa {{EMPRESA}}, sendo obrigatório o seu cumprimento, sendo este de pleno conhecimento de todos.

I – UNIFORMES
1. É absolutamente indispensável o uso de uniforme completo por parte dos funcionários no interior da empresa, sendo certo que este deve se encontrar em perfeitas condições e que no caso de extravio ou de qualquer dano que tal vestimenta vier a sofrer, por culpa do funcionário, que estiver na posse da mesma ou na posse de pessoas que estejam sob sua responsabilidade, este deverá ressarcir sua empregadora.
2. Não será permitido cumprimento da Jornada de Trabalho sem o devido uniforme nas condições descritas no item 1, isto é, completo e em perfeitas condições.

II - DO HORÁRIO
1. Os horários estabelecidos pelo líder coordenador, inclusive para almoço e lanche, deverão ser estritamente observados, sob pena de descontos dos salários na razão do tempo de trabalho perdido;
2. Os funcionários deverão se apresentar para o trabalho no horário previsto e contratado;
3. O registro nos controles de freqüência serão feitos por meio de livro de ponto ou papeletas externas, sendo os funcionários obrigados a marcarem cautelosamente nos mesmos as próprias entradas e saídas, observando o dia correspondente e os locais destinados para entrada e saída, a fim de evitar registros errados;
4. Pelos controles de frequência serão verificadas as presenças, faltas e atrasos; e pelos mesmos serão procedidos os descontos nos salários;
5. A falta de marcação do controle indicado implicará na prova de ausência, independente de qualquer outra prova;
6. Não será permitido a entrada de funcionários para o expediente de trabalho, após o horário de inicio da jornada, salvo se comunicado anteriormente pelo responsável;
7. As reincidências de ausências, ou atrasos ao serviço, sem causa justificada, constituem motivo passível de dispensa da rescisão do Contrato de Trabalho por justa causa;
8. As saídas antecipadas somente serão permitidas pelo líder imediato, com a devida autorização.

III - DAS FALTAS JUSTIFICADAS
1. Só serão aceitos atestados médicos fornecidos por hospitais públicos ou postos de saúde ou por médicos particulares;
2. A Empresa se reserva o direito de verificar a veracidade das justificações por faltas ao serviço.
Parágrafo único: Não serão aceitos atestados rasurados.

IV - HIGIENE E DISCIPLINA
Todos os empregados devem cooperar com a Empresa a fim de ser mantido um ambiente limpo e higiênico. Todos devem apresentar-se ao trabalho em condições convenientes de higiene pessoal e uniforme limpo.

V - DISPOSIÇÕES GERAIS E PROIBIÇÕES
Para a boa disciplina interna e funcional é proibido:
- Usar telefone celular próprio durante o horário de trabalho para fins pessoais;
- Utilizar internet e e-mail da Empresa para fins estranhos ao interesse da mesma;
- Destratar clientes ou colegas com palavras ásperas ou ofensivas;
- Consumir bebidas alcoólicas ou utilizar substâncias entorpecentes em serviço;
- Praticar concorrência desleal ou agiotagem dentro da empresa;
- Violar segredos da empresa ou informações sigilosas da função.

VI - PENALIDADES
O não cumprimento das regras sujeitará o infrator às penalidades:
1° Advertência verbal; 2° Advertência por escrito; 3° Suspensão; 4º Demissão por justa causa.

VII - DA PROMOÇÃO
O funcionário que demonstrar interesse, assiduidade e capacidade de produção terá preferência às promoções, observando o índice de produção individual e colaboração com a gestão.`;

export default function RegulamentoInternoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [registroId, setRegistroId] = useState<string | null>(null);

  // Controle para recolher as configurações no telemóvel e não ocupar muito ecrã
  const [showConfigMobile, setShowConfigMobile] = useState(false);

  const [form, setForm] = useState({
    empresa: "",
    cnpj: "",
    cidade: "",
    uf: "",
    regrasAdicionais: "",
    conteudoCompleto: TEXTO_PADRAO,
  });

  useEffect(() => {
    const carregarDados = async () => {
      const { data: regData } = await supabase
        .from("REGULAMENTOS_INTERNOS")
        .select("*")
        .eq("cd_projeto", params.id)
        .maybeSingle();
      if (regData) {
        setRegistroId(regData.cd_regulamento);
        setForm({
          empresa: regData.nm_empresa_documento || "",
          cnpj: regData.nr_cnpj_documento || "",
          cidade: regData.nm_cidade_foro || "",
          uf: regData.sg_uf_foro || "",
          regrasAdicionais: regData.ds_regras_adicionais || "",
          conteudoCompleto: regData.ds_conteudo_completo || TEXTO_PADRAO,
        });
      } else {
        const { data: projData } = await supabase
          .from("PROJETOS")
          .select("EMPRESAS(nm_fantasia, nr_cnpj)")
          .eq("cd_projeto", params.id)
          .single();
        if (projData && projData.EMPRESAS) {
          const emp = Array.isArray(projData.EMPRESAS)
            ? projData.EMPRESAS[0]
            : projData.EMPRESAS;
          setForm((prev) => ({
            ...prev,
            empresa: emp.nm_fantasia || "",
            cnpj: emp.nr_cnpj || "",
          }));
        }
      }
      setLoading(false);
    };
    carregarDados();
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      cd_projeto: params.id,
      nm_empresa_documento: form.empresa,
      nr_cnpj_documento: form.cnpj,
      nm_cidade_foro: form.cidade,
      sg_uf_foro: form.uf,
      ds_regras_adicionais: form.regrasAdicionais,
      ds_conteudo_completo: form.conteudoCompleto,
      js_variaveis_template: {},
    };
    try {
      if (registroId)
        await supabase
          .from("REGULAMENTOS_INTERNOS")
          .update(payload)
          .eq("cd_regulamento", registroId);
      else {
        const { data } = await supabase
          .from("REGULAMENTOS_INTERNOS")
          .insert([payload])
          .select()
          .single();
        if (data) setRegistroId(data.cd_regulamento);
      }
      alert("Salvo com sucesso!");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const varEmpresa = form.empresa
    ? form.empresa.toUpperCase()
    : "NOME DA EMPRESA";
  const varCnpj = form.cnpj ? form.cnpj : "00.000.000/0000-00";
  const varCidade = form.cidade ? form.cidade : "CIDADE";
  const varUf = form.uf ? form.uf.toUpperCase() : "UF";

  const renderizarTextoHTML = (texto: string) => {
    return texto
      .replace(/{{EMPRESA}}/g, `<strong>${varEmpresa}</strong>`)
      .split("\n")
      .map((linha, i) => {
        if (linha.trim() === "") return `<br key=${i}/>`;
        if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\s*[–-]/i.test(linha.trim())) {
          return `<h3 class="font-bold text-base mt-6 mb-2 uppercase">${linha}</h3>`;
        }
        return `<p class="mb-2 text-sm text-justify leading-relaxed">${linha}</p>`;
      })
      .join("");
  };

  const handlePrint = () => {
    const textoHTML = renderizarTextoHTML(form.conteudoCompleto);
    const adicionalHTML = form.regrasAdicionais
      ? `<h3 class="font-bold text-base mt-6 mb-2 uppercase">VIII - DISPOSIÇÕES ESPECIAIS</h3><p class="text-sm text-justify leading-relaxed whitespace-pre-line">${form.regrasAdicionais}</p>`
      : "";

    const janela = window.open("", "", "width=900,height=900");
    if (!janela) return;
    janela.document.write(`
      <html>
        <head>
          <title>Impressão Regulamento</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>@media print { @page { margin: 20mm; } .page-break { page-break-before: always; } }</style>
        </head>
        <body class="bg-white p-10 font-sans text-slate-800">
          <div class="text-center mb-10"><h1 class="text-xl font-bold uppercase underline">Regulamento Interno de Trabalho</h1><h2 class="text-lg font-bold mt-2">${varEmpresa}</h2></div>
          <div class="space-y-4">${textoHTML} ${adicionalHTML}</div>
          
          <div class="mt-20 pt-10 border-t-2 border-dashed border-slate-300 page-break">
            <h2 class="text-xl font-bold text-center mb-10 uppercase">TERMO DE PRORROGAÇÃO DE CONTRATO DE TRABALHO</h2>
            <p class="mb-8 text-justify leading-loose">O presente termo corresponde a prorrogação do contrato de experiência celebrado entre <strong>${varEmpresa}</strong>, CNPJ <strong>${varCnpj}</strong> e o EMPREGADO (nome, endereço, CTPS, série), pelo período de ___________ a ___________ e por este fica prorrogado até ___________.</p>
            <p class="mb-12 text-justify leading-loose">Com este termo, ficam mantidas as cláusulas do contrato principal, bem como as do regulamento em anexo ao mesmo.</p>
            <p class="text-right mb-20">${varCidade} - ${varUf}, ______ de _________________ de ________</p>
            <div class="grid grid-cols-2 gap-16 text-center">
              <div><div class="border-t border-black w-64 mx-auto mb-1"></div><p class="font-bold text-sm">${varEmpresa}</p><p class="text-[10px] uppercase">Empregador</p></div>
              <div><div class="border-t border-black w-64 mx-auto mb-1"></div><p class="font-bold text-sm">______________________________</p><p class="text-[10px] uppercase">Empregado</p></div>
              <div class="mt-10"><div class="border-t border-black w-64 mx-auto mb-1"></div><p class="text-[10px] uppercase">Testemunha 1</p></div>
              <div class="mt-10"><div class="border-t border-black w-64 mx-auto mb-1"></div><p class="text-[10px] uppercase">Testemunha 2</p></div>
            </div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 700);</script>
        </body>
      </html>
    `);
    janela.document.close();
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F5F9]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#064384]">
          progress_activity
        </span>
      </div>
    );

  return (
    <div className="bg-[#F1F5F9] min-h-screen font-sans flex flex-col h-screen overflow-hidden w-full">
      {/* HEADER RESPONSIVO */}
      <header className="bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 shadow-sm z-20 shrink-0 w-full">
        <div className="flex items-center gap-3 sm:gap-4 pl-12 lg:pl-0">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-[#064384] transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
              arrow_back
            </span>
          </button>
          <div className="hidden sm:block h-6 w-[1px] bg-slate-200"></div>
          <h1 className="font-black text-[#064384] text-base sm:text-lg uppercase tracking-widest flex items-center gap-2 truncate">
            <span className="material-symbols-outlined hidden sm:block text-[#FF8323]">
              gavel
            </span>
            <span className="truncate">Regulamento Interno</span>
          </h1>
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-3 mt-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border transition-all active:scale-95 ${previewMode ? "bg-[#064384] text-white border-[#064384]" : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-sm"}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {previewMode ? "edit" : "visibility"}
            </span>
            <span className="hidden xs:inline">
              {previewMode ? "Editar Texto" : "Visualizar PDF"}
            </span>
            <span className="xs:hidden">
              {previewMode ? "Editar" : "Ver PDF"}
            </span>
          </button>

          <button
            onClick={handlePrint}
            className="print-hidden shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-[#FF8323] hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px] animate-spin-slow">
              {saving ? "sync" : "save"}
            </span>
            <span>{saving ? "Salvando..." : "Salvar"}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full relative">
        {/* BARRA LATERAL (Configurações) - Expansível no Mobile */}
        <aside
          className={`bg-white border-b lg:border-r lg:border-b-0 border-slate-200 flex-col shrink-0 shadow-sm z-10 overflow-y-auto transition-all w-full lg:w-80 ${showConfigMobile ? "h-[45vh] flex" : "hidden lg:flex"}`}
        >
          <div className="p-4 sm:p-6 border-b bg-slate-50/50 flex justify-between items-center sticky top-0 z-10">
            <h2 className="font-black text-[#064384] text-[11px] sm:text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                settings
              </span>{" "}
              Configurações
            </h2>
            {/* Fechar no mobile */}
            <button
              className="lg:hidden text-slate-400 hover:text-slate-600"
              onClick={() => setShowConfigMobile(false)}
            >
              <span className="material-symbols-outlined text-xl">
                keyboard_arrow_up
              </span>
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="space-y-1">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Empresa no PDF
              </label>
              <input
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#064384] focus:ring-2 focus:ring-[#064384]/10 text-xs sm:text-sm font-bold transition-all"
                placeholder="Ex: Minha Empresa LTDA"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">
                CNPJ
              </label>
              <input
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#064384] text-xs sm:text-sm transition-all"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Cidade
                </label>
                <input
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#064384] text-xs sm:text-sm transition-all"
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  UF
                </label>
                <input
                  value={form.uf}
                  onChange={(e) => setForm({ ...form, uf: e.target.value })}
                  maxLength={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#064384] text-center text-xs sm:text-sm uppercase transition-all"
                  placeholder="SP"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 text-orange-500">
                <span className="material-symbols-outlined text-[14px]">
                  add_box
                </span>{" "}
                Regras Adicionais
              </label>
              <textarea
                value={form.regrasAdicionais}
                onChange={(e) =>
                  setForm({ ...form, regrasAdicionais: e.target.value })
                }
                rows={4}
                className="w-full p-3 bg-slate-50 border border-orange-200 rounded-xl text-xs sm:text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                placeholder="Ex: Cláusula de Confidencialidade específica para T.I."
              />
            </div>
          </div>
        </aside>

        {/* ÁREA DE CONTEÚDO (Editor ou Preview) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center bg-slate-100 relative">
          {/* Botão flutuante para reabrir configurações no mobile */}
          {!showConfigMobile && !previewMode && (
            <button
              onClick={() => setShowConfigMobile(true)}
              className="lg:hidden absolute top-4 right-4 z-10 bg-white border border-slate-200 shadow-lg text-[#064384] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">
                settings
              </span>{" "}
              Ajustar Variáveis
            </button>
          )}

          {previewMode ? (
            /* --- VISUALIZAÇÃO (PAPEL A4) --- */
            <div className="bg-white w-full max-w-[800px] min-h-[1000px] p-6 sm:p-12 lg:p-20 shadow-2xl border border-slate-300 animate-in fade-in zoom-in-95 duration-300 mt-2 sm:mt-0">
              <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-lg sm:text-xl font-bold uppercase underline">
                  Regulamento Interno de Trabalho
                </h1>
                <h2 className="text-base sm:text-lg font-bold mt-2 text-[#064384]">
                  {varEmpresa}
                </h2>
              </div>
              <div
                className="text-xs sm:text-sm"
                dangerouslySetInnerHTML={{
                  __html: renderizarTextoHTML(form.conteudoCompleto),
                }}
              />

              {form.regrasAdicionais && (
                <div className="mt-8 border-t border-dashed border-slate-200 pt-6">
                  <h3 className="font-bold text-sm sm:text-base mb-2 uppercase">
                    VIII - DISPOSIÇÕES ESPECIAIS
                  </h3>
                  <p className="text-xs sm:text-sm text-justify leading-relaxed whitespace-pre-line italic text-slate-600">
                    {form.regrasAdicionais}
                  </p>
                </div>
              )}

              {/* O TERMO DE PRORROGAÇÃO NO PREVIEW */}
              <div className="mt-16 sm:mt-20 pt-8 sm:pt-10 border-t-2 border-dashed border-slate-200">
                <h2 className="text-base sm:text-lg font-bold text-center mb-6 sm:mb-8 uppercase">
                  TERMO DE PRORROGAÇÃO DE CONTRATO DE TRABALHO
                </h2>
                <p className="text-xs sm:text-sm text-justify leading-relaxed mb-4 sm:mb-6">
                  O presente termo corresponde a prorrogação do contrato de
                  experiência celebrado entre <strong>{varEmpresa}</strong>,
                  CNPJ <strong>{varCnpj}</strong> e o EMPREGADO (nome, endereço,
                  CTPS, série), pelo período de ___________ a ___________ e por
                  este fica prorrogado até ___________.
                </p>
                <p className="text-xs sm:text-sm text-justify leading-relaxed mb-8 sm:mb-10">
                  Com este termo, ficam mantidas as cláusulas do contrato
                  principal, bem como as do regulamento em anexo ao mesmo.
                </p>
                <p className="text-right text-xs sm:text-sm mb-12 sm:mb-16">
                  {varCidade} - {varUf}, ____/____/____
                </p>
                <div className="grid grid-cols-2 gap-6 sm:gap-10 text-center">
                  <div>
                    <div className="border-t border-slate-400 w-full mb-1"></div>
                    <p className="font-bold text-[10px] sm:text-xs truncate px-2">
                      {varEmpresa}
                    </p>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 w-full mb-1"></div>
                    <p className="font-bold text-[10px] sm:text-xs uppercase text-slate-400">
                      Empregado
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- MODO EDITOR --- */
            <div className="bg-white w-full max-w-[900px] shadow-xl border border-slate-200 rounded-2xl flex flex-col h-full overflow-hidden mt-12 lg:mt-0">
              <div className="px-4 sm:px-8 py-3 border-b bg-slate-50 flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-orange-500 text-lg">
                  edit_note
                </span>
                <span className="font-bold text-slate-600 text-xs uppercase tracking-widest">
                  Corpo do Documento (Editor Livre)
                </span>
              </div>
              <textarea
                value={form.conteudoCompleto}
                onChange={(e) =>
                  setForm({ ...form, conteudoCompleto: e.target.value })
                }
                className="flex-1 w-full p-4 sm:p-8 outline-none resize-none text-[13px] sm:text-sm text-slate-800 leading-relaxed font-mono custom-scrollbar bg-white"
                placeholder="O texto do regulamento aparece aqui..."
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
