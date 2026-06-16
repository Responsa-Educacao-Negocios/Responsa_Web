"use client";

import { supabase } from "@/lib/supabase";
import { calcularPontuacaoDisc, calcularExigenciaMeio, calcularCompetenciasDisc, calcularAderencia, derivarPerfilDisc, getInteracaoMeioFeedback } from "@/lib/disc-utils";
import { DISC_COMBINATIONS, DISC_SINGLE_PROFILES, DISC_PROFILE_DETAILS, DISC_COMPETENCIES_DESC } from "@/lib/disc-data";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Funcionario {
  cd_funcionario: string;
  nm_completo: string;
  sg_perfil_disc: string;
  dt_admissao: string;
  ds_observacoes?: string;
  js_pontuacao_disc: {
    D: number;
    I: number;
    S: number;
    C: number;
    aderencia: number;
    exigencia?: {
      D: number;
      I: number;
      S: number;
      C: number;
    };
    competencias?: {
      label: string;
      valor: number;
      alvo: number;
      letra: string;
    }[];
    respostas_brutas?: Record<string, Record<string, number>>;
  };
  CARGOS?: {
    nm_titulo: string;
  };
}

const ALVOS_CARGO = { D: 40, I: 30, S: 20, C: 10 };

export default function RelatorioPsicometricoPage() {
  const params = useParams();
  const router = useRouter();
  const [colab, setColab] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const { data, error } = await supabase
          .from("FUNCIONARIOS")
          .select(`*, CARGOS(nm_titulo)`)
          .eq("cd_funcionario", params.colaboradorId)
          .single();

        if (error) throw error;

        // Normaliza os dados: calcula D/I/S/C a partir das respostas brutas
        const raw = data as any;
        if (raw.js_pontuacao_disc?.respostas_brutas) {
          const scores = calcularPontuacaoDisc(raw.js_pontuacao_disc.respostas_brutas);
          const exigencia = calcularExigenciaMeio(raw.js_pontuacao_disc.respostas_brutas);
          const competencies = calcularCompetenciasDisc(raw.js_pontuacao_disc.respostas_brutas);
          const aderencia = calcularAderencia(scores, exigencia);
          const perfilDerivado = derivarPerfilDisc(scores, raw.js_pontuacao_disc.respostas_brutas);

          setColab({
            ...raw,
            sg_perfil_disc: raw.sg_perfil_disc || perfilDerivado,
            js_pontuacao_disc: {
              ...scores,
              exigencia,
              aderencia,
              competencias: competencies,
              respostas_brutas: raw.js_pontuacao_disc.respostas_brutas,
            },
          });
        } else {
          setColab(raw);
        }
      } catch (err) {
        console.error("Erro ao carregar relatório:", err);
      } finally {
        setLoading(false);
      }
    };
    buscarDados();
  }, [params.colaboradorId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#064384]">
          progress_activity
        </span>
      </div>
    );
  }

  if (!colab || !colab.js_pontuacao_disc) {
    return (
      <div className="p-20 text-center font-medium text-slate-500 flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-4xl">error</span>
        Colaborador não encontrado ou teste ainda não realizado.
        <button
          onClick={() => router.back()}
          className="text-[#064384] underline font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Relatório DISC - ${colab.nm_completo}`,
          text: `Confira o mapeamento de perfil de ${colab.nm_completo}`,
          url: url,
        });
      } catch (error) {
        console.log("Compartilhamento cancelado", error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link do relatório copiado para a área de transferência!");
    }
  };

  // --- FUNÇÃO DE IMPRESSÃO (NOVO FORMATO PDF PROFISSIONAL) ---
  const handlePrint = () => {
    const janela = window.open("", "", "width=1100,height=900");
    if (!janela) return;

    const disc = colab.js_pontuacao_disc;
    const dataAvaliacao = new Date(colab.dt_admissao).toLocaleDateString("pt-BR");

    const code = colab.sg_perfil_disc || "";
    const letterToNumber: Record<string, string> = { D: "1", I: "2", S: "3", C: "4" };
    const numericCode = code.split("").map(l => letterToNumber[l] || "").join("");
    const combinationText = DISC_COMBINATIONS[numericCode] || "";
    const primaryLetter = code[0] || "D";
    const singleProfileText = DISC_SINGLE_PROFILES[primaryLetter] || "";
    const profileDescription = [combinationText, singleProfileText].filter(Boolean).join("\n\n");

    const targets = disc.exigencia || { D: 50, I: 50, S: 50, C: 50 };
    const feedbackText = getInteracaoMeioFeedback(disc, targets);

    const letters = code.split("");
    const characteristicsHtml = letters.map(letter => {
      const details = DISC_PROFILE_DETAILS[letter];
      if (!details) return "";
      const label = letter === "D" ? "DOMINÂNCIA (D)" : letter === "I" ? "INFLUÊNCIA (I)" : letter === "S" ? "ESTABILIDADE (S)" : "CONFORMIDADE (C)";
      const colorClass = letter === "D" ? "#dc2626" : letter === "I" ? "#d97706" : letter === "S" ? "#16a34a" : "#2563eb";
      const bgLight = letter === "D" ? "#fef2f2" : letter === "I" ? "#fffbeb" : letter === "S" ? "#f0fdf4" : "#eff6ff";
      const borderLight = letter === "D" ? "#fecaca" : letter === "I" ? "#fef3c7" : letter === "S" ? "#bbf7d0" : "#bfdbfe";
      return `
        <div style="flex: 1; min-width: 0; border: 1px solid ${borderLight}; border-radius: 12px; padding: 20px; background: ${bgLight}; box-sizing: border-box;">
          <h3 style="font-size: 16px; font-weight: 800; color: ${colorClass}; border-bottom: 2px solid ${borderLight}; padding-bottom: 8px; margin-top: 0; margin-bottom: 15px;">${label}</h3>
          
          <h4 style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; margin-top: 0;">Palavras-chave</h4>
          <ul style="padding-left: 18px; margin-bottom: 18px; font-size: 13px; color: #334155; line-height: 1.4;">
            ${details.keywords.map(w => `<li>${w}</li>`).join("")}
          </ul>

          <h4 style="font-size: 12px; font-weight: 700; color: #16a34a; text-transform: uppercase; margin-bottom: 8px; margin-top: 0;">Pontos Fortes</h4>
          <ul style="padding-left: 18px; margin-bottom: 18px; font-size: 13px; color: #15803d; line-height: 1.4;">
            ${details.strengths.map(w => `<li>${w}</li>`).join("")}
          </ul>

          <h4 style="font-size: 12px; font-weight: 700; color: #ea580c; text-transform: uppercase; margin-bottom: 8px; margin-top: 0;">Pontos a Desenvolver</h4>
          <ul style="padding-left: 18px; margin-bottom: 18px; font-size: 13px; color: #c2410c; line-height: 1.4;">
            ${details.develop.map(w => `<li>${w}</li>`).join("")}
          </ul>

          <h4 style="font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase; margin-bottom: 8px; margin-top: 0;">Sob Pressão</h4>
          <p style="font-size: 13px; color: #b91c1c; font-weight: 600; margin: 0; line-height: 1.4;">
            ${details.pressure[0] || ""}
          </p>
        </div>
      `;
    }).join("");

    const profiles = [
      { letter: "D", name: "DOMINÂNCIA (D)", val: disc.D, target: targets.D },
      { letter: "I", name: "INFLUÊNCIA (I)", val: disc.I, target: targets.I },
      { letter: "S", name: "ESTABILIDADE (S)", val: disc.S, target: targets.S },
      { letter: "C", name: "CONFORMIDADE (C)", val: disc.C, target: targets.C }
    ];
    const comparisonChartsHtml = profiles.map(p => {
      const adapt = Math.round((p.val + p.target) / 2);
      return `
        <div style="margin-bottom: 18px; page-break-inside: avoid;">
          <div style="font-size: 13px; font-weight: bold; color: #1e293b; margin-bottom: 6px;">${p.name}</div>
          
          <div style="display: flex; flex-direction: column; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; box-sizing: border-box;">
            <!-- Natural -->
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 10px; font-weight: bold; width: 80px; color: #064384;">Perfil Atual:</span>
              <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; position: relative;">
                <div style="width: ${p.val}%; height: 100%; background: #064384; border-radius: 5px;"></div>
              </div>
              <span style="font-size: 11px; font-weight: bold; width: 35px; text-align: right; color: #064384;">${p.val}%</span>
            </div>
            
            <!-- Exigência -->
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 10px; font-weight: bold; width: 80px; color: #dc2626;">Exigência:</span>
              <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; position: relative;">
                <div style="width: ${p.target}%; height: 100%; background: #dc2626; border-radius: 5px;"></div>
              </div>
              <span style="font-size: 11px; font-weight: bold; width: 35px; text-align: right; color: #dc2626;">${p.target}%</span>
            </div>
            
            <!-- Adaptado -->
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 10px; font-weight: bold; width: 80px; color: #8B5CF6;">Adaptado:</span>
              <div style="flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; position: relative;">
                <div style="width: ${adapt}%; height: 100%; background: #8B5CF6; border-radius: 5px;"></div>
              </div>
              <span style="font-size: 11px; font-weight: bold; width: 35px; text-align: right; color: #8B5CF6;">${adapt}%</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    const compGroups = {
      D: { name: "Dominância (D)", color: "#dc2626" },
      I: { name: "Influência (I)", color: "#d97706" },
      S: { name: "Estabilidade (S)", color: "#16a34a" },
      C: { name: "Conformidade (C)", color: "#2563eb" }
    };
    const competenciesGroupsHtml = Object.entries(compGroups).map(([letra, group]) => {
      const groupComps = disc.competencias?.filter(c => c.letra === letra) || [];
      return `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h3 style="font-size: 12px; font-weight: 800; color: ${group.color}; border-bottom: 2px solid ${group.color}22; padding-bottom: 4px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase;">
            Competências de ${group.name}
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            ${groupComps.map(c => {
              const desc = DISC_COMPETENCIES_DESC[c.label] || "";
              return `
                <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; background: #fafafa; font-size: 10.5px; box-sizing: border-box;">
                  <div style="display: flex; justify-content: space-between; font-weight: bold; color: #1e293b; margin-bottom: 2px;">
                    <span>${c.label}</span>
                    <span style="font-size: 9px; color: #64748b;">At: ${c.valor}% / Ex: ${c.alvo}%</span>
                  </div>
                  <div style="position: relative; height: 8px; background: #e2e8f0; border-radius: 4px; width: 100%; margin-bottom: 4px; overflow: hidden;">
                    <div style="position: absolute; left: 0; top: 0; height: 100%; background: #fee2e2; border-left: 2px solid #EF4444; width: ${c.alvo}%;"></div>
                    <div style="position: absolute; left: 0; top: 2px; height: 4px; background: #064384; width: ${c.valor}%; border-radius: 2px;"></div>
                  </div>
                  <div style="color: #64748b; font-size: 9px; line-height: 1.3; text-align: justify;">${desc}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }).join("");

    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório DISC - ${colab.nm_completo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 0;
              background: #f1f5f9;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
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
              }
              .no-print {
                display: none !important;
              }
            }
            
            .header-info {
              font-size: 11px;
              color: #94a3b8;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
            }
            
            .footer-info {
              position: absolute;
              bottom: 20mm;
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
            
            .page-content {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            
            .title-large {
              font-size: 48px;
              font-weight: 900;
              color: #064384;
              letter-spacing: -1.5px;
              margin: 20px 0;
              text-transform: uppercase;
            }
            
            .title-section {
              font-size: 20px;
              font-weight: 800;
              color: #064384;
              margin-top: 0;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .subtitle-section {
              font-size: 12px;
              font-weight: 600;
              color: #64748b;
              margin-top: 0;
              margin-bottom: 25px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
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

          <!-- PAGE 1: COVER -->
          <div class="page page-break" style="justify-content: center; align-items: center; text-align: center;">
            <div style="font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 15px;">
              Mapeamento Comportamental
            </div>
            <div style="font-size: 82px; font-weight: 900; color: #064384; margin: 0; letter-spacing: -3px; line-height: 1;">
              DISC
            </div>
            <div style="width: 100px; h-1.5; background: #FF8323; height: 5px; margin: 30px auto; border-radius: 3px;"></div>
            
            <div style="font-size: 26px; font-weight: 800; color: #1e293b; margin-top: 20px;">
              ${colab.nm_completo}
            </div>
            <div style="font-size: 14px; color: #64748b; font-weight: 600; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">
              Cargo: ${colab.CARGOS?.nm_titulo || "Sem Cargo Specified"}
            </div>

            <div style="margin-top: 60px; width: 80%; text-align: left; border-top: 1px solid #e2e8f0; padding-top: 30px; margin-bottom: auto;">
              <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                Objetivo do Relatório (Clique para editar):
              </div>
              <div contenteditable="true" style="border: 1px dashed #cbd5e1; padding: 12px; border-radius: 8px; font-size: 13.5px; min-height: 50px; outline: none; background: #f8fafc; color: #334155; line-height: 1.5;">
                Desenvolvimento Individual de Carreira e feedback comportamental.
              </div>
              
              <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; margin-bottom: 4px;">
                Data Prevista para o Objetivo (Clique para editar):
              </div>
              <div contenteditable="true" style="border: 1px dashed #cbd5e1; padding: 12px; border-radius: 8px; font-size: 13.5px; min-height: 20px; outline: none; background: #f8fafc; color: #334155; line-height: 1.5;">
                Dezembro de 2026
              </div>
            </div>

            <div style="color: #94a3b8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-top: auto;">
              DATA DA AVALIAÇÃO: ${dataAvaliacao}
            </div>
          </div>

          <!-- PAGE 2: PROFILE DESCRIPTION -->
          <div class="page page-break">
            <div class="header-info">
              <span>Mapeamento Comportamental (DISC)</span>
              <span>Relatório Individual</span>
            </div>
            
            <div class="page-content">
              <h2 class="title-section">Perfil Predominante</h2>
              <div class="subtitle-section">Seu Perfil Predominante e Análise Geral</div>
              
              <div style="background: #064384; color: white; padding: 30px; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(6,67,132,0.15);">
                <div>
                  <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 4px;">Perfil Identificado</div>
                  <div style="font-size: 42px; font-weight: 900; letter-spacing: -1px; line-height: 1;">${colab.sg_perfil_disc}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 4px;">Aderência Geral ao Cargo</div>
                  <div style="font-size: 36px; font-weight: 900; line-height: 1;">${disc.aderencia}%</div>
                </div>
              </div>

              <div style="font-size: 14px; line-height: 1.7; color: #334155; text-align: justify; white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; flex: 1;">
${profileDescription}
              </div>
            </div>

            <div class="footer-info">
              <span>Candidato: ${colab.nm_completo}</span>
              <span>Página 2 de 6</span>
            </div>
          </div>

          <!-- PAGE 3: CHARACTERISTICS -->
          <div class="page page-break">
            <div class="header-info">
              <span>Mapeamento Comportamental (DISC)</span>
              <span>Relatório Individual</span>
            </div>

            <div class="page-content">
              <h2 class="title-section">Características Principais</h2>
              <div class="subtitle-section">Palavras-chave, pontos fortes, pontos a desenvolver e reações sob pressão</div>
              
              <div style="display: flex; gap: 20px; width: 100%; flex: 1; align-items: stretch;">
                ${characteristicsHtml}
              </div>
            </div>

            <div class="footer-info">
              <span>Candidato: ${colab.nm_completo}</span>
              <span>Página 3 de 6</span>
            </div>
          </div>

          <!-- PAGE 4: CHARTS & FEEDBACK -->
          <div class="page page-break">
            <div class="header-info">
              <span>Mapeamento Comportamental (DISC)</span>
              <span>Relatório Individual</span>
            </div>

            <div class="page-content">
              <h2 class="title-section">Interação com o Meio</h2>
              <div class="subtitle-section">Comparativo entre Perfil Natural, Exigência do Meio e Perfil Adaptado</div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: start;">
                <!-- Column 1: Charts -->
                <div>
                  ${comparisonChartsHtml}
                </div>
                
                <!-- Column 2: Explanation & Feedback -->
                <div style="display: flex; flex-direction: column; gap: 15px;">
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-sizing: border-box;">
                    <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Legenda dos Gráficos</div>
                    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 16px; height: 8px; background: #064384; border-radius: 4px;"></div>
                        <span><strong>Perfil Natural:</strong> Comportamento inato, mais presente no dia a dia.</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 16px; height: 8px; background: #dc2626; border-radius: 4px;"></div>
                        <span><strong>Exigência do Meio:</strong> O que o meio (profissional/pessoal) exige.</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 16px; height: 8px; background: #8B5CF6; border-radius: 4px;"></div>
                        <span><strong>Perfil Adaptado:</strong> Comportamento de adaptação real gerado.</span>
                      </div>
                    </div>
                  </div>

                  <div style="font-size: 12.5px; line-height: 1.6; color: #334155; text-align: justify; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; white-space: pre-wrap; box-sizing: border-box;">
${feedbackText}
                  </div>
                </div>
              </div>
            </div>

            <div class="footer-info">
              <span>Candidato: ${colab.nm_completo}</span>
              <span>Página 4 de 6</span>
            </div>
          </div>

          <!-- PAGE 5: ADAPTATIONS -->
          <div class="page page-break">
            <div class="header-info">
              <span>Mapeamento Comportamental (DISC)</span>
              <span>Relatório Individual</span>
            </div>

            <div class="page-content" style="justify-content: center;">
              <h2 class="title-section">Quadro de Adaptações</h2>
              <div class="subtitle-section">Como trabalhar as características comportamentais para adaptar-se ao meio</div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px;">
                <!-- D -->
                <div style="border: 1px solid #fecaca; border-radius: 12px; padding: 16px; background: #fef2f2; box-sizing: border-box;">
                  <h3 style="font-size: 15px; font-weight: bold; color: #dc2626; border-bottom: 2px solid #fca5a5; padding-bottom: 6px; margin: 0 0 12px 0;">DOMINÂNCIA (D)</h3>
                  <div style="font-size: 12px; color: #16a34a; font-weight: bold; margin-bottom: 4px;">Aumentar (+)</div>
                  <div style="font-size: 12px; color: #475569; margin-bottom: 12px; line-height: 1.4;">Independência, Assertividade, Proatividade, Pulso, Senso de Urgência, Compreensão.</div>
                  <div style="font-size: 12px; color: #dc2626; font-weight: bold; margin-bottom: 4px;">Diminuir (-)</div>
                  <div style="font-size: 12px; color: #475569; line-height: 1.4;">Independência excessiva, Dominância, Agradabilidade extrema, Cuidado extremo.</div>
                </div>
                <!-- I -->
                <div style="border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; background: #fffbeb; box-sizing: border-box;">
                  <h3 style="font-size: 15px; font-weight: bold; color: #d97706; border-bottom: 2px solid #fde68a; padding-bottom: 6px; margin: 0 0 12px 0;">INFLUÊNCIA (I)</h3>
                  <div style="font-size: 12px; color: #16a34a; font-weight: bold; margin-bottom: 4px;">Aumentar (+)</div>
                  <div style="font-size: 12px; color: #475569; margin-bottom: 12px; line-height: 1.4;">Comunicação ativa, Trabalho em Equipe, Otimismo, Envolvimento pessoal, Popularidade.</div>
                  <div style="font-size: 12px; color: #dc2626; font-weight: bold; margin-bottom: 4px;">Diminuir (-)</div>
                  <div style="font-size: 12px; color: #475569; line-height: 1.4;">Foco Técnico rígido, Rigor Analítico, Reserva, Impulsividade, Organização excessiva.</div>
                </div>
                <!-- S -->
                <div style="border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; background: #f0fdf4; box-sizing: border-box;">
                  <h3 style="font-size: 15px; font-weight: bold; color: #16a34a; border-bottom: 2px solid #86efac; padding-bottom: 6px; margin: 0 0 12px 0;">ESTABILIDADE (S)</h3>
                  <div style="font-size: 12px; color: #16a34a; font-weight: bold; margin-bottom: 4px;">Aumentar (+)</div>
                  <div style="font-size: 12px; color: #475569; margin-bottom: 12px; line-height: 1.4;">Método de trabalho, Paciência, Tolerância, Organização, Comando pessoal, Rapidez, Exposição a Mudanças, Assumir Riscos.</div>
                  <div style="font-size: 12px; color: #dc2626; font-weight: bold; margin-bottom: 4px;">Diminuir (-)</div>
                  <div style="font-size: 12px; color: #475569; line-height: 1.4;">Apressamento de tarefas, Tempo de Execução prolongado.</div>
                </div>
                <!-- C -->
                <div style="border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; background: #eff6ff; box-sizing: border-box;">
                  <h3 style="font-size: 15px; font-weight: bold; color: #2563eb; border-bottom: 2px solid #93c5fd; padding-bottom: 6px; margin: 0 0 12px 0;">CONFORMIDADE (C)</h3>
                  <div style="font-size: 12px; color: #16a34a; font-weight: bold; margin-bottom: 4px;">Aumentar (+)</div>
                  <div style="font-size: 12px; color: #475569; margin-bottom: 12px; line-height: 1.4;">Estruturação de processos, Especialização técnica, Cuidado, Reserva pessoal, Discrição.</div>
                  <div style="font-size: 12px; color: #dc2626; font-weight: bold; margin-bottom: 4px;">Diminuir (-)</div>
                  <div style="font-size: 12px; color: #475569; line-height: 1.4;">Formalismo excessivo, Espírito Aventureiro, Trabalho em Equipe excessivo, Perfeccionismo extremo, Organização exagerada.</div>
                </div>
              </div>
            </div>

            <div class="footer-info">
              <span>Candidato: ${colab.nm_completo}</span>
              <span>Página 5 de 6</span>
            </div>
          </div>

          <!-- PAGE 6: MATRIZ DE COMPETENCIAS -->
          <div class="page page-break" style="padding: 15mm 20mm 20mm 20mm;">
            <div class="header-info">
              <span>Mapeamento Comportamental (DISC)</span>
              <span>Relatório Individual</span>
            </div>

            <div class="page-content">
              <h2 class="title-section" style="margin-bottom: 4px;">Matriz das Competências</h2>
              <div class="subtitle-section" style="margin-bottom: 12px;">Mapa comparativo das 20 competências comportamentais avaliadas</div>
              
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                ${competenciesGroupsHtml}
              </div>
            </div>

            <div class="footer-info">
              <span>Candidato: ${colab.nm_completo}</span>
              <span>Página 6 de 6</span>
            </div>
          </div>
        </body>
      </html>
    `);
    janela.document.close();
  };

  const disc = colab.js_pontuacao_disc;

  // --- LÓGICA DE INTERPRETAÇÃO DINÂMICA ---
  const perfilPrincipal = colab.sg_perfil_disc?.[0] || "D";
  const INTERPRETACAO: Record<string, any> = {
    D: {
      pressao: "tende a intensificar sua Dominância. Isso pode resultar em comunicação ríspida, impaciência com processos lentos e foco excessivo em resultados rápidos, às vezes ignorando o impacto nas pessoas.",
      cor: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      icon: "bolt"
    },
    I: {
      pressao: "tende a se tornar excessivamente emocional ou desorganizado. Pode tentar resolver conflitos através da persuasão excessiva ou buscar aprovação constante, perdendo o foco na execução técnica.",
      cor: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: "chat_bubble"
    },
    S: {
      pressao: "tende a se retrair ou apresentar resistência passiva a mudanças bruscas. Pode ter dificuldade em tomar decisões rápidas sob estresse, preferindo manter o status quo para evitar conflitos.",
      cor: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
      icon: "favorite"
    },
    C: {
      pressao: "tende a se tornar excessivamente crítico e perfeccionista. Pode se isolar para analisar dados exaustivamente, gerando lentidão na entrega (paralisia por análise) por medo de cometer erros.",
      cor: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: "fact_check"
    }
  };

  const infoPerfil = INTERPRETACAO[perfilPrincipal] || INTERPRETACAO["D"];

  // Calcula alvos dinâmicos baseados na média das competências se existirem
  const getAlvoMedio = (letra: string) => {
    const comps = disc.competencias?.filter(c => c.letra === letra) || [];
    if (comps.length === 0) return letra === "D" ? 90 : letra === "I" ? 60 : letra === "S" ? 40 : 30; // Fallback
    return Math.round(comps.reduce((acc, curr) => acc + curr.alvo, 0) / comps.length);
  };

  const dynamicTargets = disc.exigencia || {
    D: getAlvoMedio("D"),
    I: getAlvoMedio("I"),
    S: getAlvoMedio("S"),
    C: getAlvoMedio("C")
  };

  const getIniciais = (nome: string) => nome.substring(0, 2).toUpperCase();
  const donutGradient = `conic-gradient(#EF4444 0% ${disc.D}%, #EAB308 ${disc.D}% ${disc.D + disc.I}%, #22C55E ${disc.D + disc.I}% ${disc.D + disc.I + disc.S}%, #3B82F6 ${disc.D + disc.I + disc.S}% 100%)`;

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col h-screen overflow-hidden">
      {/* HEADER SUPERIOR */}
      <header className="bg-white px-4 sm:px-8 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-[#064384] text-sm font-bold transition-colors pl-12 lg:pl-0"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
          Voltar ao Mapa
        </button>
      </header>

      {/* PERFIL DO CANDIDATO E BOTÕES DE EXPORTAÇÃO */}
      <div className="bg-white px-4 sm:px-8 py-5 sm:py-6 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
        <div className="flex gap-4 sm:gap-5 items-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#064384] font-black text-lg shrink-0">
            {getIniciais(colab.nm_completo)}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate">
                {colab.nm_completo}
              </h1>
              <span className="text-[#064384] text-[9px] font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Candidato
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="material-symbols-outlined text-[14px]">
                  calendar_today
                </span>
                {new Date(colab.dt_admissao).toLocaleDateString("pt-BR")}
              </span>
              <span className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[14px]">
                  work
                </span>
                {colab.CARGOS?.nm_titulo || "Sem Cargo"}
              </span>
            </div>
          </div>
        </div>

        {/* Ações Mobile e Desktop */}
        <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto">
          <button
            className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={handleShare}
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span className="hidden xs:inline">Compartilhar</span>
          </button>
          {/* BOTÃO DE GERAR PDF COM O NOVO LAYOUT */}
          <button
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#FF8323] px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95"
            onClick={handlePrint}
          >
            <span className="material-symbols-outlined text-[18px]">
              download
            </span>
            <span className="hidden xs:inline">Exportar PDF Oficial</span>
            <span className="xs:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="px-4 sm:px-8 bg-white border-b border-slate-200 flex gap-6 sm:gap-10 shrink-0 overflow-x-auto scrollbar-hide whitespace-nowrap">
        {[
          { id: "overview", label: "Visão Geral", icon: "grid_view" },
          {
            id: "qualitative",
            label: "Análise Qualitativa",
            icon: "psychology",
          },
          {
            id: "competencies",
            label: "Competências",
            icon: "format_list_bulleted",
          },
          { id: "pdi", label: "Plano PDI", icon: "flag" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 text-[12px] sm:text-[13px] font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors outline-none ${
              activeTab === tab.id
                ? "border-[#FF8323] text-[#FF8323]"
                : "border-transparent text-slate-400 hover:text-[#064384]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      <main
        className="flex-1 p-4 sm:p-8 overflow-y-auto scrollbar-hide max-w-[1200px] mx-auto w-full"
        id="area-relatorio"
      >
        {/* ================= ABA 1: VISÃO GERAL ================= */}
        <div
          className={`aba-container ${activeTab === "overview" ? "block" : "hidden"}`}
        >
          <h2 className="text-lg sm:text-xl font-black text-[#064384] titulo-impressao border-b border-slate-100 pb-2 mb-6">
            Visão Geral do Perfil
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-300">
            {/* CARD 1: Perfil Natural */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-[#064384] text-xs sm:text-[13px] uppercase tracking-widest">
                  Perfil Natural (D-I-S-C)
                </h3>
              </div>
              <div className="flex flex-col items-center justify-center py-4 mb-8 relative">
                <div
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-full relative"
                  style={{ background: donutGradient }}
                >
                  <div className="absolute inset-6 sm:inset-8 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="text-3xl sm:text-[40px] font-black text-[#064384] tracking-tight leading-none">
                      {colab.sg_perfil_disc}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase mt-1">
                      Predominante
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 sm:gap-y-8 mt-auto">
                {[
                  { label: "Dominância", val: disc.D, color: "bg-[#EF4444]" },
                  { label: "Influência", val: disc.I, color: "bg-[#EAB308]" },
                  { label: "Estabilidade", val: disc.S, color: "bg-[#22C55E]" },
                  { label: "Conformidade", val: disc.C, color: "bg-[#3B82F6]" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`size-3 rounded-full ${item.color}`}
                      ></div>
                      <div className="flex flex-1 justify-between items-end">
                        <span className="text-[10px] sm:text-xs text-slate-600 font-bold uppercase tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-black">
                          {item.val}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${item.val}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 2: Perfil vs Cargo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-10">
                <h3 className="font-black text-slate-800 text-xs sm:text-[13px] uppercase tracking-widest">
                  Perfil vs. Exigência
                </h3>
                <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-[#064384]">
                    <div className="h-2 w-2 bg-[#064384] rounded-sm"></div>{" "}
                    Atual
                  </span>
                  <span className="flex items-center gap-1.5 text-[#EF4444]">
                    <div className="h-2 w-2 bg-[#EF4444] rounded-sm"></div>{" "}
                    Cargo
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-6 sm:gap-8 flex-1">
                {[
                  {
                    letter: "D",
                    val: disc.D,
                    target: dynamicTargets.D,
                    color: "text-[#EF4444]",
                  },
                  {
                    letter: "I",
                    val: disc.I,
                    target: dynamicTargets.I,
                    color: "text-[#EAB308]",
                  },
                  {
                    letter: "S",
                    val: disc.S,
                    target: dynamicTargets.S,
                    color: "text-[#22C55E]",
                  },
                  {
                    letter: "C",
                    val: disc.C,
                    target: dynamicTargets.C,
                    color: "text-[#3B82F6]",
                  },
                ].map((item) => (
                  <div
                    key={item.letter}
                    className="flex items-center gap-3 sm:gap-4"
                  >
                    <span
                      className={`w-6 font-black text-xl sm:text-2xl ${item.color}`}
                    >
                      {item.letter}
                    </span>
                    <div className="flex-1 relative h-6 rounded flex items-center">
                      <div
                        className="absolute h-[24px] rounded-r-md bg-red-100 border-l-4 border-[#EF4444] z-0"
                        style={{ width: `${item.target}%`, left: 0 }}
                      ></div>
                      <div
                        className="absolute h-[12px] bg-[#064384] rounded-md z-10 shadow-sm"
                        style={{ width: `${item.val}%`, left: 0 }}
                      ></div>
                    </div>
                    <span className="w-12 text-right text-[10px] sm:text-xs text-slate-500 font-bold">
                      {item.val}/{item.target}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Aderência Geral
                  </p>
                  <p className="text-3xl font-black text-[#064384] tracking-tight">
                    {disc.aderencia}%
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_up
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                    Compatível
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ABA 2: ANÁLISE QUALITATIVA ================= */}
        <div
          className={`aba-container ${activeTab === "qualitative" ? "block" : "hidden"}`}
        >
          <h2 className="text-lg sm:text-xl font-black text-[#064384] titulo-impressao border-b border-slate-100 pb-2 mb-6">
            Análise Qualitativa
          </h2>
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Dominância",
                  icon: "bolt",
                  attr: "Assertividade",
                  desc: "Foco em resultados e rapidez na execução.",
                  color: "#EF4444",
                },
                {
                  title: "Influência",
                  icon: "chat_bubble",
                  attr: "Persuasão",
                  desc: "Habilidade em envolver e convencer pessoas.",
                  color: "#EAB308",
                },
                {
                  title: "Estabilidade",
                  icon: "favorite",
                  attr: "Lealdade",
                  desc: "Consistência e apoio aos processos de equipe.",
                  color: "#22C55E",
                },
                {
                  title: "Conformidade",
                  icon: "fact_check",
                  attr: "Precisão",
                  desc: "Atenção minuciosa aos padrões e detalhes.",
                  color: "#3B82F6",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: item.color,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{ color: item.color }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <h4 className="text-[#064384] font-black text-lg">
                    {item.attr}
                  </h4>
                  <p className="text-slate-500 text-xs mt-1 leading-tight font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={`${infoPerfil.bg} border ${infoPerfil.border} rounded-2xl p-6 sm:p-8 relative overflow-hidden`}
            >
              <div
                className={`absolute -right-4 -top-4 sm:-right-8 sm:-top-8 ${infoPerfil.cor} opacity-5 pointer-events-none`}
              >
                <span className="material-symbols-outlined text-[100px] sm:text-[160px]">
                  {infoPerfil.icon}
                </span>
              </div>
              <div className="relative z-10 max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`size-10 rounded-xl ${infoPerfil.bg} border ${infoPerfil.border} flex items-center justify-center ${infoPerfil.cor}`}
                  >
                    <span className="material-symbols-outlined font-bold">
                      release_alert
                    </span>
                  </div>
                  <h4
                    className={`${infoPerfil.cor} text-lg sm:text-xl font-black uppercase tracking-tight`}
                  >
                    Sob Pressão
                  </h4>
                </div>
                <p
                  className={`${infoPerfil.cor} brightness-50 text-sm leading-relaxed font-medium`}
                >
                  Sob condições de estresse elevado,{" "}
                  {colab.nm_completo.split(" ")[0]} {infoPerfil.pressao}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ABA 3: MATRIZ DE COMPETÊNCIAS ================= */}
        <div
          className={`aba-container ${activeTab === "competencies" ? "block" : "hidden"}`}
        >
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-black text-[#064384] titulo-impressao border-b border-slate-100 pb-2">
                Matriz de Competências
              </h2>
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex gap-6 shadow-sm w-full sm:w-auto justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-6 bg-[#064384] rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Candidato
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-red-500 rounded-sm"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Cargo
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[
                {
                  title: "Dominância",
                  color: "#EF4444",
                  key: "D",
                  subtitle: "Foco em Resultados",
                },
                {
                  title: "Influência",
                  color: "#EAB308",
                  key: "I",
                  subtitle: "Foco em Pessoas",
                },
                {
                  title: "Estabilidade",
                  color: "#22C55E",
                  key: "S",
                  subtitle: "Foco em Processos",
                },
                {
                  title: "Conformidade",
                  color: "#3B82F6",
                  key: "C",
                  subtitle: "Foco em Qualidade",
                },
              ].map((perfil) => (
                <div
                  key={perfil.key}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  style={{
                    borderTopWidth: "4px",
                    borderTopColor: perfil.color,
                  }}
                >
                  <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h3
                      className="font-black flex items-center gap-2 text-[11px] sm:text-[13px] uppercase tracking-widest"
                      style={{ color: perfil.color }}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: perfil.color }}
                      ></span>{" "}
                      {perfil.title}
                    </h3>
                  </div>
                  <div className="p-5 sm:p-6 space-y-5">
                    {disc.competencias
                      ?.filter((c) => c.letra === perfil.key)
                      .map((comp) => (
                        <div key={comp.label} className="space-y-1.5">
                          <div className="flex justify-between items-end">
                            <span className="text-[11px] sm:text-xs font-bold text-[#064384] truncate pr-2">
                              {comp.label}
                            </span>
                            <span className="text-[10px] font-black text-slate-400">
                              {comp.valor}%
                            </span>
                          </div>
                          <div className="relative h-2 bg-slate-100 rounded-full w-full">
                            <div
                              className="absolute h-full bg-[#064384] rounded-full transition-all duration-1000"
                              style={{ width: `${comp.valor}%` }}
                            ></div>
                            <div
                              className="absolute h-[18px] w-[3px] bg-red-500 rounded-sm z-10"
                              style={{ left: `${comp.alvo}%`, top: "-5px" }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= ABA 4: PLANO PDI ================= */}
        <div
          className={`aba-container ${activeTab === "pdi" ? "block" : "hidden"}`}
        >
          <div className="space-y-8 animate-in fade-in duration-300">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-[#064384] px-6 py-4">
                <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8323]">
                    edit_note
                  </span>{" "}
                  Recomendações (PDI)
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <textarea
                  value={colab.ds_observacoes || ""}
                  onChange={(e) =>
                    setColab({ ...colab, ds_observacoes: e.target.value })
                  }
                  className="w-full min-h-[160px] p-4 sm:p-6 text-slate-700 text-sm font-medium leading-relaxed border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF8323] outline-none resize-none"
                  placeholder="Anote o plano de desenvolvimento baseado no resultado deste candidato..."
                />
                <div className="mt-4 sm:mt-6 flex justify-end">
                  <button
                    onClick={async () => {
                      const { error } = await supabase
                        .from("FUNCIONARIOS")
                        .update({ ds_observacoes: colab.ds_observacoes })
                        .eq("cd_funcionario", colab.cd_funcionario);
                      if (!error) alert("Anotações salvas com sucesso!");
                    }}
                    className="w-full sm:w-auto bg-[#FF8323] hover:bg-[#e5761f] text-white px-8 py-3 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                  >
                    Gravar PDI
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
