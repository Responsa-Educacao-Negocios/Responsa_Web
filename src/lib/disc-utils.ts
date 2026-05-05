export const discQuestions = [
  { id: 1,  words: ["FOCADO", "ARTICULADO", "COMPREENSIVO", "CUIDADOSO"] },
  { id: 2,  words: ["PODEROSO", "ESPONTÂNEO", "TOLERANTE", "DETALHISTA"] },
  { id: 3,  words: ["COMPETITIVO", "AMIGÁVEL", "COLABORADOR", "PRECAVIDO"] },
  { id: 4,  words: ["DIRETO", "VISIONÁRIO", "PACIENTE", "LÓGICO"] },
  { id: 5,  words: ["INOVADOR", "ENTUSIASMADO", "PREVISÍVEL", "DISCIPLINADO"] },
  { id: 6,  words: ["OBJETIVO", "EXPRESSIVO", "SENSÍVEL", "ATENTO"] },
  { id: 7,  words: ["ASSERTIVO", "SOCIÁVEL", "CONFIÁVEL", "CAUTELOSO"] },
  { id: 8,  words: ["AMBICIOSO", "CARISMÁTICO", "HARMONIOSO", "OBSERVADOR"] },
  { id: 9,  words: ["AUTOCONFIANTE", "CRIATIVO", "TRANQUILO", "INVESTIGATIVO"] },
  { id: 10, words: ["INDEPENDENTE", "ALEGRE", "CONSERVADOR", "CRITERIOSO"] },
  { id: 11, words: ["DETERMINADO", "EXTROVERTIDO", "GENEROSO", "DESCONFIADO"] },
  { id: 12, words: ["PERSUASIVO", "DINÂMICO", "CALMO", "PERFECCIONISTA"] },
  { id: 13, words: ["ENERGÉTICO", "ENVOLVENTE", "COMPANHEIRO", "TÉCNICO"] },
  { id: 14, words: ["DESAFIADOR", "INSPIRADOR", "HUMILDE", "CRÍTICO"] },
  { id: 15, words: ["PIONEIRO", "MOTIVADOR", "ESTÁVEL", "SISTEMÁTICO"] },
  { id: 16, words: ["FIRME", "COMUNICATIVO", "APOIADOR", "IMERSO"] },
  { id: 17, words: ["DECIDIDO", "OTIMISTA", "SENSATO", "PRECISO"] },
  { id: 18, words: ["AGRESSIVO", "CATIVANTE", "LEAL", "RESERVADO"] },
  { id: 19, words: ["AUTÔNOMO", "PERSPICAZ", "GENTIL", "SÁBIO"] },
  { id: 20, words: ["INCISIVO", "ANIMADO", "DIPLOMÁTICO", "ESTRATÉGICO"] },
  { id: 21, words: ["CONTROLADOR", "CONVINCENTE", "AMOROSO", "ENVOLVIDO"] },
  { id: 22, words: ["DESENVOLVEDOR", "FLEXÍVEL", "PONDERADO", "MINUCIOSO"] },
  { id: 23, words: ["CONFRONTADOR", "POLÍTICO", "AGRADÁVEL", "EQUILIBRADO"] },
  { id: 24, words: ["IMPONENTE", "IDEALISTA", "PACÍFICO", "PROCESSUAL"] },
  { id: 25, words: ["AUDACIOSO", "EXAGERADO", "CONSISTENTE", "EXATO"] },
  { id: 26, words: ["DESCONFIADO", "EXTROVERTIDO", "DETERMINADO", "GENEROSO"] },
  { id: 27, words: ["PERFECCIONISTA", "DINÂMICO", "PERSUASIVO", "CALMO"] },
  { id: 28, words: ["TÉCNICO", "ENVOLVENTE", "ENERGÉTICO", "COMPANHEIRO"] },
  { id: 29, words: ["CRÍTICO", "INSPIRADOR", "DESAFIADOR", "HUMILDE"] },
  { id: 30, words: ["SISTEMÁTICO", "MOTIVADOR", "PIONEIRO", "ESTÁVEL"] },
  { id: 31, words: ["ENVOLVIDO", "CONVINCENTE", "CONTROLADOR", "AMOROSO"] },
  { id: 32, words: ["MINUCIOSO", "FLEXÍVEL", "DESENVOLVEDOR", "PONDERADO"] },
  { id: 33, words: ["EQUILIBRADO", "POLÍTICO", "CONFRONTADOR", "AGRADÁVEL"] },
  { id: 34, words: ["PROCESSUAL", "IDEALISTA", "IMPONENTE", "PACÍFICO"] },
  { id: 35, words: ["EXATO", "EXAGERADO", "AUDACIOSO", "CONSISTENTE"] },
  { id: 36, words: ["CUIDADOSO", "ARTICULADO", "FOCADO", "COMPREENSIVO"] },
  { id: 37, words: ["DETALHISTA", "ESPONTÂNEO", "PODEROSO", "TOLERANTE"] },
  { id: 38, words: ["PRECAVIDO", "AMIGÁVEL", "COMPETITIVO", "COLABORADOR"] },
  { id: 39, words: ["LÓGICO", "VISIONÁRIO", "DIRETO", "PACIENTE"] },
  { id: 40, words: ["DISCIPLINADO", "ENTUSIASMADO", "INOVADOR", "PREVISÍVEL"] },
  { id: 41, words: ["IMERSO", "COMUNICATIVO", "FIRME", "APOIADOR"] },
  { id: 42, words: ["PRECISO", "OTIMISTA", "DECIDIDO", "SENSATO"] },
  { id: 43, words: ["RESERVADO", "CATIVANTE", "AGRESSIVO", "LEAL"] },
  { id: 44, words: ["SÁBIO", "PERSPICAZ", "AUTÔNOMO", "GENTIL"] },
  { id: 45, words: ["ESTRATÉGICO", "ANIMADO", "INCISIVO", "DIPLOMÁTICO"] },
  { id: 46, words: ["ATENTO", "EXPRESSIVO", "OBJETIVO", "SENSÍVEL"] },
  { id: 47, words: ["CAUTELOSO", "SOCIÁVEL", "ASSERTIVO", "CONFIÁVEL"] },
  { id: 48, words: ["OBSERVADOR", "CARISMÁTICO", "AMBICIOSO", "HARMONIOSO"] },
  { id: 49, words: ["INVESTIGATIVO", "CRIATIVO", "AUTOCONFIANTE", "TRANQUILO"] },
  { id: 50, words: ["CRITERIOSO", "ALEGRE", "INDEPENDENTE", "CONSERVADOR"] },
];

export interface DiscScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

// Calcula D/I/S/C como percentuais (soma = ~100) a partir das respostas brutas
export function calcularPontuacaoDisc(
  respostasBrutas: Record<string, Record<string, number>>,
): DiscScores {
  let D = 0, I = 0, S = 0, C = 0;
  discQuestions.forEach((group) => {
    const ga = respostasBrutas[String(group.id)] || {};
    D += ga[group.words[0]] || 0;
    I += ga[group.words[1]] || 0;
    S += ga[group.words[2]] || 0;
    C += ga[group.words[3]] || 0;
  });
  const total = D + I + S + C || 1;
  return {
    D: Math.round((D / total) * 100),
    I: Math.round((I / total) * 100),
    S: Math.round((S / total) * 100),
    C: Math.round((C / total) * 100),
  };
}

// Retorna a letra (ou par de letras) predominante do perfil
export function derivarPerfilDisc(scores: DiscScores): string {
  const sorted = (Object.entries(scores) as [string, number][]).sort(
    ([, a], [, b]) => b - a,
  );
  const [topLetter, topVal] = sorted[0];
  const [secLetter, secVal] = sorted[1];
  return topVal - secVal < 10 ? topLetter + secLetter : topLetter;
}

// Aderência ao cargo: quanto menor a diferença média em relação aos alvos, maior a aderência
export function calcularAderencia(scores: DiscScores, alvos: DiscScores): number {
  const diffs = (["D", "I", "S", "C"] as (keyof DiscScores)[]).map((k) =>
    Math.abs(scores[k] - alvos[k]),
  );
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / 4;
  return Math.max(0, Math.round(100 - avgDiff));
}
