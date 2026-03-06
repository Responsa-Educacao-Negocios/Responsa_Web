"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RelatorioFinalPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    const carregarRelatorioCompleto = async () => {
      try {
        setLoading(true);
        const id = params.id as string;

        // 1. Projeto e Empresa
        const { data: proj, error: errP } = await supabase
          .from("PROJETOS")
          .select("*, EMPRESAS(*)")
          .eq("cd_projeto", id)
          .single();
        if (errP) throw errP;

        // 2. Diagnóstico RH (Maturidade / Risco)
        const { data: ind } = await supabase
          .from("INDICADORES_RH")
          .select("*")
          .eq("cd_projeto", id)
          .order("ts_criacao", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Clima
        const { data: respClima } = await supabase
          .from("RESPOSTAS_INDIVIDUAIS_CLIMA")
          .select("*")
          .eq("cd_projeto", id);

        let notaClima = 0;
        let dimClima = { lid: 0, com: 0, rec: 0, des: 0, amb: 0, eng: 0 };

        if (respClima && respClima.length > 0) {
          let somaGeral = 0;
          respClima.forEach((c) => {
            dimClima.lid += c.nr_lideranca || 0;
            dimClima.com += c.nr_comunicac || 0;
            dimClima.rec += c.nr_reconhecir || 0;
            dimClima.des += c.nr_desenvolvi || 0;
            dimClima.amb += c.nr_ambiente || 0;
            dimClima.eng += c.nr_engajamen || 0;

            somaGeral +=
              (c.nr_lideranca +
                c.nr_comunicac +
                c.nr_reconhecir +
                c.nr_desenvolvi +
                c.nr_ambiente +
                c.nr_engajamen) /
              6;
          });

          const t = respClima.length;
          dimClima = {
            lid: Math.round((dimClima.lid / t) * 10),
            com: Math.round((dimClima.com / t) * 10),
            rec: Math.round((dimClima.rec / t) * 10),
            des: Math.round((dimClima.des / t) * 10),
            amb: Math.round((dimClima.amb / t) * 10),
            eng: Math.round((dimClima.eng / t) * 10),
          };
          notaClima = Math.round((somaGeral / t) * 10);
        }

        // 4. DISC
        const { data: discData } = await supabase
          .from("AVALIACOES_DISC")
          .select("*")
          .eq("cd_projeto", id);

        let distDisc = { D: 0, I: 0, S: 0, C: 0 };
        if (discData && discData.length > 0) {
          const t = discData.length;
          const s = discData.reduce(
            (acc, c) => ({
              D: acc.D + (c.nr_dominancia || 0),
              I: acc.I + (c.nr_influencia || 0),
              S: acc.S + (c.nr_estabilidade || 0),
              C: acc.C + (c.nr_conformidade || 0),
            }),
            { D: 0, I: 0, S: 0, C: 0 },
          );
          distDisc = {
            D: Math.round(s.D / t),
            I: Math.round(s.I / t),
            S: Math.round(s.S / t),
            C: Math.round(s.C / t),
          };
        }

        // 5. Cargos e Salários
        const { data: colabsData } = await supabase
          .from("PCS_COLABORADORES")
          .select("vl_salario_atual")
          .eq("cd_projeto", id);

        let folhaSalarial = 0;
        if (colabsData && colabsData.length > 0) {
          folhaSalarial = colabsData.reduce(
            (acc, curr) => acc + (Number(curr.vl_salario_atual) || 0),
            0,
          );
        }

        // 6. Brainstorm e Ideias
        const { data: sessoesData } = await supabase
          .from("BRAINSTORM_SESSOES")
          .select("cd_sessao, vl_custo")
          .eq("cd_projeto", id);
        let totalIdeias = 0;
        let custoBS = 0;
        if (sessoesData && sessoesData.length > 0) {
          custoBS = sessoesData.reduce(
            (acc, curr) => acc + Number(curr.vl_custo || 0),
            0,
          );
          const idsSessoes = sessoesData.map((s) => s.cd_sessao);
          const { count } = await supabase
            .from("BRAINSTORM_IDEIAS")
            .select("*", { count: "exact", head: true })
            .in("cd_sessao", idsSessoes);
          totalIdeias = count || 0;
        }

        setDados({
          projeto: proj,
          empresa: Array.isArray(proj.EMPRESAS)
            ? proj.EMPRESAS[0]
            : proj.EMPRESAS,
          maturidade: ind?.nr_maturidade_rh || 0,
          risco: ind?.nr_risco_trabalhista || 0,
          clima: notaClima,
          dimensoesClima: dimClima,
          disc: distDisc,
          totalColabs: discData?.length || 0,
          folhaSalarial,
          sessoesRealizadas: sessoesData?.length || 0,
          custoBrainstorm: custoBS,
          totalIdeias,
          indiceGeral:
            Math.round(
              ((ind?.nr_maturidade_rh || 0) +
                notaClima +
                (100 - (ind?.nr_risco_trabalhista || 0))) /
                3,
            ) || 0,
        });
      } catch (e) {
        console.error("Erro ao gerar relatório:", e);
      } finally {
        setLoading(false);
      }
    };

    carregarRelatorioCompleto();
  }, [params.id]);

  const handlePrint = () => {
    const conteudo = document.getElementById("relatorio-conteudo")?.innerHTML;
    if (!conteudo) return;

    const janela = window.open("", "", "width=1000,height=900");
    if (!janela) return;

    janela.document.write(`
      <html>
        <head>
          <title>Relatório Executivo - ${dados?.empresa?.nm_fantasia || "Consultoria"}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
          <style>
            @media print {
              @page { margin: 0; size: A4; }
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                background-color: white; 
                margin: 0;
              }
              .page-break { page-break-before: always; padding-top: 20mm; }
              .break-inside-avoid { page-break-inside: avoid; }
              .capa-container { height: 100vh; display: flex; flex-direction: column; justify-content: center; }
            }
          </style>
        </head>
        <body class="bg-white text-slate-800 font-sans">
          ${conteudo}
          <script>
            setTimeout(() => { window.print(); window.close(); }, 800);
          </script>
        </body>
      </html>
    `);
    janela.document.close();
  };

  if (loading || !dados)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#064384]">
          <span className="material-symbols-outlined animate-spin text-4xl">
            progress_activity
          </span>
          <span className="font-bold animate-pulse">
            Compilando todos os módulos do projeto...
          </span>
        </div>
      </div>
    );

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);

  // Textos Dinâmicos baseados nas notas
  const getTextoMaturidade = (nota: number) => {
    if (nota > 75)
      return "A empresa apresenta um nível de maturidade em Gestão de Pessoas Avançado. Os processos estão estruturados e existem evidências de práticas consolidadas. O foco agora deve ser a inovação contínua e a manutenção do engajamento dos talentos.";
    if (nota > 40)
      return "A empresa encontra-se em um nível de maturidade Intermediário (Em estruturação). Existem esforços visíveis para organizar o RH, porém muitos processos ainda são informais ou reativos. É necessário padronizar políticas para garantir escalabilidade sustentável.";
    return "A empresa apresenta um nível de maturidade Inicial. A gestão de pessoas é conduzida de forma empírica e altamente reativa, o que gera ineficiências e dependência excessiva dos fundadores/liderança. A estruturação das bases de RH é urgente.";
  };

  const getTextoClima = (nota: number) => {
    if (nota === 0)
      return "Pesquisa de clima organizacional não foi aplicada neste ciclo de consultoria.";
    if (nota > 75)
      return "O Índice Geral de Clima demonstra que a equipe está altamente engajada e satisfeita com as práticas da empresa. O ambiente favorece a produtividade.";
    if (nota > 50)
      return "O Clima Organizacional está em estado de alerta (Moderado). Existem focos de insatisfação que podem gerar turnover a médio prazo se não tratados.";
    return "O Clima Organizacional encontra-se em estado Crítico. Há desengajamento generalizado que afeta diretamente os resultados financeiros e a qualidade da entrega. Intervenção imediata da liderança é obrigatória.";
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-slate-400 hover:text-[#064384] transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-xl">
                arrow_back
              </span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <span className="material-symbols-outlined text-[#064384]">
              verified
            </span>
            <h1 className="text-lg font-bold">Relatório Final Executivo</h1>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#064384] text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Gerar PDF Oficial
          </button>
        </header>

        {/* ÁREA DO RELATÓRIO PDF */}
        <main
          id="relatorio-conteudo"
          className="bg-white mx-auto print:m-0 w-full max-w-[900px] print:max-w-full shadow-2xl print:shadow-none my-10 print:my-0"
        >
          {/* ======================================= */}
          {/* PÁGINA 1: CAPA DO RELATÓRIO             */}
          {/* ======================================= */}
          <div className="capa-container min-h-[1050px] flex flex-col justify-between p-20 border-b-[16px] border-[#064384] relative overflow-hidden bg-slate-50 print:bg-white">
            {/* Elemento de Design na Capa */}
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#064384] rounded-full opacity-5"></div>
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#FF8323] rounded-full opacity-5"></div>

            <div className="z-10">
              <div className="w-24 h-24 bg-[#064384] text-white rounded-2xl flex items-center justify-center font-black text-4xl mb-12 shadow-xl tracking-tighter">
                RH
              </div>
              <h2 className="text-xl font-bold text-[#FF8323] tracking-[0.2em] uppercase mb-4">
                CoreConsulta • Consultoria Estratégica
              </h2>
              <h1 className="text-5xl lg:text-6xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-8">
                Relatório Final <br />
                de Gestão de <br />
                Pessoas 360º
              </h1>
              <div className="h-1 w-32 bg-[#FF8323] mb-12"></div>

              <p className="text-2xl text-slate-700 font-bold mb-2">
                Cliente: {dados.empresa.nm_fantasia}
              </p>
              <p className="text-lg text-slate-500">
                CNPJ: {dados.empresa.nr_cnpj || "Não registrado"}
              </p>
            </div>

            <div className="z-10 mt-auto">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Documento Gerado em
              </p>
              <p className="text-lg font-bold text-slate-800">
                {new Date().toLocaleDateString("pt-BR")}
              </p>
              <p className="text-xs text-slate-400 mt-4">
                Classificação:{" "}
                <strong className="text-slate-600">
                  CONFIDENCIAL / USO INTERNO
                </strong>
              </p>
            </div>
          </div>

          {/* ======================================= */}
          {/* PÁGINA 2: RESUMO EXECUTIVO              */}
          {/* ======================================= */}
          <div className="page-break p-16 print:p-20">
            <div className="border-b-2 border-[#064384] pb-4 mb-10 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#064384] uppercase tracking-widest">
                1. Resumo Executivo
              </h2>
              <span className="material-symbols-outlined text-4xl text-slate-200">
                lightbulb
              </span>
            </div>

            <div className="text-justify text-[15px] leading-loose text-slate-700 space-y-6 mb-12">
              <p>
                O presente relatório tem como objetivo apresentar os resultados
                consolidados do ciclo de Consultoria em Gestão de Pessoas 360º
                realizado na empresa{" "}
                <strong>{dados.empresa.nm_fantasia}</strong>. Através de
                metodologias validadas, foram analisados os pilares de
                estruturação organizacional, aderência de equipe, clima interno
                e conformidade legal.
              </p>
              <p>
                Durante a fase de <em>Onboarding/Kick-off</em>, a diretoria
                reportou a seguinte percepção do cenário:
                <br />
                <span className="bg-slate-100 p-4 rounded-lg block mt-3 font-medium italic border-l-4 border-slate-300">
                  "
                  {dados.empresa.tx_dor_empresario ||
                    "A empresa busca maior eficiência em sua estrutura de pessoas e redução de problemas operacionais ligados ao RH."}
                  "
                </span>
              </p>
            </div>

            <h3 className="font-bold text-lg text-slate-800 mb-6">
              Painel de Indicadores Gerais da Empresa
            </h3>
            <div className="grid grid-cols-2 gap-6 break-inside-avoid">
              <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col justify-center items-center text-center">
                <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                  Saúde Geral da Gestão (0-100)
                </p>
                <p className="text-6xl font-black text-[#064384]">
                  {dados.indiceGeral}
                </p>
                <p className="text-xs font-medium text-slate-400 mt-2">
                  Média ponderada dos indicadores
                </p>
              </div>
              <div className="grid grid-rows-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-white flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Maturidade RH
                    </p>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {dados.maturidade > 70 ? "Avançado" : "Em estruturação"}
                    </p>
                  </div>
                  <p className="text-3xl font-black text-[#064384]">
                    {dados.maturidade}
                  </p>
                </div>
                <div className="border border-slate-200 rounded-xl p-4 bg-white flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Risco Trabalhista
                    </p>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {dados.risco > 50 ? "Nível de Alerta" : "Controlado"}
                    </p>
                  </div>
                  <p
                    className={`text-3xl font-black ${dados.risco > 50 ? "text-red-500" : "text-[#064384]"}`}
                  >
                    {dados.risco}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-justify text-[15px] leading-loose text-slate-700 bg-blue-50/50 p-6 rounded-xl border border-blue-100 break-inside-avoid">
              <h4 className="font-bold text-[#064384] mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  verified
                </span>{" "}
                Conclusão do Diagnóstico
              </h4>
              <p>{getTextoMaturidade(dados.maturidade)}</p>
            </div>
          </div>

          {/* ======================================= */}
          {/* PÁGINA 3: EQUIPE E CLIMA                */}
          {/* ======================================= */}
          <div className="page-break p-16 print:p-20">
            <div className="border-b-2 border-[#064384] pb-4 mb-10 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#064384] uppercase tracking-widest">
                2. Mapeamento de Equipe e Clima
              </h2>
              <span className="material-symbols-outlined text-4xl text-slate-200">
                groups
              </span>
            </div>

            <p className="text-justify text-[15px] leading-loose text-slate-700 mb-8">
              Para estruturar o crescimento da empresa, foi realizado o
              levantamento do perfil comportamental predominante da equipe
              através da metodologia DISC, bem como a mensuração do clima
              interno.
            </p>

            <div className="grid grid-cols-2 gap-8 mb-10 break-inside-avoid">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-widest mb-4">
                  Distribuição DISC ({dados.totalColabs} mapeados)
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-100 font-bold">
                    <span>D - Dominância (Foco em Resultado)</span>
                    <span>{dados.disc.D}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg border border-yellow-100 font-bold">
                    <span>I - Influência (Foco em Pessoas)</span>
                    <span>{dados.disc.I}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-100 font-bold">
                    <span>S - Estabilidade (Foco em Processos)</span>
                    <span>{dados.disc.S}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-100 font-bold">
                    <span>C - Conformidade (Foco em Qualidade)</span>
                    <span>{dados.disc.C}%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-widest mb-4">
                  Avaliação de Clima Organizacional
                </h3>
                <div className="flex-1 border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col justify-center items-center text-center mb-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                    Nota Geral de Clima
                  </p>
                  <p className="text-5xl font-black text-[#064384]">
                    {dados.clima}
                  </p>
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider space-y-2">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span>Liderança</span>{" "}
                    <span className="text-[#064384]">
                      {dados.dimensoesClima.lid}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span>Comunicação</span>{" "}
                    <span className="text-[#064384]">
                      {dados.dimensoesClima.com}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span>Ambiente</span>{" "}
                    <span className="text-[#064384]">
                      {dados.dimensoesClima.amb}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-justify text-[15px] leading-loose text-slate-700 bg-slate-50 p-6 rounded-xl border border-slate-200 break-inside-avoid">
              <h4 className="font-bold text-slate-800 mb-2">
                Análise do Consultor
              </h4>
              <p>
                {getTextoClima(dados.clima)} A distribuição do perfil DISC
                demonstra a capacidade da equipe de reagir a mudanças e executar
                processos. Os dados coletados embasam as estratégias de alocação
                de pessoal e desenvolvimento de liderança.
              </p>
            </div>
          </div>

          {/* ======================================= */}
          {/* PÁGINA 4: CARGOS E PLANO DE AÇÃO        */}
          {/* ======================================= */}
          <div className="page-break p-16 print:p-20">
            <div className="border-b-2 border-[#064384] pb-4 mb-10 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#064384] uppercase tracking-widest">
                3. Estrutura e Plano de Ação
              </h2>
              <span className="material-symbols-outlined text-4xl text-slate-200">
                account_balance_wallet
              </span>
            </div>

            <h3 className="font-bold text-lg text-slate-800 mb-4">
              Auditoria da Folha Salarial
            </h3>
            <p className="text-justify text-[15px] leading-loose text-slate-700 mb-6">
              Foi estruturado o Plano de Cargos e Salários (PCS) para
              estabelecer trilhas de carreiras claras e faixas remuneratórias
              justas, corrigindo distorções e protegendo a empresa
              juridicamente.
            </p>

            <div className="bg-white border-l-4 border-[#064384] shadow-sm p-6 rounded-r-xl mb-12 flex justify-between items-center break-inside-avoid">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Custo Projetado da Folha (Mensal)
                </p>
                <p className="text-3xl font-black text-[#064384]">
                  {formatMoney(dados.folhaSalarial)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Colaboradores no PCS
                </p>
                <p className="text-3xl font-black text-slate-700">
                  {dados.totalColabs}
                </p>
              </div>
            </div>

            <h3 className="font-bold text-lg text-slate-800 mb-4 pt-4 border-t border-slate-100">
              Brainstorming e Plano de Melhorias
            </h3>
            <p className="text-justify text-[15px] leading-loose text-slate-700 mb-6">
              Através de sessões estruturadas de ideação com foco em solução de
              problemas operacionais, foram levantadas e ranqueadas novas
              estratégias a serem aplicadas.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8 break-inside-avoid">
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 text-center">
                <p className="text-4xl font-black text-[#FF8323]">
                  {dados.sessoesRealizadas}
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-2">
                  Sessões Realizadas
                </p>
              </div>
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 text-center">
                <p className="text-4xl font-black text-[#FF8323]">
                  {dados.totalIdeias}
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-2">
                  Ideias Validadas
                </p>
              </div>
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 text-center">
                <p className="text-4xl font-black text-[#FF8323]">
                  {formatMoney(dados.custoBrainstorm)}
                </p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-2">
                  Custo Estimado das Ações
                </p>
              </div>
            </div>

            <h3 className="font-bold text-lg text-slate-800 mb-4 pt-4 border-t border-slate-100">
              Recomendações e Próximos Passos (30-60-90)
            </h3>
            <ul className="space-y-4 text-[14px] leading-relaxed text-slate-700 list-disc pl-5 break-inside-avoid mb-10">
              <li>
                <strong>Imediato (30 dias):</strong> Assinatura e vigência do
                Regulamento Interno; Enquadramento salarial das discrepâncias
                graves.
              </li>
              <li>
                <strong>Curto Prazo (60 dias):</strong> Início das execuções do
                Plano de Ação levantado no Brainstorm; Devolutivas (Feedbacks)
                baseadas no DISC.
              </li>
              <li>
                <strong>Médio Prazo (90 dias):</strong> Estabelecimento da
                rotina de Avaliação de Desempenho 360º para embasar as promoções
                futuras.
              </li>
            </ul>
          </div>

          {/* ======================================= */}
          {/* PÁGINA 5: ASSINATURAS E ENCERRAMENTO    */}
          {/* ======================================= */}
          <div className="page-break p-16 print:p-20 flex flex-col h-full justify-center">
            <div className="text-center max-w-2xl mx-auto space-y-6">
              <span className="material-symbols-outlined text-6xl text-[#064384] mb-4">
                task_alt
              </span>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">
                Encerramento do Ciclo
              </h2>
              <p className="text-[15px] leading-loose text-slate-600">
                Atestamos através deste documento a entrega do diagnóstico e a
                estruturação dos módulos de Gestão de Pessoas propostos no
                escopo contratual. A execução contínua destas práticas garantirá
                o atingimento das expectativas estratégicas definidas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-20 mt-32">
              <div className="text-center">
                <div className="border-t-2 border-slate-800 mb-2"></div>
                <p className="font-bold text-slate-800 text-lg">
                  Diretoria Consultoria RH
                </p>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">
                  Consultor Responsável
                </p>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-slate-800 mb-2"></div>
                <p className="font-bold text-slate-800 text-lg">
                  {dados.empresa.nm_responsavel_legal || "Representante Legal"}
                </p>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">
                  {dados.empresa.nm_fantasia}
                </p>
              </div>
            </div>

            <div className="text-center mt-32 text-xs font-bold text-slate-400 uppercase tracking-widest">
              Documento gerado através da plataforma Responsa. <br /> Todos os
              direitos reservados.
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
