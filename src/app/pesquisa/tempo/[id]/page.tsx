"use client";

import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// As 96 afirmações oficiais do Inventário Rosa Krausz
const PERGUNTAS_TEMPO = [
  "Poucas vezes planejo as atividades do meu próximo dia de trabalho.",
  "Trabalho sem surpresas ou problemas é monótono e cansativo.",
  "Às vezes deixo sem terminar o que começo.",
  "Falo muito.",
  "Depois de tomar uma decisão, fico em dúvida se foi a melhor.",
  "Nem sempre percebo a existência de problemas no trabalho.",
  "Quando delegar uma tarefa implica em dar muitas instruções, prefiro executá-la eu mesmo.",
  "Largo tudo o que estou fazendo para atender ao meu chefe quando ele me chama.",
  "Prefiro atender pessoalmente todos os telefonemas.",
  "Quando meus subordinados/colegas têm dificuldades ou problemas com o trabalho, eu os ajudo.",
  "Para mim trabalho é trabalho, independente da sua importância.",
  "A primeira coisa que faço ao chegar ao trabalho é cuidar das tarefas rotineiras.",
  "No trabalho faço questão de que tudo saia perfeito.",
  "Nunca me preocupei em definir meus objetivos de vida.",
  "Tenho certa dificuldade em reformular planos estabelecidos.",
  "Para trabalhar gosto de silêncio completo.",
  "Tenho dificuldade em aceitar que o planejamento ajude a resolver o problema da falta de tempo das pessoas.",
  "Sempre tenho coisas urgentes para fazer.",
  "Minhas gavetas estão sempre em desordem.",
  "Ao dar uma informação, é comum ter que repeti-la pois as pessoas têm dificuldade de me entender.",
  "Prefiro evitar decisões que envolvam riscos.",
  "É difícil evitar decisões que envolvam riscos.",
  "Tenho dificuldade para delegar trabalhos de certa responsabilidade.",
  "Evito dizer não às pessoas.",
  "O telefone é o pior inimigo do trabalho.",
  "É frequente fazer o trabalho de meus subordinados/colegas.",
  "Para mim a diferença entre urgente e prioritário nem sempre é muito clara.",
  "O rendimento do meu trabalho me parece igual em todas as horas do dia.",
  "Antes de assinar uma carta, leio e releio para ter certeza de que não tem erros.",
  "É inútil ter objetivos na vida, pois o que vale mesmo é o destino.",
  "Dificilmente mudo de opinião ou de ponto de vista.",
  "Tenho dificuldade para concentrar-me no que estou fazendo.",
  "Por mais que eu planeje meu dia de trabalho, sempre ficam coisas por fazer.",
  "Prefiro resolver os problemas depois deles acontecerem.",
  "Às vezes esqueço onde pus papéis, documentos e objetos.",
  "Muitas vezes as pessoas têm dificuldade para entender o que quero dizer.",
  "Penso bastante antes de tomar uma decisão.",
  "A maioria dos problemas tem causas que dificilmente podem ser previstas.",
  "Uso boa parte do meu tempo fazendo coisas que outros poderiam fazer.",
  "Quando as pessoas me pedem ajuda, dificilmente recuso-me a ajudá-las.",
  "Raramente telefono para confirmar reuniões, visitas, etc.",
  "Em geral, trabalho mais do que meus subordinados/colegas.",
  "É comum faltar-me tempo para fazer as coisas importantes.",
  "Costumo deixar os trabalhos de maior responsabilidade para o fim do expediente.",
  "Revejo o trabalho de meus subordinados para evitar possíveis erros.",
  'Procuro "tocar a vida para frente" sem esquentar muito a cabeça com o futuro.',
  'As pessoas me consideram "cabeça dura".',
  "Distraio-me facilmente com a movimentação das pessoas à minha volta.",
  "Prefiro resolver as coisas na hora do que planejar com antecedência.",
  "A maioria das coisas que acontece numa empresa é imprevisível.",
  "Costumo fazer várias coisas ao mesmo tempo.",
  "Tenho dificuldade para expressar minhas ideias.",
  "Só tomo decisões quando sou obrigado.",
  "Se os problemas fossem previsíveis, não existiriam.",
  "Só delego coisas para pessoas experientes.",
  "Dificilmente deixo de atender a uma visita inesperada, mesmo que esteja ocupado.",
  "As pessoas queixam-se de que meu telefone vive ocupado.",
  "Mesmo que eu esteja com muito trabalho, acabo me envolvendo no trabalho dos meus subordinados/colegas.",
  "Minhas prioridades são estabelecidas de acordo com a urgência.",
  "O dia foi feito para trabalhar e a noite para descansar.",
  "As pessoas dizem que sou detalhista.",
  "No mundo de hoje, onde tudo muda tão rapidamente, não adianta ter objetivos pessoais.",
  "Quando acho que algo está certo ou errado, ninguém me convence do contrário.",
  "Dificilmente me desligo do que está acontecendo à minha volta.",
  "Evito assumir compromissos para o futuro.",
  "Quando ocorre uma crise no trabalho, procuro resolve-la, em vez de perder tempo pensando como ela poderia ser evitada.",
  "Costumo guardar as coisas no trabalho sem lugar certo para cada uma delas.",
  "Ao transmitir uma informação, costumo perder-me nos detalhes.",
  "Tenho uma tendência a adiar as decisões.",
  "A maioria dos problemas só existe na cabeça das pessoas.",
  "Quem delega muito acaba sendo dispensável na empresa.",
  "Minha porta está sempre aberta para todos.",
  "Os telefonemas interrompem com frequência o meu trabalho.",
  'Quando meus subordinados/colegas estão atrasados com algum trabalho, sempre "dou uma mão".',
  "Nem sempre tenho uma ideia clara sobre os objetivos do meu trabalho.",
  "Gosto de comer bastante à hora do almoço.",
  "Há coisas do meu setor que só eu sei fazer bem feito.",
  "O amanhã a Deus pertence.",
  "Quando planejo o meu dia de trabalho, cumpro o planejamento custe o que custar.",
  "Quando sou interrompido no meio de um trabalho preciso de um tempo para retomá-lo.",
  "Faço as coisas sem me preocupar com o tempo.",
  "A competência de uma pessoa é diretamente proporcional à sua capacidade de resolver problemas de última hora.",
  "Para mim, é difícil manter a mesa de trabalho em ordem.",
  "Minha dificuldade em conversar com as pessoas atrapalha o rendimento do meu trabalho.",
  "Tomar decisões é uma tarefa difícil.",
  "Os problemas surgem sem que ninguém perceba.",
  "Há coisas de que gosto de fazer e que não delego por nada deste mundo.",
  'Na minha empresa sou "pau para toda obra".',
  "Prefiro escrever do que tratar com as pessoas pelo telefone.",
  "É comum meus subordinados terem menos serviço do que eu.",
  "Dificilmente estabeleço prazos para minhas tarefas.",
  "Para mim, qualquer horário durante o expediente é bom para fazer reuniões.",
  "Sou exigente comigo mesmo e com os outros.",
  'Os nossos objetivos independem de nós. "O homem põe e Deus dispõe".',
  "Quando me proponho a fazer algo, insisto até conseguir.",
  "As pessoas dizem que sou dispersivo.",
];

export default function PesquisaTempoPublica() {
  const params = useParams();
  const [avaliado, setAvaliado] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Arrays para controlar as respostas (Sim/Não) e se a pergunta já foi respondida
  const [respostas, setRespostas] = useState<boolean[]>(
    new Array(96).fill(false),
  );
  const [respondidas, setRespondidas] = useState<boolean[]>(
    new Array(96).fill(false),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const buscarAvaliado = async () => {
      // Faz o Join com a tabela PROJETOS e EMPRESAS para pegar o nome Fantasia
      const { data } = await supabase
        .from("AVALIACAO_TEMPO")
        .select("*, PROJETOS(EMPRESAS(nm_fantasia))")
        .eq("id", params.id)
        .maybeSingle();

      if (data) setAvaliado(data);
      setLoading(false);
    };
    buscarAvaliado();
  }, [params.id]);

  const marcarResposta = (index: number, valor: boolean) => {
    const novasRespostas = [...respostas];
    const novoPreenchimento = [...respondidas];

    novasRespostas[index] = valor;
    novoPreenchimento[index] = true;

    setRespostas(novasRespostas);
    setRespondidas(novoPreenchimento);
  };

  const enviarPesquisa = async () => {
    // Verifica se todas as 96 questões foram respondidas [cite: 5]
    if (respondidas.includes(false)) {
      return alert(
        "Por favor, responda todas as 96 afirmações para finalizar o inventário.",
      );
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("AVALIACAO_TEMPO")
        .update({
          cd_status: "concluido",
          js_respostas: respostas,
        })
        .eq("id", params.id);

      if (error) throw error;

      setAvaliado({ ...avaliado, cd_status: "concluido" });
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar suas respostas. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4 text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">
          progress_activity
        </span>
        <span className="font-bold">Carregando formulário...</span>
      </div>
    );
  }

  if (!avaliado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-4">
            error
          </span>
          <h2 className="text-xl font-bold text-slate-800">
            Link de pesquisa inválido ou expirado.
          </h2>
        </div>
      </div>
    );
  }

  if (avaliado.cd_status === "concluido") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
          <span className="material-symbols-outlined text-4xl">
            check_circle
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">
          Inventário Concluído!
        </h1>
        <p className="text-slate-500 max-w-md">
          Obrigado pelas suas respostas, <b>{avaliado.nm_avaliado}</b>. O seu
          relatório já foi enviado para análise do consultor.
        </p>
      </div>
    );
  }

  // Lógica para extrair o nome da empresa com segurança
  const empresaNome = avaliado?.PROJETOS?.EMPRESAS
    ? Array.isArray(avaliado.PROJETOS.EMPRESAS)
      ? avaliado.PROJETOS.EMPRESAS[0]?.nm_fantasia
      : avaliado.PROJETOS.EMPRESAS.nm_fantasia
    : "Não informada";

  const respondidasCount = respondidas.filter((r) => r).length;
  const progresso = Math.round((respondidasCount / 96) * 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* BARRA DE PROGRESSO FIXA */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
        <div
          className="h-full bg-[#FF8323] transition-all duration-300"
          style={{ width: `${progresso}%` }}
        ></div>
      </div>

      {/* CABEÇALHO COM INSTRUÇÕES */}
      <header className="bg-white border-b border-slate-200 p-6 text-center sticky top-1.5 z-40 shadow-sm">
        <h2 className="text-xl font-black text-[#064384] tracking-tight">
          Inventário de Administração do Tempo
        </h2>

        <div className="mt-3 flex flex-col items-center justify-center">
          <p className="text-sm font-bold text-slate-700">
            Olá, {avaliado.nm_avaliado}.
          </p>
          <span className="text-[10px] uppercase tracking-widest font-black text-[#FF8323] bg-orange-50 px-2 py-0.5 rounded mt-1">
            {empresaNome}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mt-5 max-w-2xl mx-auto">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Você irá ler 96 afirmações. Se a afirmação descrever o seu
            comportamento mais frequente, assinale <b>"SIM"</b>, se não,
            assinale <b>"NÃO"</b>.
          </p>
        </div>
      </header>

      {/* LISTA DE 96 QUESTÕES */}
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 mt-4">
        {PERGUNTAS_TEMPO.map((pergunta, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-[#064384]/30 transition-colors"
          >
            <p className="text-sm font-bold text-slate-700 leading-relaxed flex-1">
              <span className="text-[#064384]/50 font-black mr-2 text-xs">
                {index + 1}.
              </span>
              {pergunta}
            </p>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => marcarResposta(index, true)}
                className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all border-2 w-24 flex items-center justify-center gap-1
                  ${
                    respondidas[index] && respostas[index] === true
                      ? "bg-[#064384] text-white border-[#064384] shadow-md scale-105"
                      : "bg-slate-50 text-slate-400 border-slate-200 hover:border-[#064384] hover:text-[#064384] hover:bg-white"
                  }`}
              >
                {respondidas[index] && respostas[index] === true && (
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                )}
                SIM
              </button>

              <button
                onClick={() => marcarResposta(index, false)}
                className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all border-2 w-24 flex items-center justify-center gap-1
                  ${
                    respondidas[index] && respostas[index] === false
                      ? "bg-red-500 text-white border-red-500 shadow-md scale-105"
                      : "bg-slate-50 text-slate-400 border-slate-200 hover:border-red-500 hover:text-red-500 hover:bg-white"
                  }`}
              >
                {respondidas[index] && respostas[index] === false && (
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                )}
                NÃO
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* RODAPÉ COM BOTÃO DE FINALIZAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-sm border-t border-slate-200 p-4 px-6 flex justify-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={enviarPesquisa}
          disabled={isSaving || progresso < 100}
          className="w-full max-w-md bg-[#FF8323] hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-orange-500/30 disabled:opacity-60 disabled:shadow-none disabled:hover:bg-[#FF8323] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <span className="material-symbols-outlined animate-spin">sync</span>
          ) : progresso < 100 ? (
            <span>Faltam {96 - respondidasCount} questões</span>
          ) : (
            <>
              <span className="material-symbols-outlined">send</span>
              Finalizar Inventário
            </>
          )}
        </button>
      </div>
    </div>
  );
}
