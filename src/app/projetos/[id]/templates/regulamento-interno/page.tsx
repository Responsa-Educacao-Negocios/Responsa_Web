"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegulamentoInternoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registroId, setRegistroId] = useState<string | null>(null);

  const [form, setForm] = useState({
    empresa: "",
    cnpj: "",
    cidade: "",
    uf: "",
    regrasAdicionais: "",
  });

  useEffect(() => {
    const carregarDados = async () => {
      // 1. Tenta buscar o regulamento já salvo na tabela nova
      const { data: regData } = await supabase
        .from("REGULAMENTOS_INTERNOS")
        .select("*")
        .eq("cd_projeto", params.id)
        .maybeSingle();

      if (regData) {
        setRegistroId(regData.cd_regulamento);
        // Traduz do Banco KADMOS para o Form React
        setForm({
          empresa: regData.nm_empresa_documento || "",
          cnpj: regData.nr_cnpj_documento || "",
          cidade: regData.nm_cidade_foro || "",
          uf: regData.sg_uf_foro || "",
          regrasAdicionais: regData.ds_regras_adicionais || "",
        });
      } else {
        // Se não existir, puxa o nome da empresa direto do projeto para adiantar a vida do consultor
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Mapeia do Form React para o payload blindado do Banco KADMOS
    const payload = {
      cd_projeto: params.id,
      nm_empresa_documento: form.empresa,
      nr_cnpj_documento: form.cnpj,
      nm_cidade_foro: form.cidade,
      sg_uf_foro: form.uf,
      ds_regras_adicionais: form.regrasAdicionais,
      // Deixamos o JSON vazio por enquanto para usos futuros de template
      js_variaveis_template: {},
    };

    try {
      if (registroId) {
        await supabase
          .from("REGULAMENTOS_INTERNOS")
          .update(payload)
          .eq("cd_regulamento", registroId);
      } else {
        const { data } = await supabase
          .from("REGULAMENTOS_INTERNOS")
          .insert([payload])
          .select()
          .single();
        if (data) setRegistroId(data.cd_regulamento);
      }
      alert("Regulamento Interno atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o documento.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    // Pega apenas o conteúdo da div do documento
    const conteudo = document.getElementById("area-impressao")?.innerHTML;
    if (!conteudo) return;

    // Abre uma janela temporária
    const janela = window.open("", "", "width=900,height=900");
    if (!janela) return;

    // Monta o HTML limpo apenas com o seu documento
    janela.document.write(`
      <html>
        <head>
          <title>Impressão - Regulamento Interno</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { margin: 15mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body class="bg-white text-slate-800 font-sans">
          <div class="max-w-[850px] mx-auto p-8">
            ${conteudo}
          </div>
          <script>
            // Aguarda meio segundo para o Tailwind aplicar o CSS e chama a impressão
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
          </script>
        </body>
      </html>
    `);
    janela.document.close();
  };

  if (loading)
    return (
      <div className="p-20 text-center text-[#064384] font-bold">
        Carregando gerador...
      </div>
    );

  // Variáveis para interpolação na tela (Se estiver vazio, mostra o pontilhado)
  const varEmpresa = form.empresa
    ? form.empresa.toUpperCase()
    : "__________________";
  const varCnpj = form.cnpj ? form.cnpj : "__________________";
  const varCidade = form.cidade ? form.cidade : "__________________";
  const varUf = form.uf ? form.uf.toUpperCase() : "___";

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col h-screen overflow-hidden print:bg-white print:h-auto print:overflow-visible">
      {/* HEADER FIXO (Escondido na impressão via classe print:hidden) */}
      <header className="bg-white px-8 py-4 flex justify-between items-center border-b shrink-0 shadow-sm z-10 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-[#064384]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <h1 className="font-black text-[#064384] text-lg uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined">gavel</span> Gerador de
            Regulamento Interno
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>{" "}
            Imprimir / PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FF8323] hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {saving ? "sync" : "save"}
            </span>{" "}
            Salvar
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        {/* SIDEBAR FORMULÁRIO (Escondido na impressão via classe print:hidden) */}
        <aside className="w-96 bg-white border-r flex flex-col h-full shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0 print:hidden overflow-y-auto">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-black text-[#064384] text-sm uppercase tracking-widest">
              Variáveis do Documento
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Preencha os dados para atualizar o texto na visualização ao lado.
            </p>
          </div>

          <form className="p-6 space-y-5" onSubmit={handleSave}>
            <div>
              <label className="text-xs font-bold text-slate-700">
                Nome da Empresa no Documento
              </label>
              <input
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none font-semibold text-slate-800"
                placeholder="Ex: Tech Solutions Ltda"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">
                CNPJ da Empresa
              </label>
              <input
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none"
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  Foro (Cidade)
                </label>
                <input
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none"
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">UF</label>
                <input
                  value={form.uf}
                  onChange={(e) => setForm({ ...form, uf: e.target.value })}
                  maxLength={2}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none uppercase text-center"
                  placeholder="SP"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-[14px]">
                  add_circle
                </span>{" "}
                Cláusulas Adicionais (Opcional)
              </label>
              <p className="text-[10px] text-slate-400 mb-2">
                Se a empresa tiver uma regra específica (ex: uso de veículos da
                frota), digite aqui.
              </p>
              <textarea
                value={form.regrasAdicionais}
                onChange={(e) =>
                  setForm({ ...form, regrasAdicionais: e.target.value })
                }
                rows={6}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#064384] outline-none text-sm"
                placeholder="Art 1. É proibido..."
              />
            </div>
          </form>
        </aside>

        {/* ÁREA PRINCIPAL: VISUALIZAÇÃO DO DOCUMENTO (Folha A4 simulada) */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white print:block">
          <div
            className="bg-white w-full max-w-[850px] min-h-[4100px] p-12 md:p-20 shadow-xl border border-slate-200 print:shadow-none print:border-0 print:p-0"
            id="area-impressao"
          >
            <div className="text-center mb-10">
              <h1 className="text-xl font-bold uppercase underline">
                Regulamento Interno de Trabalho
              </h1>
              <h2 className="text-lg font-bold mt-2">{varEmpresa}</h2>
            </div>

            <div className="text-justify text-sm leading-relaxed space-y-6 text-slate-800">
              <p>
                Este Regulamento Interno faz parte integrante do Contrato
                Individual de Trabalho de todos os funcionários da Empresa{" "}
                <strong>{varEmpresa}</strong>, sendo obrigatório o seu
                cumprimento, sendo este de pleno conhecimento de todos.
              </p>

              {/* BLOCO 1 */}
              <div>
                <h3 className="font-bold mb-2 mt-6">I – UNIFORMES</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    É absolutamente indispensável o uso de uniforme completo por
                    parte dos funcionários no interior da empresa, sendo certo
                    que este deve se encontrar em perfeitas condições e que no
                    caso de extravio ou de qualquer dano que tal vestimenta vier
                    a sofrer, por culpa do funcionário, que estiver na posse da
                    mesma ou na posse de pessoas que estejam sob sua
                    responsabilidade, este deverá ressarcir sua empregadora.
                  </li>
                  <li>
                    Não será permitido cumprimento da Jornada de Trabalho sem o
                    devido uniforme nas condições descritas no item 1, isto é,
                    completo e em perfeitas condições.
                  </li>
                </ol>
              </div>

              {/* BLOCO 2 */}
              <div>
                <h3 className="font-bold mb-2 mt-6">II - DO HORÁRIO</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Os horários estabelecidos pelo líder coordenador, inclusive
                    para almoço e lanche, deverão ser estritamente observados,
                    sob pena de descontos dos salários na razão do tempo de
                    trabalho perdido;
                  </li>
                  <li>
                    Os funcionários deverão se apresentar para o trabalho no
                    horário previsto e contratado;
                  </li>
                  <li>
                    O registro nos controles de freqüência serão feitos por meio
                    de livro de ponto ou papeletas externas, sendo os
                    funcionários obrigados a marcarem cautelosamente nos mesmos
                    as próprias entradas e saídas, observando o dia
                    correspondente e os locais destinados para entrada e saída,
                    a fim de evitar registros errados, devendo comunicar ao seu
                    superior, no caso de ocorrer quaisquer irregularidades no
                    referido registro, inclusive por falha do equipamento,
                    conforme o caso, ou mesmo por seu próprio equívoco;
                  </li>
                  <li>
                    Pelos controles de frequência serão verificadas as
                    presenças, faltas e atrasos; e pelos mesmos serão procedidos
                    os descontos nos salários;
                  </li>
                  <li>
                    A falta de marcação do controle indicado no item 3,
                    implicará na prova de ausência, independente de qualquer
                    outra prova, logo implicando no desconto do dia que não foi
                    registrado;
                  </li>
                  <li>
                    Não será permitido a entrada de funcionários para o
                    expediente de trabalho, após o horário de inicio da jornada,
                    salvo se for comunicado anteriormente pelo responsável do
                    Setor, ao Departamento de Pessoal;
                  </li>
                  <li>
                    As reincidências de ausências, ou atrasos ao serviço, sem
                    causa justificada, constituem motivo passível de dispensa da
                    rescisão do Contrato de Trabalho por justa causa;
                  </li>
                  <li>
                    As saídas antecipadas somente serão permitidas pelo líder
                    imediato, com a devida autorização e comunicação ao setor de
                    Pessoas responsável pelos registros, após a marcação do
                    cartão de ponto.
                  </li>
                </ol>
              </div>

              {/* BLOCO 3 */}
              <div>
                <h3 className="font-bold mb-2 mt-6">
                  III - DAS FALTAS JUSTIFICADAS
                </h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Só serão aceitos atestados médicos fornecidos por hospitais
                    públicos ou postos de saúde ou por médicos particulares;
                  </li>
                  <li>
                    A Empresa se reserva o direito de verificar a veracidade das
                    justificações por faltas ao serviço.
                  </li>
                </ol>
                <p className="mt-2 ml-5 text-xs italic">
                  Parágrafo único: Não serão aceitos atestados rasurados, sendo
                  certo que neste caso será apurada a procedência do mesmo e no
                  caso de comprovação de irregularidades serão tomadas as
                  medidas legais cabíveis, inclusive criminais.
                </p>
              </div>

              {/* BLOCO 4 */}
              <div>
                <h3 className="font-bold mb-2 mt-6">IV - HIGIENE</h3>
                <p className="mb-2">
                  Todos os empregados devem cooperar com a Empresa a fim de ser
                  mantido um ambiente limpo, higiênico e em condições sanitárias
                  adequadas.
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Todos devem apresentar-se ao trabalho em condições
                    convenientes de higiene pessoal. Os empregados, em
                    particular, devem conservar os uniformes de uso diário, em
                    boas condições de limpeza e lavados com regularidade,
                    conforme descrito no item 1 relativo a uniformes.
                  </li>
                </ol>
              </div>

              {/* BLOCO 5 */}
              <div>
                <h3 className="font-bold mb-2 mt-6">
                  V - DA DISCIPLINA INTERNA E DISPOSIÇÕES GERAIS
                </h3>
                <p className="mb-2">
                  Para a boa disciplina interna e funcional a todo e qualquer
                  funcionário da Empresa é proibido:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-xs">
                  <li>
                    Conservar-se sem o uniforme aprovado pela Diretoria da
                    Empresa (para os que a empresa determine o seu uso);
                  </li>
                  <li>
                    Estando o mesmo suspenso de suas funções é proibido de
                    transitar e permanecer pelas dependências da Empresa;
                  </li>
                  <li>
                    Ouvir conversa de outros pessoas, o que não lhe diz
                    respeito;
                  </li>
                  <li>
                    Usar telefone celular próprio durante o horário de trabalho,
                    interrompendo suas atividades para tal fim, não estando em
                    seu horário de intervalo, salvo com autorização de seu
                    superior hierárquico;
                  </li>
                  <li>
                    Usar telefone da Empresa, inclusive celular, para fins
                    pessoais, bem como em assuntos estranhos ao interesse da
                    mesma, sem autorização de seu superior hierárquico;
                  </li>
                  <li>
                    Utilizar também internet e e-mail da Empresa para fins
                    pessoais e em assuntos estranhos ao interesse da mesma;
                  </li>
                  <li>
                    Tomar parte em reuniões e conversas, durante o expediente
                    sobre assuntos estranhos aos interesses e serviços da
                    empresa, inclusive de caráter político ou de caráter que
                    difame outras pessoas;
                  </li>
                  <li>
                    Ausentar-se dos departamentos ou seções onde trabalham, sem
                    prévia autorização dos seus chefes, ou substitutos destes;
                  </li>
                  <li>
                    Destratar os clientes da empresa, ainda que esteja com a
                    razão;
                  </li>
                  <li>
                    Destratar os colegas com palavras ásperas ou ofensivas;
                  </li>
                  <li>
                    Desrespeitar ou ser indelicado ou descortês para com seus
                    colegas, liderados e superiores;
                  </li>
                  <li>
                    Criticar os atos da administração da empresa de forma que
                    prejudique o andamento dos trabalhos ou desabone o seu nome;
                  </li>
                  <li>
                    Recusar-se a cumprir as ordens dadas pelos superiores
                    hierárquicos, inclusive em relação ao comparecimento para
                    prestação de serviços extraordinários e labor em dias
                    determinados;
                  </li>
                  <li>
                    Utilizar o nome da empresa para negócios particulares, sem
                    prévia autorização da administração;
                  </li>
                  <li>
                    Desacatar ou desconsiderar as ordens emitidas pela
                    administração da empresa;
                  </li>
                  <li>
                    Consumir bebidas alcoólicas ou utilizar substâncias
                    entorpecentes em serviço ou apresentar-se nestas condições
                    para exercer suas atividades;
                  </li>
                  <li>
                    Praticar concorrência desleal, trabalhando para concorrentes
                    ou para outras empresas no horário comercial de trabalho;
                  </li>
                  <li>
                    Não zelar pelo asseio no seu local de trabalho, bem como do
                    estabelecimento em geral;
                  </li>
                  <li>
                    Violar segredo da empresa, principalmente no que tange às
                    informações que sejam provenientes da sua função que
                    deveriam permanecer em sigilo, especialmente quando se
                    tratar de função de confiança;
                  </li>
                  <li>
                    Fazer comentários que venham denegrir a imagem de seus
                    superiores e colegas, conturbando o local de trabalho;
                  </li>
                  <li>
                    Danificar mercadorias, deixar mercadorias em espaços não
                    adequados a elas (por exemplo expostas ao sol), bens móveis
                    ou quaisquer outros equipamentos de seu uso pertencentes à
                    Empresa, o que inclui celulares e rádios que estejam sob sua
                    responsabilidade, inclusive avariar veículos e maquinários,
                    sendo certo que neste caso serão procedidos descontos nos
                    salários do respectivo funcionário, que desde fica acordado
                    e autorizado os referidos descontos por meio deste
                    regulamento, nos termos do art. 462 § 1º da CLT;
                  </li>
                  <li>
                    Praticar atos indecorosos à moral e ao pudor, nas
                    dependências da empresa e ainda, os mesmos atos praticados
                    fora delas, que venham a ser do conhecimento da
                    administração e reflitam nas suas atividades;
                  </li>
                  <li>Praticar agiotagem dentro da empresa;</li>
                  <li>
                    Guardar quaisquer pacotes ou volumes nas dependências ou
                    locais de trabalho;
                  </li>
                  <li>
                    Fumar em locais que não são os determinados e permitidos
                    pela empresa;
                  </li>
                  <li>
                    Mau comportamento e clima de crítica ofensiva no recinto de
                    trabalho;
                  </li>
                  <li>Decrescer a produção, por negligência comprovada;</li>
                  <li>Recusar-se a assinar o registro de presença diária;</li>
                  <li>
                    Recusar-se a cooperar com sua empresa empregadora quando
                    solicitado;
                  </li>
                  <li>
                    Manter conversas desnecessárias durante a jornada de
                    trabalho, fora dos intervalos, causando desatenção ao
                    serviço;
                  </li>
                  <li>
                    Receber ligações a cobrar nos telefones da empresa fixos ou
                    celulares, estando esse último sob sua posse;
                  </li>
                  <li>
                    É proibido o uso do e-mail corporativo da empresa para envio
                    e recebimento de comunicações pessoais, sendo certo que caso
                    haja o desrespeito desta determinação e que tal conduta
                    venha propiciar danos à empregadora, serão tomadas as
                    medidas legais cabíveis, inclusive com interposição de ação
                    cabível.
                  </li>
                </ol>
              </div>

              {/* BLOCO 6 */}
              <div>
                <h3 className="font-bold mb-2 mt-6">
                  VI - OUTRAS DETERMINAÇÕES
                </h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    O funcionário que, sabedor de quaisquer atos ou fatos que
                    acarretem em prejuízos à empresa, não os comunicar à
                    administração, será considerado conivente;
                  </li>
                  <li>
                    Além de responder pelos prejuízos materiais causados por
                    maus tratos às mercadorias, enganos continuados, falta de
                    clareza, rasuras, extravio de mercadorias, valores ou
                    documentos importantes, implicará em penalidade conforme
                    Consolidação das Leis do Trabalho;
                  </li>
                  <li>
                    A subtração de mercadorias, valores ou documentos
                    importantes, implicará em demissão por justa causa, sem
                    prejuízo das medidas judiciais que o caso comportar. A
                    empresa se reserva o direito de, sempre que julgar
                    necessário, afastar qualquer funcionário de seus serviços
                    por tempo indeterminado e sem prejuízo de seus salários para
                    verificação dos serviços e valores sob sua responsabilidade.
                  </li>
                  <li>
                    O empregado deverá apresentar seus documentos sempre que
                    solicitado pela empresa empregadora;
                  </li>
                  <li>
                    É obrigatória a utilização de equipamento de proteção
                    individual pelo funcionário quando for recomendado, bem como
                    zelar, guardar e conservar o mesmo, devolvendo-o quando este
                    se encontrar impróprio para o uso, por motivo de demissão ou
                    afastamento;
                  </li>
                  <li>
                    Nenhum aviso (comunicado, memorando, etc.) deverá ser
                    colocado no quadro de avisos sem a prévia autorização do
                    líder do setor;
                  </li>
                  <li>
                    Para o bem-estar e segurança coletiva, os funcionários não
                    poderão negar-se a submeter-se a exame médico, custeado pela
                    Empresa, sempre que esta o julgar necessário, bem como em
                    razão da legislação vigente;
                  </li>
                  <li>
                    Constituirá motivo bastante para demissão sumária por justa
                    causa, qualquer ato abusivo dos funcionários que diga
                    respeito à integridade moral e física de terceiros, colegas
                    de trabalho, chefes, imediatos, gerentes de qualquer
                    dependência da empresa, e diretores;
                  </li>
                  <li>
                    No caso de empregados que tenham a posse de celular da
                    empresa, estes deverão zelar e guardar pelas boas condições
                    do referido equipamento, sendo certo que havendo extravio ou
                    que o mesmo seja danificado por culpa do funcionário, também
                    caberá ressarcimento à sua empregadora;
                  </li>
                </ol>
              </div>

              {/* BLOCO 7 */}
              <div>
                <h3 className="font-bold mb-2 mt-6">VII - DA PROMOÇÃO</h3>
                <p className="mb-2">
                  O funcionário que demonstrar interesse pela empresa,
                  assiduidade ao trabalho, probidade, capacidade de produção e
                  mantiver sua folha corrida funcional sempre limpa, terá
                  preferência às promoções, sendo também apreciados os seguintes
                  fatores:
                </p>
                <ol className="list-[lower-alpha] pl-5 space-y-1 mb-4">
                  <li>Bom índice de produção individual;</li>
                  <li>
                    Procurar colaborar sempre para o maior desenvolvimento da
                    empresa, apresentando sugestões viáveis por escrito ou
                    verbais;
                  </li>
                  <li>
                    Procurar colaborar diretamente com os seus chefes imediatos;
                  </li>
                  <li>Demonstrar capacidade de iniciativa própria;</li>
                  <li>
                    Cumprir rigorosamente e integralmente este Regulamento
                    Interno;
                  </li>
                  <li>Não ter sido passível de penas disciplinares.</li>
                </ol>

                <p className="mb-4">
                  O não cumprimento ou abusos às regras e princípios aqui
                  estabelecidos, será considerado INFRAÇÃO AO REGULAMENTO,
                  sujeitando o infrator (de acordo com a gravidade da mesma), às
                  penalidades previstas na CONSOLIDAÇÃO DAS LEIS DO TRABALHO,
                  que relacionamos: 1° Advertência verbal, sob forma de
                  orientação; 2° Advertência por escrito, sendo anexada à ficha
                  funcional; 3° Suspensão; 4º Demissão.
                </p>

                <p className="mb-4">
                  Os casos omissos e modificações deste Regulamento Interno,
                  serão em quaisquer circunstâncias, resolvidos pela Gerencia
                  Administrativo Financeira, que, para tal, reger-se-á não só
                  pela legislação Trabalhista vigente, como pêlos costumes
                  usuais e demais diretrizes da empresa, desde que não colidam
                  com a referida Legislação. Registre-se ainda, que a aplicação
                  das penalidades previstas na legislação trabalhista não
                  exclui, quando couber, a adoção também de outras medidas
                  cabíveis de natureza cível e criminal.
                </p>
              </div>

              {/* REGRAS ADICIONAIS (Se preenchidas no form) */}
              {form.regrasAdicionais && (
                <div>
                  <h3 className="font-bold mb-2 mt-6">
                    VIII - DISPOSIÇÕES ESPECIAIS (ADICIONAIS)
                  </h3>
                  <div className="whitespace-pre-line text-sm bg-yellow-50/50 p-4 border border-yellow-100 italic">
                    {form.regrasAdicionais}
                  </div>
                </div>
              )}

              {/* TERMO DE PRORROGAÇÃO */}
              <div className="mt-16 pt-10 border-t-2 border-dashed border-slate-300 page-break-before">
                <h2 className="text-lg font-bold text-center mb-6">
                  TERMO DE PRORROGAÇÃO DE CONTRATO DE TRABALHO
                </h2>
                <p className="mb-6 indent-8">
                  O presente termo corresponde a prorrogação do contrato de
                  experiência celebrado entre <strong>{varEmpresa}</strong>,
                  CNPJ <strong>{varCnpj}</strong> e o EMPREGADO (nome, endereço,
                  CTPS, série), pelo período de ___________ a ___________ e por
                  este fica prorrogado até ___________.
                </p>
                <p className="mb-10 indent-8">
                  Com este termo, ficam mantidas as claúsulas do contrato
                  principal, bem como as do regulamento em anexo ao mesmo.
                </p>

                <p className="text-right mb-16">
                  {varCidade}
                  {form.uf ? ` - ${varUf}` : ""}, ______ de _________________ de
                  ________
                </p>

                <div className="grid grid-cols-2 gap-10 mt-10 text-center">
                  <div>
                    <div className="border-t border-black mb-1 w-full max-w-[250px] mx-auto"></div>
                    <p className="font-bold">{varEmpresa}</p>
                    <p className="text-xs">EMPREGADOR</p>
                  </div>
                  <div>
                    <div className="border-t border-black mb-1 w-full max-w-[250px] mx-auto"></div>
                    <p className="font-bold">______________________________</p>
                    <p className="text-xs">EMPREGADO</p>
                  </div>
                  <div className="mt-8">
                    <div className="border-t border-black mb-1 w-full max-w-[250px] mx-auto"></div>
                    <p className="text-xs">TESTEMUNHA 1</p>
                  </div>
                  <div className="mt-8">
                    <div className="border-t border-black mb-1 w-full max-w-[250px] mx-auto"></div>
                    <p className="text-xs">TESTEMUNHA 2</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
