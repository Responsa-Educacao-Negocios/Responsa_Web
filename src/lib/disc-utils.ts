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

export interface Competencia {
  label: string;
  valor: number;
  alvo: number;
  letra: string;
}

// Helper functions for key normalization and score extraction
export function normalizeKey(s: string): string {
  return s.toUpperCase().replace(/[^A-Z]/g, "");
}

export function getWordScore(ga: Record<string, number>, cleanWord: string): number {
  const target = normalizeKey(cleanWord);
  for (const [key, val] of Object.entries(ga)) {
    if (normalizeKey(key) === target) {
      return val;
    }
  }
  return 0;
}

export function getInvSum(ga: Record<string, number>, cleanWord: string): number {
  const rank = getWordScore(ga, cleanWord);
  if (rank >= 1 && rank <= 4) {
    return 5 - rank;
  }
  return 0;
}

// Calculates Part 1 (Atual, questions 1-25) scores
export function calcularPontuacaoDisc(
  respostasBrutas: Record<string, Record<string, number>>,
): DiscScores {
  let D = 0, I = 0, S = 0, C = 0;
  for (let id = 1; id <= 25; id++) {
    const ga = respostasBrutas[String(id)] || {};
    const group = discQuestions[id - 1];
    D += getInvSum(ga, group.words[0]);
    I += getInvSum(ga, group.words[1]);
    S += getInvSum(ga, group.words[2]);
    C += getInvSum(ga, group.words[3]);
  }
  return {
    D: Math.round(D / 2.5),
    I: Math.round(I / 2.5),
    S: Math.round(S / 2.5),
    C: Math.round(C / 2.5),
  };
}

// Calculates Part 2 (Exigência do Meio, questions 26-50) scores
export function calcularExigenciaMeio(
  respostasBrutas: Record<string, Record<string, number>>,
): DiscScores {
  let D = 0, I = 0, S = 0, C = 0;
  for (let id = 26; id <= 50; id++) {
    const ga = respostasBrutas[String(id)] || {};
    const group = discQuestions[id - 1];
    // Order in Part 2 is [C, I, D, S]
    C += getInvSum(ga, group.words[0]);
    I += getInvSum(ga, group.words[1]);
    D += getInvSum(ga, group.words[2]);
    S += getInvSum(ga, group.words[3]);
  }
  return {
    D: Math.round(D / 2.5),
    I: Math.round(I / 2.5),
    S: Math.round(S / 2.5),
    C: Math.round(C / 2.5),
  };
}

// Derives dominant profiles and returns them as a concatenated string (e.g. "SI", "I", "DIS")
export function derivarPerfilDisc(
  scores: DiscScores,
  respostasBrutas?: Record<string, Record<string, number>>
): string {
  if (respostasBrutas) {
    let D_sum = 0, I_sum = 0, S_sum = 0, C_sum = 0;
    for (let id = 1; id <= 25; id++) {
      const ga = respostasBrutas[String(id)] || {};
      const group = discQuestions[id - 1];
      D_sum += getInvSum(ga, group.words[0]);
      I_sum += getInvSum(ga, group.words[1]);
      S_sum += getInvSum(ga, group.words[2]);
      C_sum += getInvSum(ga, group.words[3]);
    }
    const D_score = D_sum / 250;
    const I_score = I_sum / 250;
    const S_score = S_sum / 250;
    const C_score = C_sum / 250;

    // Tie-breaker floats
    const D_tb = D_score + 0.0000012;
    const I_tb = I_score + 0.0000013;
    const S_tb = S_score + 0.0000014;
    const C_tb = C_score + 0.0000011;

    const profiles = [
      { letter: "D", score: D_score, tb: D_tb },
      { letter: "I", score: I_score, tb: I_tb },
      { letter: "S", score: S_score, tb: S_tb },
      { letter: "C", score: C_score, tb: C_tb },
    ];
    profiles.sort((a, b) => b.tb - a.tb);

    // Dominant profiles are score >= 25% (0.25)
    const dominant = profiles.filter(p => p.score >= 0.25);
    const topDominant = dominant.slice(0, 3);
    if (topDominant.length > 0) {
      return topDominant.map(p => p.letter).join("");
    }
    return profiles[0].letter; // Fallback to highest
  }

  // Fallback signature to keep compatibility if only scores are provided
  const sorted = (Object.entries(scores) as [string, number][]).sort(
    ([, a], [, b]) => b - a,
  );
  const [topLetter, topVal] = sorted[0];
  const [secLetter, secVal] = sorted[1];
  return topVal - secVal < 10 ? topLetter + secLetter : topLetter;
}

// Dynamically calculates the 20 competencies at runtime (10 pairs)
export function calcularCompetenciasDisc(
  respostasBrutas: Record<string, Record<string, number>>
): Competencia[] {
  const competencyPairs = [
    {
      nameA: "Orientado por Resultados",
      nameB: "Empatia",
      wordsA: ["FOCADO", "OBJETIVO", "DETERMINADO", "FIRME", "CONTROLADOR"],
      wordsB: ["COMPREENSIVO", "SENSÍVEL", "GENEROSO", "APOIADOR", "AMOROSO"],
      letraA: "D",
      letraB: "S"
    },
    {
      nameA: "Persuasão",
      nameB: "Tolerância",
      wordsA: ["PODEROSO", "ASSERTIVO", "PERSUASIVO", "DECIDIDO", "DESENVOLVEDOR"],
      wordsB: ["TOLERANTE", "CONFIÁVEL", "CALMO", "SENSATO", "PONDERADO"],
      letraA: "D",
      letraB: "S"
    },
    {
      nameA: "Competitividade",
      nameB: "Capacidade de Trabalhar em Equipe",
      wordsA: ["COMPETITIVO", "AMBICIOSO", "ENERGÉTICO", "AGRESSIVO", "CONFRONTADOR"],
      wordsB: ["COLABORADOR", "HARMONIOSO", "COMPANHEIRO", "LEAL", "AGRADÁVEL"],
      letraA: "D",
      letraB: "S"
    },
    {
      nameA: "Energia",
      nameB: "Paciência",
      wordsA: ["DIRETO", "AUTOCONFIANTE", "DESAFIADOR", "AUTÔNOMO", "IMPONENTE"],
      wordsB: ["PACIENTE", "TRANQUILO", "HUMILDE", "GENTIL", "PACÍFICO"],
      letraA: "D",
      letraB: "S"
    },
    {
      nameA: "Multitarefas",
      nameB: "Planejamento",
      wordsA: ["INOVADOR", "INDEPENDENTE", "PIONEIRO", "INCISIVO", "AUDACIOSO"],
      wordsB: ["PREVISÍVEL", "CONSERVADOR", "ESTÁVEL", "DIPLOMÁTICO", "CONSISTENTE"],
      letraA: "D",
      letraB: "S"
    },
    {
      nameA: "Comunicação",
      nameB: "Concentração",
      wordsA: ["ARTICULADO", "EXPRESSIVO", "EXTROVERTIDO", "COMUNICATIVO", "CONVINCENTE"],
      wordsB: ["CUIDADOSO", "ATENTO", "DESCONFIADO", "IMERSO", "ENVOLVIDO"],
      letraA: "I",
      letraB: "C"
    },
    {
      nameA: "Flexibilidade",
      nameB: "Atenção aos Detalhes",
      wordsA: ["ESPONTÂNEO", "SOCIÁVEL", "DINÂMICO", "OTIMISTA", "FLEXÍVEL"],
      wordsB: ["DETALHISTA", "CAUTELOSO", "PERFECCIONISTA", "PRECISO", "MINUCIOSO"],
      letraA: "I",
      letraB: "C"
    },
    {
      nameA: "Relacionamento Interpessoal",
      nameB: "Rigorosidade",
      wordsA: ["AMIGÁVEL", "CARISMÁTICO", "ENVOLVENTE", "CATIVANTE", "POLÍTICO"],
      wordsB: ["PRECAVIDO", "OBSERVADOR", "TÉCNICO", "RESERVADO", "EQUILIBRADO"],
      letraA: "I",
      letraB: "C"
    },
    {
      nameA: "Criatividade",
      nameB: "Análise",
      wordsA: ["VISIONÁRIO", "CRIATIVO", "INSPIRADOR", "PERSPICAZ", "IDEALISTA"],
      wordsB: ["LÓGICO", "INVESTIGATIVO", "CRÍTICO", "SÁBIO", "PROCESSUAL"],
      letraA: "I",
      letraB: "C"
    },
    {
      nameA: "Entusiasmo",
      nameB: "Consistência",
      wordsA: ["ENTUSIASMADO", "ALEGRE", "MOTIVADOR", "ANIMADO", "EXAGERADO"],
      wordsB: ["DISCIPLINADO", "CRITERIOSO", "SISTEMÁTICO", "ESTRATÉGICO", "EXATO"],
      letraA: "I",
      letraB: "C"
    }
  ];

  const part1Answers: Record<string, number> = {};
  const part2Answers: Record<string, number> = {};

  for (let id = 1; id <= 25; id++) {
    const ga = respostasBrutas[String(id)] || {};
    const group = discQuestions[id - 1];
    group.words.forEach((w) => {
      part1Answers[normalizeKey(w)] = getWordScore(ga, w);
    });
  }

  for (let id = 26; id <= 50; id++) {
    const ga = respostasBrutas[String(id)] || {};
    const group = discQuestions[id - 1];
    group.words.forEach((w) => {
      part2Answers[normalizeKey(w)] = getWordScore(ga, w);
    });
  }

  const result: Competencia[] = [];

  competencyPairs.forEach((pair) => {
    // Part 1 score (Atual)
    const sumA_1 = pair.wordsA.reduce((sum, w) => {
      const rank = part1Answers[normalizeKey(w)] || 0;
      return sum + (rank >= 1 && rank <= 4 ? 5 - rank : 0);
    }, 0);
    const sumB_1 = pair.wordsB.reduce((sum, w) => {
      const rank = part1Answers[normalizeKey(w)] || 0;
      return sum + (rank >= 1 && rank <= 4 ? 5 - rank : 0);
    }, 0);

    // Part 2 score (Exigência)
    const sumA_2 = pair.wordsA.reduce((sum, w) => {
      const rank = part2Answers[normalizeKey(w)] || 0;
      return sum + (rank >= 1 && rank <= 4 ? 5 - rank : 0);
    }, 0);
    const sumB_2 = pair.wordsB.reduce((sum, w) => {
      const rank = part2Answers[normalizeKey(w)] || 0;
      return sum + (rank >= 1 && rank <= 4 ? 5 - rank : 0);
    }, 0);

    const total1 = sumA_1 + sumB_1;
    const total2 = sumA_2 + sumB_2;

    const valA = total1 > 0 ? Math.round((sumA_1 / total1) * 100) : 0;
    const valB = total1 > 0 ? Math.round((sumB_1 / total1) * 100) : 0;

    const alvoA = total2 > 0 ? Math.round((sumA_2 / total2) * 100) : 0;
    const alvoB = total2 > 0 ? Math.round((sumB_2 / total2) * 100) : 0;

    result.push({
      label: pair.nameA,
      valor: valA,
      alvo: alvoA,
      letra: pair.letraA
    });
    result.push({
      label: pair.nameB,
      valor: valB,
      alvo: alvoB,
      letra: pair.letraB
    });
  });

  return result;
}

// Aderência ao cargo: how well the scores match the targets
export function calcularAderencia(scores: DiscScores, alvos: DiscScores): number {
  const diffs = (["D", "I", "S", "C"] as (keyof DiscScores)[]).map((k) =>
    Math.abs(scores[k] - alvos[k]),
  );
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / 4;
  return Math.max(0, Math.round(100 - avgDiff));
}

// Generates the Interaction with Environment dynamic feedback paragraph
export function getInteracaoMeioFeedback(atual: DiscScores, exigencia: DiscScores): string {
  const intro = "Esse gráfico comparativo, indica o resultado dos seus perfis (coluna azul), sua avaliação do quanto cada perfil é exigido de você pelo meio que convive (coluna vermelha) e o quanto você se adapta a esse meio (linha roxa). Trata-se da junção dos gráficos anteriores para efeito de comparação.\nMudanças acima de 5pp podem gerar desconforto, pois são mudanças sensíveis a serem feitas e sob situações de estresse e conflito são ainda mais difíceis.\nVale a ressalva de que se a mudança for para aumentar alguma característica do perfil gera mais desconforto ainda, pois pode ser extremamente difícil ter atitudes ou comportamentos que não são naturais a pessoa, portanto precisa ser observado e realizado aos poucos a fim de não gerar nenhum tipo de trauma.";

  const diffs = {
    D: exigencia.D - atual.D,
    I: exigencia.I - atual.I,
    S: exigencia.S - atual.S,
    C: exigencia.C - atual.C
  };

  const flagged: { label: string; val: number; sign: "Positivo" | "Negativo" }[] = [];
  if (Math.abs(diffs.D) > 5) flagged.push({ label: "DOMINÂNCIA (D)", val: diffs.D, sign: diffs.D > 0 ? "Positivo" : "Negativo" });
  if (Math.abs(diffs.I) > 5) flagged.push({ label: "INFLUÊNCIA (I)", val: diffs.I, sign: diffs.I > 0 ? "Positivo" : "Negativo" });
  if (Math.abs(diffs.S) > 5) flagged.push({ label: "ESTABILIDADE (S)", val: diffs.S, sign: diffs.S > 0 ? "Positivo" : "Negativo" });
  if (Math.abs(diffs.C) > 5) flagged.push({ label: "CONFORMIDADE (C)", val: diffs.C, sign: diffs.C > 0 ? "Positivo" : "Negativo" });

  if (flagged.length === 0) {
    return `${intro}\n\nPelo seu gráfico é possível observar que as diferenças são pequenas, abaixo de 5pp, o que sugere que você está bem adaptado ao seu momento, porém nessas situações as pessoas podem se sentir entediadas e questionando o que pode ser melhorado. Talvez seja hora de buscar novos desafios.\nCaso julgue necessário, o quadro abaixo dará uma ideia de quais características você pode trabalhar para aumentar ou diminuir cada um dos seus perfis.`;
  }

  let middleSentence = "";
  if (flagged.length === 1) {
    middleSentence = "Pelo seu gráfico é possível observar que você precisa realizar a adequação de um dos seus perfis:\n";
  } else if (flagged.length === 2) {
    middleSentence = "Pelo seu gráfico é possível observar que você precisa realizar a adequação de dois dos seus perfis, conforme abaixo:\n";
  } else if (flagged.length === 3) {
    middleSentence = "Pelo seu gráfico é possível observar que você precisa realizar a adequação de três dos seus perfis. Se tratando de 3 adequações acima da margem de 5pp, é preciso atenção e uma reavaliação do seu momento. Segue abaixo os perfis que descolam do meio de convivência:\n";
  } else {
    middleSentence = "Pelo seu gráfico é possível observar que você precisa realizar a adequação em todos os perfis. Se tratando desse tipo de adequação, é preciso atenção e uma reavaliação do seu momento. Segue abaixo os perfis que descolam do meio de convivência:\n";
  }

  const flaggedLines = flagged.map(f => `${f.label}  com uma mudança de ${f.val}pp`).join("\n");

  let finalSentence = "";
  const numPos = flagged.filter(f => f.sign === "Positivo").length;
  const totalFlagged = flagged.length;

  if (totalFlagged >= 2) {
    finalSentence = "No seu gráfico temos que realizar aumentos e reduções de perfis, isso ocorre pois a adaptação precisa ser maior, avalie com calma a necessidade dessa adequação e o quanto isso realmente faz sentido para o seu momento. Existem situações em que as mudanças são tão drásticas que corremos o risco de perder parte da nossa identidade. No quadro abaixo é possível avaliar um conjunto de características que você poderá trabalhar para adaptar-se a necessidade do meio de convivência.";
  } else if (numPos > 0) {
    finalSentence = "Se tratando de um aumento (número positivo), é preciso que você trabalhe para aumentar ou adquirir características desse perfil. No quadro abaixo é possível avaliar um conjunto de características que você poderá trabalhar para adaptar-se a necessidade do meio de convivência.";
  } else {
    finalSentence = "Se tratando de redução (número negativo), é preciso que você trabalhe para diminuir características desse perfil. No quadro abaixo é possível avaliar um conjunto de características que você poderá trabalhar para adaptar-se a necessidade do meio de convivência.";
  }

  return `${intro}\n\n${middleSentence}\n${flaggedLines}\n\n${finalSentence}`;
}
