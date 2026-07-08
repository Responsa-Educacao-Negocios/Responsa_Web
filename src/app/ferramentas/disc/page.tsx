"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/lib/supabase";
import {
  calcularPontuacaoDisc,
  calcularExigenciaMeio,
  derivarPerfilDisc,
  calcularCompetenciasDisc,
  calcularAderencia,
  getInteracaoMeioFeedback,
} from "@/lib/disc-utils";
import {
  DISC_COMBINATIONS,
  DISC_SINGLE_PROFILES,
  DISC_PROFILE_DETAILS,
  DISC_COMPETENCIES_DESC,
} from "@/lib/disc-data";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AvaliacaoDISC {
  cd_avaliacao: string;
  ts_criacao: string;
  nm_empresa: string;
  nm_avaliado: string;
  tp_status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";
  js_respostas: Record<string, Record<string, number>> | null;
  ds_observacao: string | null;
}

const PERFIL_INFO: Record<string, {
  nome: string;
  descricao: string;
  pontosFortess: string[];
  pontosAtencao: string[];
  motivadores: string[];
  comunicacao: string;
  ambienteIdeal: string;
  cor: string;
}> = {
  D: {
    nome: "Dominância (Executor)",
    descricao:
      "Perfil orientado a resultados, direto, competitivo e movido por desafios. Tende a assumir o controle rapidamente e não tem medo de tomar decisões difíceis. Prefere ambientes de ritmo acelerado onde possa influenciar os resultados.",
    pontosFortess: [
      "Determinação e foco em resultados",
      "Tomada de decisão rápida e assertiva",
      "Capacidade de liderança e influência",
      "Alta capacidade de superar obstáculos",
      "Orientado à ação e à entrega",
    ],
    pontosAtencao: [
      "Pode ser percebido como autoritário ou impaciente",
      "Tende a negligenciar detalhes importantes",
      "Dificuldade em ouvir opiniões divergentes",
      "Pode colocar resultados acima das relações",
    ],
    motivadores: [
      "Desafios e metas ambiciosas",
      "Autonomia e controle sobre o trabalho",
      "Reconhecimento por conquistas",
      "Oportunidades de liderança",
    ],
    comunicacao:
      "Seja direto e objetivo. Vá direto ao ponto, apresente fatos e resultados. Evite rodeios e longas justificativas. Respeite o tempo desta pessoa.",
    ambienteIdeal:
      "Ambientes de ritmo acelerado, com autonomia para tomar decisões, oportunidades de liderança e desafios constantes. Prefere pouca supervisão.",
    cor: "#ef4444",
  },
  I: {
    nome: "Influência (Comunicador)",
    descricao:
      "Perfil extrovertido, persuasivo, otimista e focado em pessoas. Excelente em networking, criação de relacionamentos e engajamento de equipes. Gosta de ambientes dinâmicos e cheios de interação social.",
    pontosFortess: [
      "Habilidade excepcional de comunicação",
      "Capacidade de influenciar e engajar pessoas",
      "Entusiasmo e energia contagiante",
      "Criatividade e geração de ideias",
      "Facilidade em construir relacionamentos",
    ],
    pontosAtencao: [
      "Pode ter dificuldade com foco e prazo",
      "Tende a ser impulsivo nas decisões",
      "Pode evitar conflitos necessários",
      "Dificuldade com tarefas repetitivas e analíticas",
    ],
    motivadores: [
      "Reconhecimento público e elogios",
      "Interação social e trabalho em equipe",
      "Novas experiências e variedade",
      "Liberdade para expressar criatividade",
    ],
    comunicacao:
      "Seja caloroso e entusiasta. Demonstre interesse pela pessoa antes dos negócios. Use histórias e exemplos. Valorize suas ideias e opiniões.",
    ambienteIdeal:
      "Ambientes colaborativos, com foco em pessoas e relacionamentos. Gosta de variedade de tarefas, interação constante e oportunidades de se expressar.",
    cor: "#f59e0b",
  },
  S: {
    nome: "Estabilidade (Planejador)",
    descricao:
      "Perfil calmo, paciente, leal e excelente ouvinte. Gosta de rotinas bem estabelecidas, ambientes harmoniosos e relacionamentos de longo prazo. É confiável, consistente e excelente em trabalho em equipe.",
    pontosFortess: [
      "Lealdade e comprometimento de longo prazo",
      "Excelente capacidade de ouvir e apoiar",
      "Consistência e confiabilidade nas entregas",
      "Habilidade de manter harmonia no grupo",
      "Paciência e tolerância sob pressão",
    ],
    pontosAtencao: [
      "Resistência a mudanças repentinas",
      "Dificuldade em dizer não",
      "Pode evitar conflitos necessários",
      "Demora para tomar decisões em situações novas",
    ],
    motivadores: [
      "Estabilidade e segurança no trabalho",
      "Harmonia nas relações interpessoais",
      "Reconhecimento pela lealdade e dedicação",
      "Ambiente de trabalho previsível",
    ],
    comunicacao:
      "Seja paciente e demonstre sinceridade. Construa confiança antes de pedir ação. Explique as razões das mudanças. Evite pressioná-la.",
    ambienteIdeal:
      "Ambientes estáveis, com clareza de funções, trabalho em equipe e pouca mudança repentina. Valoriza segurança, relacionamentos duradouros e reconhecimento pela dedicação.",
    cor: "#10b981",
  },
  C: {
    nome: "Conformidade (Analista)",
    descricao:
      "Perfil preciso, detalhista, lógico e focado em regras e qualidade. Toma decisões baseadas em dados e fatos. É sistemático, organizado e exige altos padrões de qualidade em tudo que faz.",
    pontosFortess: [
      "Alta precisão e atenção aos detalhes",
      "Pensamento analítico e lógico",
      "Compromisso com qualidade e exatidão",
      "Planejamento estruturado e organizado",
      "Tomada de decisão baseada em dados",
    ],
    pontosAtencao: [
      "Pode ser excessivamente crítico com erros",
      "Tende à paralisia por análise",
      "Dificuldade em lidar com ambiguidade",
      "Pode ser percebido como frio ou distante",
    ],
    motivadores: [
      "Trabalho com alta qualidade e exatidão",
      "Acesso a dados e informações completas",
      "Processos e procedimentos claros",
      "Reconhecimento pela expertise técnica",
    ],
    comunicacao:
      "Apresente dados, fatos e evidências. Seja preciso e prepare-se para perguntas detalhadas. Dê tempo suficiente para análise. Evite generalizações.",
    ambienteIdeal:
      "Ambientes estruturados, com processos claros, alta qualidade e foco em excelência técnica. Valoriza informações completas antes de decidir.",
    cor: "#3b82f6",
  },
};

function gerarHTMLRelatorioDisc(av: AvaliacaoDISC): string {
  const respostas = av.js_respostas || {};
  const scores = calcularPontuacaoDisc(respostas);
  const exigencia = calcularExigenciaMeio(respostas);
  const competencies = calcularCompetenciasDisc(respostas);
  const perfil = derivarPerfilDisc(scores, respostas);

  const letraPrincipal = perfil[0] as "D" | "I" | "S" | "C";
  const info = PERFIL_INFO[letraPrincipal] || PERFIL_INFO.D;

  const dataFormatada = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const totalScore = scores.D + scores.I + scores.S + scores.C;
  const pctD = totalScore > 0 ? Math.round((scores.D / totalScore) * 100) : 0;
  const pctI = totalScore > 0 ? Math.round((scores.I / totalScore) * 100) : 0;
  const pctS = totalScore > 0 ? Math.round((scores.S / totalScore) * 100) : 0;
  const pctC = totalScore > 0 ? Math.round((scores.C / totalScore) * 100) : 0;

  const exigTotal = exigencia.D + exigencia.I + exigencia.S + exigencia.C;
  const epD = exigTotal > 0 ? Math.round((exigencia.D / exigTotal) * 100) : 0;
  const epI = exigTotal > 0 ? Math.round((exigencia.I / exigTotal) * 100) : 0;
  const epS = exigTotal > 0 ? Math.round((exigencia.S / exigTotal) * 100) : 0;
  const epC = exigTotal > 0 ? Math.round((exigencia.C / exigTotal) * 100) : 0;

  const perfilCompleto = perfil.split("").map(l => {
    const i = PERFIL_INFO[l as "D"|"I"|"S"|"C"];
    return `<span style="color:${i?.cor || '#064384'}; font-weight:900;">${l}</span>`;
  }).join(" · ");

  const code = perfil || "";
  const letterToNumber: Record<string, string> = { D: "1", I: "2", S: "3", C: "4" };
  const numericCode = code.split("").map(l => letterToNumber[l] || "").join("");
  const combinationText = DISC_COMBINATIONS[numericCode] || "";
  const primaryLetter = code[0] || "D";
  const singleProfileText = DISC_SINGLE_PROFILES[primaryLetter] || "";
  const profileDescription = [combinationText, singleProfileText].filter(Boolean).join("\n\n");

  const feedbackText = getInteracaoMeioFeedback(scores, exigencia);

  const letters = code.split("");
  const characteristicsHtml = letters.map(letter => {
    const details = DISC_PROFILE_DETAILS[letter];
    if (!details) return "";
    const label = letter === "D" ? "DOMINÂNCIA (D)" : letter === "I" ? "INFLUÊNCIA (I)" : letter === "S" ? "ESTABILIDADE (S)" : "CONFORMIDADE (C)";
    const colorClass = letter === "D" ? "#dc2626" : letter === "I" ? "#d97706" : letter === "S" ? "#16a34a" : "#2563eb";
    const bgLight = letter === "D" ? "#fef2f2" : letter === "I" ? "#fffbeb" : letter === "S" ? "#f0fdf4" : "#eff6ff";
    const borderLight = letter === "D" ? "#fecaca" : letter === "I" ? "#fef3c7" : letter === "S" ? "#bbf7d0" : "#bfdbfe";
    return `
      <div style="flex: 1; min-width: 0; border: 1px solid ${borderLight}; border-radius: 12px; padding: 18px; background: ${bgLight}; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <h3 style="font-size: 14px; font-weight: 800; color: ${colorClass}; border-bottom: 2px solid ${borderLight}; padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase;">${label}</h3>
          
          <h4 style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; margin-top: 0;">Palavras-chave</h4>
          <ul style="padding-left: 14px; margin-bottom: 12px; font-size: 11.5px; color: #334155; line-height: 1.35;">
            ${details.keywords.slice(0, 5).map(w => `<li>${w}</li>`).join("")}
          </ul>

          <h4 style="font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase; margin-bottom: 4px; margin-top: 0;">Pontos Fortes</h4>
          <ul style="padding-left: 14px; margin-bottom: 12px; font-size: 11.5px; color: #15803d; line-height: 1.35;">
            ${details.strengths.slice(0, 5).map(w => `<li>${w}</li>`).join("")}
          </ul>

          <h4 style="font-size: 11px; font-weight: 700; color: #ea580c; text-transform: uppercase; margin-bottom: 4px; margin-top: 0;">Pontos a Desenvolver</h4>
          <ul style="padding-left: 14px; margin-bottom: 12px; font-size: 11.5px; color: #c2410c; line-height: 1.35;">
            ${details.develop.slice(0, 5).map(w => `<li>${w}</li>`).join("")}
          </ul>
        </div>

        <div>
          <h4 style="font-size: 11px; font-weight: 700; color: #dc2626; text-transform: uppercase; margin-bottom: 4px; margin-top: 0;">Sob Pressão</h4>
          <p style="font-size: 11.5px; color: #b91c1c; font-weight: 600; margin: 0; line-height: 1.35;">
            ${details.pressure[0] || ""}
          </p>
        </div>
      </div>
    `;
  }).join("");

  const comparisonChartsHtml = [
    { letter: "D", name: "DOMINÂNCIA (D)", val: pctD, target: epD },
    { letter: "I", name: "INFLUÊNCIA (I)", val: pctI, target: epI },
    { letter: "S", name: "ESTABILIDADE (S)", val: pctS, target: epS },
    { letter: "C", name: "CONFORMIDADE (C)", val: pctC, target: epC }
  ].map(p => {
    const adapt = Math.max(0, Math.min(100, Math.round(p.val + (p.val - p.target))));
    return `
      <div style="margin-bottom: 18px; box-sizing: border-box;">
        <div style="font-size: 13px; font-weight: bold; color: #1e293b; margin-bottom: 6px;">${p.name}</div>
        
        <div style="display: flex; flex-direction: column; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; box-sizing: border-box;">
          <!-- Natural -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 10px; font-weight: bold; width: 90px; color: #064384;">Perfil Atual:</span>
            <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; position: relative;">
              <div style="width: ${p.val}%; height: 100%; background: #064384; border-radius: 5px;"></div>
            </div>
            <span style="font-size: 11px; font-weight: bold; width: 35px; text-align: right; color: #064384;">${p.val}%</span>
          </div>
          
          <!-- Exigência -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 10px; font-weight: bold; width: 90px; color: #dc2626;">Exigência:</span>
            <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; position: relative;">
              <div style="width: ${p.target}%; height: 100%; background: #dc2626; border-radius: 5px;"></div>
            </div>
            <span style="font-size: 11px; font-weight: bold; width: 35px; text-align: right; color: #dc2626;">${p.target}%</span>
          </div>
          
          <!-- Adaptado -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 10px; font-weight: bold; width: 90px; color: #8B5CF6;">Adaptado:</span>
            <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; position: relative;">
              <div style="width: ${adapt}%; height: 100%; background: #8B5CF6; border-radius: 5px;"></div>
            </div>
            <span style="font-size: 11px; font-weight: bold; width: 35px; text-align: right; color: #8B5CF6;">${adapt}%</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const renderCompetenciesSubPage = (letra: "D" | "I" | "S" | "C", title: string, color: string, pageNum: number) => {
    const groupComps = competencies.filter(c => c.letra === letra);
    const compsHtml = groupComps.map(c => {
      const desc = DISC_COMPETENCIES_DESC[c.label] || "";
      return `
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; background: #f8fafc; box-sizing: border-box; margin-bottom: 12px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: #1e293b; font-size: 13px; margin-bottom: 6px;">
            <span>${c.label}</span>
            <span style="font-size: 11px; color: #64748b; font-weight: 700;">Atual: ${c.valor}% / Exigência: ${c.alvo}%</span>
          </div>
          <div style="position: relative; height: 10px; background: #e2e8f0; border-radius: 5px; width: 100%; margin-bottom: 6px; overflow: hidden;">
            <div style="position: absolute; left: 0; top: 0; height: 100%; background: #fee2e2; border-left: 2px solid #EF4444; width: ${c.alvo}%;"></div>
            <div style="position: absolute; left: 0; top: 2px; height: 6px; background: #064384; width: ${c.valor}%; border-radius: 3px;"></div>
          </div>
          <p style="color: #475569; font-size: 11.5px; line-height: 1.4; margin: 0; text-align: justify;">${desc}</p>
        </div>
      `;
    }).join("");

    return `
      <!-- PAGE ${pageNum}: COMPETENCIAS ${letra} -->
      <div class="page page-break">
        <div class="page-header">
          <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
          <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
        </div>
        
        <div class="page-content">
          <div class="section-title"><span class="section-number">${pageNum - 1}</span>Competências do Perfil Comportamental</div>
          <h2 class="section-heading" style="color: ${color};">${title}</h2>
          
          <div style="margin-top: 15px; flex: 1;">
            ${compsHtml}
          </div>
        </div>

        <div class="page-footer">
          <span>Candidato: ${av.nm_avaliado}</span>
          <span>Página ${pageNum} de 12</span>
        </div>
      </div>
    `;
  };

  const renderPage12 = () => {
    const groupComps = competencies.filter(c => c.letra === "C");
    const compsHtml = groupComps.map(c => {
      const desc = DISC_COMPETENCIES_DESC[c.label] || "";
      return `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #f8fafc; box-sizing: border-box; margin-bottom: 8px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: #1e293b; font-size: 12px; margin-bottom: 4px;">
            <span>${c.label}</span>
            <span style="font-size: 10px; color: #64748b; font-weight: 700;">Atual: ${c.valor}% / Exigência: ${c.alvo}%</span>
          </div>
          <div style="position: relative; height: 8px; background: #e2e8f0; border-radius: 4px; width: 100%; margin-bottom: 4px; overflow: hidden;">
            <div style="position: absolute; left: 0; top: 0; height: 100%; background: #fee2e2; border-left: 2px solid #EF4444; width: ${c.alvo}%;"></div>
            <div style="position: absolute; left: 0; top: 2px; height: 4px; background: #064384; width: ${c.valor}%; border-radius: 2px;"></div>
          </div>
          <p style="color: #475569; font-size: 11px; line-height: 1.35; margin: 0; text-align: justify;">${desc}</p>
        </div>
      `;
    }).join("");

    const obsText = (av.ds_observacao || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `
      <!-- PAGE 12: COMPETENCIAS C & PDI -->
      <div class="page page-break">
        <div class="page-header">
          <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
          <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
        </div>
        
        <div class="page-content" style="justify-content: space-between;">
          <div>
            <div class="section-title"><span class="section-number">11</span>Competências do Perfil Comportamental</div>
            <h2 class="section-heading" style="color: #2563eb; margin-bottom: 10px;">Conformidade (C)</h2>
            <div style="margin-top: 10px;">
              ${compsHtml}
            </div>
          </div>

          <div style="margin-top: 15px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
            <div class="section-title"><span class="section-number">12</span>Plano de Desenvolvimento Individual</div>
            <h2 class="section-heading" style="font-size: 16px; margin-bottom: 8px;">Observações do Consultor & PDI</h2>
            ${obsText ? `
            <div class="pdi-box" style="padding: 12px 16px; margin: 0;">
              <p class="pdi-content" style="font-size: 11.5px; line-height: 1.4; margin: 0;">${obsText}</p>
            </div>
            ` : `
            <div class="pdi-box" style="padding: 12px 16px; margin: 0; min-height: 60px;">
              <p style="color:#94a3b8; font-size:11.5px; font-style:italic; margin: 0;">Nenhuma observação registrada pelo consultor.</p>
            </div>
            `}
          </div>
        </div>

        <div class="page-footer">
          <span>Candidato: ${av.nm_avaliado}</span>
          <span>Página 12 de 12</span>
        </div>
      </div>
    `;
  };

  const page9 = renderCompetenciesSubPage("D", "Dominância (D)", "#dc2626", 9);
  const page10 = renderCompetenciesSubPage("I", "Influência (I)", "#d97706", 10);
  const page11 = renderCompetenciesSubPage("S", "Estabilidade (S)", "#16a34a", 11);
  const page12 = renderPage12();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório DISC — ${av.nm_avaliado}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #f1f5f9; }
  
  .page {
    width: 210mm;
    height: 297mm;
    margin: 20px auto;
    padding: 20mm;
    background: white;
    box-sizing: border-box;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .page-break {
    page-break-after: always;
  }
  
  @media print {
    body {
      background: white;
      padding: 0;
      margin: 0;
    }
    .page {
      margin: 0;
      box-shadow: none;
      page-break-after: always;
      page-break-inside: avoid;
      height: 297mm;
      width: 210mm;
    }
    .no-print {
      display: none !important;
    }
  }

  /* ── CAPA ── */
  .cover {
    width: 210mm;
    height: 297mm;
    background: linear-gradient(135deg, #064384 0%, #0a5caa 60%, #1d7fd4 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 25mm 20mm;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }
  
  @media print {
    .cover {
      margin: 0;
      height: 297mm;
      width: 210mm;
      page-break-after: always;
      page-break-inside: avoid;
    }
  }

  .cover-logo { display: flex; align-items: center; gap: 12px; }
  .cover-logo-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .cover-logo-text { color: white; font-size: 22px; font-weight: 900; letter-spacing: 2px; }
  .cover-center { text-align: center; margin-top: auto; margin-bottom: auto; }
  .cover-badge { display: inline-block; background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; padding: 8px 20px; border-radius: 30px; margin-bottom: 24px; }
  .cover-title { color: white; font-size: 52px; font-weight: 900; line-height: 1.1; margin-bottom: 12px; }
  .cover-subtitle { color: rgba(255,255,255,0.75); font-size: 20px; font-weight: 400; margin-bottom: 36px; }
  
  .cover-card { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 24px 32px; max-width: 480px; margin: 0 auto; text-align: left; }
  .cover-card-label { color: rgba(255,255,255,0.6); font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
  .cover-card-value { color: white; font-size: 18px; font-weight: 800; margin-bottom: 14px; }
  .cover-card-value:last-child { margin-bottom: 0; }
  .cover-footer { text-align: center; color: rgba(255,255,255,0.5); font-size: 11px; }

  /* ── PÁGINAS INTERNAS ── */
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
  .page-logo-text { font-size: 12px; font-weight: 900; color: #064384; letter-spacing: 1.5px; }
  .page-header-info { font-size: 11px; color: #94a3b8; font-weight: 600; }
  
  .page-content { flex: 1; display: flex; flex-direction: column; }

  .section-title { font-size: 10.5px; font-weight: 800; color: #064384; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 6px; }
  .section-number { display: inline-block; background: #064384; color: white; font-size: 9.5px; font-weight: 900; width: 20px; height: 20px; border-radius: 50%; text-align: center; line-height: 20px; margin-right: 8px; }
  h2.section-heading { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 16px; }
  p.body-text { font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 12px; text-align: justify; }

  /* ── DISC BARS ── */
  .disc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
  .disc-item { }
  .disc-label { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; margin-bottom: 5px; }
  .disc-bar-bg { height: 24px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
  .disc-bar-fill { height: 100%; border-radius: 6px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-size: 11.5px; font-weight: 900; }

  /* ── LISTS ── */
  .bullet-list { list-style: none; margin: 12px 0; }
  .bullet-list li { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #334155; margin-bottom: 8px; }
  .bullet-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }

  /* ── CARDS ── */
  .card { background: #f8fafc; border-left: 4px solid #064384; padding: 16px 20px; border-radius: 0 10px 10px 0; margin: 12px 0; }
  .card.card-orange { border-left-color: #f59e0b; }
  .card.card-green { border-left-color: #10b981; }
  .card.card-red { border-left-color: #ef4444; }
  .card-label { font-size: 9.5px; font-weight: 800; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
  .card-content { font-size: 13px; color: #334155; line-height: 1.5; text-align: justify; }

  /* ── COMPARISON TABLE ── */
  .compare-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12.5px; }
  .compare-table th { background: #064384; color: white; padding: 8px 12px; text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
  .compare-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
  .compare-table tr:nth-child(even) td { background: #f8fafc; }

  /* ── PDI ── */
  .pdi-box { background: white; border: 2px dashed #cbd5e1; padding: 16px 20px; border-radius: 10px; margin: 12px 0; }
  .pdi-content { font-size: 13px; color: #334155; white-space: pre-wrap; line-height: 1.6; }

  .page-footer {
    position: absolute;
    bottom: 15mm;
    left: 20mm;
    right: 20mm;
    font-size: 10px;
    color: #94a3b8;
    font-weight: 600;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

  <!-- FLOATING BAR -->
  <div class="no-print" style="position: fixed; top: 0; left: 0; right: 0; background: #064384; color: white; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; font-family: 'Inter', sans-serif; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <span style="font-size: 13px; font-weight: 500;">
      ✍️ <strong>Dica:</strong> Você pode clicar e editar os campos <strong>Objetivo</strong> e <strong>Data para o Objetivo</strong> na capa antes de imprimir.
    </span>
    <button onclick="window.print()" style="background: #FF8323; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; transition: background 0.2s;">
      Imprimir / Salvar PDF
    </button>
  </div>

  <!-- ────────────────── 1. CAPA ────────────────── -->
  <div class="cover">
    <div class="cover-logo">
      <div class="cover-logo-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
      </div>
      <span class="cover-logo-text">RESPONSA</span>
    </div>

    <div class="cover-center">
      <div class="cover-badge">Relatório de Perfil Comportamental</div>
      <div class="cover-title">Mapeamento<br/>DISC</div>
      <div class="cover-subtitle">Análise Comportamental Individual</div>
      
      <div class="cover-card">
        <div class="cover-card-label">Avaliado(a)</div>
        <div class="cover-card-value">${av.nm_avaliado}</div>
        <div class="cover-card-label">Empresa / Organização</div>
        <div class="cover-card-value">${av.nm_empresa || "—"}</div>
        <div class="cover-card-label">Data do Relatório</div>
        <div class="cover-card-value">${dataFormatada}</div>
        
        <div style="border-top: 1px solid rgba(255,255,255,0.2); margin-top: 16px; padding-top: 16px;">
          <div class="cover-card-label">Objetivo do Relatório (Clique para editar)</div>
          <div contenteditable="true" style="color: white; font-size: 14px; font-weight: 600; outline: none; border: 1px dashed rgba(255,255,255,0.3); padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); min-height: 40px;">Desenvolvimento Individual de Carreira e feedback comportamental.</div>
          
          <div class="cover-card-label" style="margin-top: 12px;">Data Prevista para o Objetivo (Clique para editar)</div>
          <div contenteditable="true" style="color: white; font-size: 14px; font-weight: 600; outline: none; border: 1px dashed rgba(255,255,255,0.3); padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); min-height: 20px;">Dezembro de 2026</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      Metodologia DISC &nbsp;·&nbsp; Gerado pela Plataforma RESPONSA &nbsp;·&nbsp; Confidencial
    </div>
  </div>

  <!-- ────────────────── 2. SOBRE O DISC ────────────────── -->
  <div class="page page-break">
    <div class="page-header">
      <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
      <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
    </div>

    <div class="page-content">
      <div class="section-title"><span class="section-number">1</span>Sobre a Metodologia DISC</div>
      <h2 class="section-heading">O que é o DISC?</h2>
      <p class="body-text">
        A metodologia DISC é uma das ferramentas de avaliação comportamental mais utilizadas no mundo. Desenvolvida a partir das pesquisas do psicólogo William Moulton Marston, publicadas em 1928, ela identifica quatro fatores comportamentais que influenciam como as pessoas agem em diferentes situações.
      </p>
      <p class="body-text" style="margin-bottom: 24px;">
        O DISC não mede inteligência, habilidades técnicas ou maturidade emocional. Ele descreve <strong>comportamentos observáveis</strong> — como a pessoa se comunica, toma decisões, reage à pressão e interage com o ambiente ao redor.
      </p>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom: 24px; flex: 1;">
        <div style="background:#fef2f2; border-radius:12px; padding:20px; border: 1px solid #fee2e2;">
          <div style="font-size:28px; font-weight:900; color:#ef4444; line-height: 1;">D</div>
          <div style="font-size:14px; font-weight:800; color:#1e293b; margin:6px 0 4px 0;">Dominância</div>
          <div style="font-size:12px; color:#64748b; line-height:1.4;">Como você responde a problemas, desafios e resultados.</div>
        </div>
        <div style="background:#fffbeb; border-radius:12px; padding:20px; border: 1px solid #fef3c7;">
          <div style="font-size:28px; font-weight:900; color:#f59e0b; line-height: 1;">I</div>
          <div style="font-size:14px; font-weight:800; color:#1e293b; margin:6px 0 4px 0;">Influência</div>
          <div style="font-size:12px; color:#64748b; line-height:1.4;">Como você influencia pessoas ao seu redor.</div>
        </div>
        <div style="background:#f0fdf4; border-radius:12px; padding:20px; border: 1px solid #bbf7d0;">
          <div style="font-size:28px; font-weight:900; color:#10b981; line-height: 1;">S</div>
          <div style="font-size:14px; font-weight:800; color:#1e293b; margin:6px 0 4px 0;">Estabilidade</div>
          <div style="font-size:12px; color:#64748b; line-height:1.4;">Como você responde ao ritmo e consistência do ambiente.</div>
        </div>
        <div style="background:#eff6ff; border-radius:12px; padding:20px; border: 1px solid #bfdbfe;">
          <div style="font-size:28px; font-weight:900; color:#3b82f6; line-height: 1;">C</div>
          <div style="font-size:14px; font-weight:800; color:#1e293b; margin:6px 0 4px 0;">Conformidade</div>
          <div style="font-size:12px; color:#64748b; line-height:1.4;">Como você responde a regras e procedimentos do ambiente.</div>
        </div>
      </div>
      
      <p class="body-text" style="margin-top: auto;">
        Este relatório apresenta o perfil de <strong>${av.nm_avaliado}</strong> com base nas suas respostas ao questionário DISC. As informações são confidenciais e devem ser usadas para desenvolvimento profissional e autoconhecimento.
      </p>
    </div>

    <div class="page-footer">
      <span>Candidato: ${av.nm_avaliado}</span>
      <span>Página 2 de 12</span>
    </div>
  </div>

  <!-- ────────────────── 3. RESULTADOS ────────────────── -->
  <div class="page page-break">
    <div class="page-header">
      <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
      <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
    </div>

    <div class="page-content">
      <div class="section-title"><span class="section-number">2</span>Seus Resultados</div>
      <h2 class="section-heading">Intensidade dos Fatores Comportamentais</h2>
      <p class="body-text">O gráfico abaixo representa a intensidade de cada fator do seu perfil DISC com base nas suas respostas ao questionário (Perfil Natural).</p>

      <div class="disc-grid" style="margin: 20px 0;">
        <div class="disc-item">
          <div class="disc-label"><span style="color:#ef4444;font-weight:900;">D — Dominância</span><span>${pctD}%</span></div>
          <div class="disc-bar-bg"><div class="disc-bar-fill" style="width:${pctD}%; background:#ef4444;">${pctD}%</div></div>
        </div>
        <div class="disc-item">
          <div class="disc-label"><span style="color:#f59e0b;font-weight:900;">I — Influência</span><span>${pctI}%</span></div>
          <div class="disc-bar-bg"><div class="disc-bar-fill" style="width:${pctI}%; background:#f59e0b;">${pctI}%</div></div>
        </div>
        <div class="disc-item">
          <div class="disc-label"><span style="color:#10b981;font-weight:900;">S — Estabilidade</span><span>${pctS}%</span></div>
          <div class="disc-bar-bg"><div class="disc-bar-fill" style="width:${pctS}%; background:#10b981;">${pctS}%</div></div>
        </div>
        <div class="disc-item">
          <div class="disc-label"><span style="color:#3b82f6;font-weight:900;">C — Conformidade</span><span>${pctC}%</span></div>
          <div class="disc-bar-bg"><div class="disc-bar-fill" style="width:${pctC}%; background:#3b82f6;">${pctC}%</div></div>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #064384, #0a5caa); color:white; border-radius:16px; padding:20px 24px; margin: 20px 0; display:flex; align-items:center; gap:24px;">
        <div style="font-size:56px; font-weight:900; line-height:1; color:${info.cor}; text-shadow:0 0 20px rgba(255,255,255,0.3);">${perfil}</div>
        <div>
          <div style="font-size:9.5px; font-weight:800; color:rgba(255,255,255,0.6); letter-spacing:2px; text-transform:uppercase; margin-bottom:4px;">Perfil Identificado</div>
          <div style="font-size:16px; font-weight:800; color:white; line-height:1.2;">${info.nome}</div>
        </div>
      </div>

      <div style="font-size: 12.5px; line-height: 1.6; color: #334155; text-align: justify; white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; flex: 1; overflow-y: auto;">
${profileDescription}
      </div>
    </div>

    <div class="page-footer">
      <span>Candidato: ${av.nm_avaliado}</span>
      <span>Página 3 de 12</span>
    </div>
  </div>

  <!-- ────────────────── 4. CARACTERÍSTICAS DOS SEUS PERFIS DOMINANTES ────────────────── -->
  <div class="page page-break">
    <div class="page-header">
      <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
      <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
    </div>

    <div class="page-content">
      <div class="section-title"><span class="section-number">3</span>Características dos Perfis Dominantes</div>
      <h2 class="section-heading">Palavras-chave, Pontos Fortes, Pontos a Desenvolver e Sob Pressão</h2>
      
      <div style="display: flex; gap: 16px; width: 100%; flex: 1; align-items: stretch; margin-top: 10px;">
        ${characteristicsHtml}
      </div>
    </div>

    <div class="page-footer">
      <span>Candidato: ${av.nm_avaliado}</span>
      <span>Página 4 de 12</span>
    </div>
  </div>

  <!-- ────────────────── 5. COMUNICAÇÃO & MOTIVADORES ────────────────── -->
  <div class="page page-break">
    <div class="page-header">
      <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
      <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
    </div>

    <div class="page-content" style="justify-content: space-between;">
      <div>
        <div class="section-title"><span class="section-number">4</span>Estilo de Comunicação</div>
        <h2 class="section-heading">Como se Comunicar com este Perfil</h2>
        <div class="card card-orange" style="margin-bottom: 24px;">
          <div class="card-label">Dica para líderes e colegas</div>
          <div class="card-content">${info.comunicacao}</div>
        </div>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div class="section-title"><span class="section-number">5</span>O que Motiva este Perfil</div>
        <h2 class="section-heading">Motivadores e Engajadores</h2>
        <p class="body-text">Para manter ${av.nm_avaliado} engajado(a) e com alta performance, é importante considerar os seguintes motivadores:</p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin: 16px 0;">
          ${info.motivadores.map((m, i) => `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px 20px; display:flex; align-items:center; gap:12px; box-sizing:border-box;">
            <div style="width:32px; height:32px; background:${info.cor}; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; font-weight:900; font-size:14px; flex-shrink:0;">${i + 1}</div>
            <span style="font-size:13px; color:#334155; font-weight:600;">${m}</span>
          </div>`).join("")}
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Candidato: ${av.nm_avaliado}</span>
      <span>Página 5 de 12</span>
    </div>
  </div>

  <!-- ────────────────── 6. AMBIENTE & LIDERANÇA ────────────────── -->
  <div class="page page-break">
    <div class="page-header">
      <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
      <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
    </div>

    <div class="page-content" style="justify-content: space-between;">
      <div>
        <div class="section-title"><span class="section-number">6</span>Ambiente de Trabalho Ideal</div>
        <h2 class="section-heading">Condições que Potencializam o Desempenho</h2>
        <div class="card card-green" style="margin-bottom: 24px;">
          <div class="card-label">Contexto ideal de trabalho</div>
          <div class="card-content">${info.ambienteIdeal}</div>
        </div>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div class="section-title"><span class="section-number">7</span>Liderança e Tomada de Decisão</div>
        <h2 class="section-heading">Como este Perfil Lidera e Decide</h2>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:12px;">
          <div class="card" style="margin: 0;">
            <div class="card-label">Estilo de Liderança</div>
            <div class="card-content">
              ${letraPrincipal === "D" ? "Diretivo e orientado a resultados. Lidera pelo exemplo e pela autoridade. Espera execução rápida e eficiente." : ""}
              ${letraPrincipal === "I" ? "Inspirador e carismático. Lidera pelo entusiasmo e conexão emocional. Motiva a equipe com energia e otimismo." : ""}
              ${letraPrincipal === "S" ? "Colaborativo e apoiador. Lidera pela confiança e estabilidade. Constrói equipes coesas e harmoniosas." : ""}
              ${letraPrincipal === "C" ? "Analítico e metódico. Lidera pela competência técnica e rigor. Exige qualidade e precisão da equipe." : ""}
            </div>
          </div>
          <div class="card card-orange" style="margin: 0;">
            <div class="card-label">Tomada de Decisão</div>
            <div class="card-content">
              ${letraPrincipal === "D" ? "Rápido e decisivo. Baseia-se na intuição e no objetivo final. Não teme riscos quando necessário." : ""}
              ${letraPrincipal === "I" ? "Intuitivo e baseado em pessoas. Considera o impacto nas relações. Pode ser impulsivo, mas reconsidera quando necessário." : ""}
              ${letraPrincipal === "S" ? "Cauteloso e colaborativo. Prefere consenso e avalia o impacto nas pessoas. Demora mais, mas é consistente." : ""}
              ${letraPrincipal === "C" ? "Analítico e baseado em dados. Avalia todas as variáveis antes de decidir. Busca a melhor solução possível." : ""}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Candidato: ${av.nm_avaliado}</span>
      <span>Página 6 de 12</span>
    </div>
  </div>

  <!-- ────────────────── 7. ADAPTAÇÃO AO MEIO ────────────────── -->
  <div class="page page-break">
    <div class="page-header">
      <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
      <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
    </div>

    <div class="page-content">
      <div class="section-title"><span class="section-number">8</span>Interação com o Meio Ambiente</div>
      <h2 class="section-heading">Perfil Natural vs. Exigência do Meio vs. Perfil Adaptado</h2>
      <p class="body-text" style="margin-bottom: 20px;">Esta seção compara o perfil natural de ${av.nm_avaliado} com o que o ambiente de trabalho exige e o quanto de adaptação comportamental real é gerada.</p>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        ${comparisonChartsHtml}
      </div>
      
      <p style="font-size:11px; color:#94a3b8; margin-top:10px;">
        Legenda: Perfil Atual (Natural) &nbsp;·&nbsp; Exigência do Meio (Necessidade) &nbsp;·&nbsp; Adaptado (Comportamento de adaptação real)
      </p>
    </div>

    <div class="page-footer">
      <span>Candidato: ${av.nm_avaliado}</span>
      <span>Página 7 de 12</span>
    </div>
  </div>

  <!-- ────────────────── 8. FEEDBACK DE INTERAÇÃO COM O MEIO ────────────────── -->
  <div class="page page-break">
    <div class="page-header">
      <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
      <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
    </div>

    <div class="page-content">
      <div class="section-title"><span class="section-number">9</span>Interação com o Meio</div>
      <h2 class="section-heading">Análise de Esforço Adaptativo</h2>
      
      <div style="font-size: 13px; line-height: 1.7; color: #334155; text-align: justify; white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; flex: 1; overflow-y: auto;">
${feedbackText}
      </div>

      <table class="compare-table" style="margin-top:20px; margin-bottom: 0;">
        <thead>
          <tr><th>Fator</th><th>Perfil Natural</th><th>Exigência do Meio</th><th>Variação</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color:#ef4444;">D — Dominância</strong></td>
            <td>${pctD}%</td><td>${epD}%</td>
            <td style="font-weight:800; color:${epD - pctD > 5 ? '#dc2626' : epD - pctD < -5 ? '#2563eb' : '#16a34a'};">${epD - pctD > 0 ? '+' : ''}${epD - pctD}pp</td>
          </tr>
          <tr>
            <td><strong style="color:#f59e0b;">I — Influência</strong></td>
            <td>${pctI}%</td><td>${epI}%</td>
            <td style="font-weight:800; color:${epI - pctI > 5 ? '#dc2626' : epI - pctI < -5 ? '#2563eb' : '#16a34a'};">${epI - pctI > 0 ? '+' : ''}${epI - pctI}pp</td>
          </tr>
          <tr>
            <td><strong style="color:#10b981;">S — Estabilidade</strong></td>
            <td>${pctS}%</td><td>${epS}%</td>
            <td style="font-weight:800; color:${epS - pctS > 5 ? '#dc2626' : epS - pctS < -5 ? '#2563eb' : '#16a34a'};">${epS - pctS > 0 ? '+' : ''}${epS - pctS}pp</td>
          </tr>
          <tr>
            <td><strong style="color:#3b82f6;">C — Conformidade</strong></td>
            <td>${pctC}%</td><td>${epC}%</td>
            <td style="font-weight:800; color:${epC - pctC > 5 ? '#dc2626' : epC - pctC < -5 ? '#2563eb' : '#16a34a'};">${epC - pctC > 0 ? '+' : ''}${epC - pctC}pp</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="page-footer">
      <span>Candidato: ${av.nm_avaliado}</span>
      <span>Página 8 de 12</span>
    </div>
  </div>

  <!-- ────────────────── 9. QUADRO DE ADAPTAÇÕES ────────────────── -->
  <div class="page page-break">
    <div class="page-header">
      <span class="page-logo-text">RESPONSA &nbsp;·&nbsp; DISC</span>
      <span class="page-header-info">${av.nm_avaliado} &nbsp;|&nbsp; ${dataFormatada}</span>
    </div>

    <div class="page-content" style="justify-content: center;">
      <div class="section-title"><span class="section-number">10</span>Quadro de Adaptações</div>
      <h2 class="section-heading" style="margin-bottom: 12px;">Como trabalhar as características comportamentais para adaptar-se ao meio</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px; flex: 1;">
        <!-- D -->
        <div style="border: 1px solid #fecaca; border-radius: 12px; padding: 14px; background: #fef2f2; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 style="font-size: 13.5px; font-weight: bold; color: #dc2626; border-bottom: 2px solid #fca5a5; padding-bottom: 6px; margin: 0 0 10px 0;">DOMINÂNCIA (D)</h3>
            <div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-bottom: 2px;">Aumentar (+)</div>
            <div style="font-size: 11.5px; color: #475569; margin-bottom: 10px; line-height: 1.35;">Independência, Assertividade, Proatividade, Pulso, Senso de Urgência, Compreensão.</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #dc2626; font-weight: bold; margin-bottom: 2px;">Diminuir (-)</div>
            <div style="font-size: 11.5px; color: #475569; line-height: 1.35; margin: 0;">Independência excessiva, Dominância, Agradabilidade extrema, Cuidado extremo.</div>
          </div>
        </div>
        <!-- I -->
        <div style="border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; background: #fffbeb; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 style="font-size: 13.5px; font-weight: bold; color: #d97706; border-bottom: 2px solid #fde68a; padding-bottom: 6px; margin: 0 0 10px 0;">INFLUÊNCIA (I)</h3>
            <div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-bottom: 2px;">Aumentar (+)</div>
            <div style="font-size: 11.5px; color: #475569; margin-bottom: 10px; line-height: 1.35;">Comunicação ativa, Trabalho em Equipe, Otimismo, Envolvimento pessoal, Popularidade.</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #dc2626; font-weight: bold; margin-bottom: 2px;">Diminuir (-)</div>
            <div style="font-size: 11.5px; color: #475569; line-height: 1.35; margin: 0;">Foco Técnico rígido, Rigor Analítico, Reserva, Impulsividade, Organização excessiva.</div>
          </div>
        </div>
        <!-- S -->
        <div style="border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; background: #f0fdf4; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 style="font-size: 13.5px; font-weight: bold; color: #16a34a; border-bottom: 2px solid #86efac; padding-bottom: 6px; margin: 0 0 10px 0;">ESTABILIDADE (S)</h3>
            <div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-bottom: 2px;">Aumentar (+)</div>
            <div style="font-size: 11.5px; color: #475569; margin-bottom: 10px; line-height: 1.35;">Método de trabalho, Paciência, Tolerância, Organização, Comando pessoal, Rapidez, Exposição a Mudanças, Assumir Riscos.</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #dc2626; font-weight: bold; margin-bottom: 2px;">Diminuir (-)</div>
            <div style="font-size: 11.5px; color: #475569; line-height: 1.35; margin: 0;">Apressamento de tarefas, Tempo de Execução prolongado.</div>
          </div>
        </div>
        <!-- C -->
        <div style="border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px; background: #eff6ff; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 style="font-size: 13.5px; font-weight: bold; color: #2563eb; border-bottom: 2px solid #93c5fd; padding-bottom: 6px; margin: 0 0 10px 0;">CONFORMIDADE (C)</h3>
            <div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-bottom: 2px;">Aumentar (+)</div>
            <div style="font-size: 11.5px; color: #475569; margin-bottom: 10px; line-height: 1.35;">Estruturação de processos, Especialização técnica, Cuidado, Reserva pessoal, Discrição.</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #dc2626; font-weight: bold; margin-bottom: 2px;">Diminuir (-)</div>
            <div style="font-size: 11.5px; color: #475569; line-height: 1.35; margin: 0;">Formalismo excessivo, Espírito Aventureiro, Trabalho em Equipe excessivo, Perfeccionismo extremo, Organização exagerada.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Candidato: ${av.nm_avaliado}</span>
      <span>Página 9 de 12</span>
    </div>
  </div>

  ${page9}
  ${page10}
  ${page11}
  ${page12}

<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 800);
  };
</script>
</body>
</html>`;
}

export default function DiscAdminPage() {
  const router = useRouter();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDISC[]>([]);
  const [loading, setLoading] = useState(true);

  const [novaEmpresa, setNovaEmpresa] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [pdiAtivo, setPdiAtivo] = useState<string | null>(null);
  const [pdiTexto, setPdiTexto] = useState("");

  useEffect(() => {
    const checkAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data } = await supabase
        .from("AVALIACOES_DISC_AVULSO")
        .select("*")
        .order("ts_criacao", { ascending: false });

      if (data) setAvaliacoes(data);
      setLoading(false);
    };
    checkAndLoad();
  }, [router]);

  const criarNovaAvaliacao = async () => {
    if (!novoNome) return alert("Digite pelo menos o Nome do Avaliado!");
    setIsCreating(true);

    const { data, error } = await supabase
      .from("AVALIACOES_DISC_AVULSO")
      .insert([{ nm_empresa: novaEmpresa || "Avulso", nm_avaliado: novoNome }])
      .select("*")
      .single();

    if (!error && data) {
      setAvaliacoes([data, ...avaliacoes]);
      setNovoNome("");
      setNovaEmpresa("");
      copiarLink(data.cd_avaliacao);
    } else {
      alert("Erro ao gerar link.");
      console.error(error);
    }
    setIsCreating(false);
  };

  const copiarLink = (id: string) => {
    const link = `${window.location.origin}/pesquisa/disc-avulso/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("Link público copiado!\nEnvie para o avaliado responder.");
    });
  };

  const salvarPDI = async (id: string) => {
    await supabase
      .from("AVALIACOES_DISC_AVULSO")
      .update({ ds_observacao: pdiTexto })
      .eq("cd_avaliacao", id);

    setAvaliacoes(
      avaliacoes.map((a) =>
        a.cd_avaliacao === id ? { ...a, ds_observacao: pdiTexto } : a
      )
    );
    setPdiAtivo(null);
    alert("PDI salvo com sucesso!");
  };

  const gerarPDF = (av: AvaliacaoDISC) => {
    const statusNormalizado = (av.tp_status || "").toUpperCase();
    if (statusNormalizado !== "CONCLUIDO") {
      alert("A avaliação ainda não foi concluída pelo avaliado.");
      return;
    }

    if (!av.js_respostas || Object.keys(av.js_respostas).length === 0) {
      alert("Não há respostas registradas nesta avaliação.");
      return;
    }

    const janela = window.open("", "_blank", "width=1200,height=900");
    if (!janela) {
      alert("O navegador bloqueou o popup. Por favor, permita popups para este site e tente novamente.");
      return;
    }

    try {
      const html = gerarHTMLRelatorioDisc(av);
      janela.document.open();
      janela.document.write(html);
      janela.document.close();
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      janela.close();
      alert("Erro ao gerar o relatório. Verifique o console para detalhes.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#064384]">
        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar
        onLogout={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}
      />

      <main className="flex-1 overflow-y-auto flex flex-col h-full relative">
        <header className="bg-white/95 backdrop-blur-sm px-8 py-6 border-b border-slate-200 shadow-sm sticky top-0 z-10 w-full flex items-center gap-4 shrink-0">
          <div className="size-12 bg-blue-50 text-[#064384] rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#064384] tracking-tight">Mapeamento DISC</h2>
            <p className="text-sm font-bold text-slate-500">Ferramenta Avulsa de Análise Comportamental</p>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
            <div>
              <h3 className="font-black text-slate-800 text-lg mb-1">Novo Link de Avaliação</h3>
              <p className="text-sm text-slate-500 font-medium">Gere um link público para candidatos ou clientes responderem o teste.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Empresa (Opcional)"
                value={novaEmpresa}
                onChange={(e) => setNovaEmpresa(e.target.value)}
                className="px-5 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#064384] focus:ring-1 focus:ring-[#064384] w-full sm:w-48 text-sm font-bold text-slate-700 bg-slate-50"
              />
              <input
                type="text"
                placeholder="Nome do Avaliado *"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && criarNovaAvaliacao()}
                className="px-5 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#064384] focus:ring-1 focus:ring-[#064384] w-full sm:w-64 text-sm font-bold text-slate-700 bg-slate-50"
              />
              <button
                onClick={criarNovaAvaliacao}
                disabled={isCreating}
                className="bg-[#064384] hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-black text-sm active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">link</span>
                )}
                {isCreating ? "Gerando..." : "Gerar Link"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {avaliacoes.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-500 font-bold bg-white rounded-3xl border border-dashed border-slate-300">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">inbox</span>
                <p>Nenhuma avaliação DISC gerada ainda.</p>
              </div>
            ) : (
              avaliacoes.map((av) => (
                <div
                  key={av.cd_avaliacao}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md hover:border-[#064384]/30 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-[#064384] transition-colors">
                        {av.nm_avaliado}
                      </h3>
                      <span className="text-[10px] font-black text-[#FF8323] uppercase tracking-widest">
                        {av.nm_empresa}
                      </span>
                    </div>
                    <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-lg shrink-0 border ${
                      av.tp_status?.toUpperCase() === "CONCLUIDO"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : av.tp_status?.toUpperCase() === "EM_ANDAMENTO"
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : "bg-orange-50 text-orange-600 border-orange-100"
                    }`}>
                      {av.tp_status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-medium mb-4">
                    {av.ts_criacao ? new Date(av.ts_criacao).toLocaleDateString("pt-BR") : ""}
                  </p>

                  {av.tp_status?.toUpperCase() !== "CONCLUIDO" ? (
                    <button
                      onClick={() => copiarLink(av.cd_avaliacao)}
                      className="mt-auto w-full bg-slate-50 text-slate-600 border border-slate-200 font-bold py-3.5 rounded-xl text-sm hover:bg-[#064384] hover:text-white hover:border-[#064384] transition-all flex justify-center items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      Copiar Link Público
                    </button>
                  ) : (
                    <div className="mt-auto space-y-3 pt-5 border-t border-slate-100">
                      {pdiAtivo === av.cd_avaliacao ? (
                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          <textarea
                            className="w-full text-sm p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#064384] bg-slate-50 resize-none font-medium text-slate-700"
                            rows={4}
                            placeholder="Observações do consultor e plano de ação (PDI)..."
                            value={pdiTexto}
                            onChange={(e) => setPdiTexto(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPdiAtivo(null)}
                              className="w-1/3 bg-white border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => salvarPDI(av.cd_avaliacao)}
                              className="w-2/3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm shadow-md transition-colors"
                            >
                              Salvar PDI
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setPdiTexto(av.ds_observacao || "");
                              setPdiAtivo(av.cd_avaliacao);
                            }}
                            className="w-full bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors flex justify-center items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {av.ds_observacao ? "edit" : "add_comment"}
                            </span>
                            {av.ds_observacao ? "Editar PDI" : "Adicionar PDI"}
                          </button>
                          <button
                            onClick={() => gerarPDF(av)}
                            className="w-full bg-[#064384] text-white font-black py-3 rounded-xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 hover:bg-blue-900 active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                            Gerar Relatório PDF
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
