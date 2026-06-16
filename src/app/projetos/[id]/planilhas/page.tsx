"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────
type Nivel = "Abaixo" | "Dentro" | "Acima";
type TipoFormulario = "comportamental" | "lideranca" | "gestao";

interface Colaborador9Box {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  comportamento: Nivel;
  eixo: Nivel;
}

interface BoxInfo {
  nome: string;
  cor: string;
  bg: string;
  num: number;
}

// ── Constants ─────────────────────────────────────────────────────────
const NIVEIS: Nivel[] = ["Abaixo", "Dentro", "Acima"];

const TIPOS_CONFIG: Record<TipoFormulario, { label: string; eixoLabel: string; icon: string }> = {
  comportamental: { label: "Comportamental", eixoLabel: "Desempenho", icon: "person_check" },
  lideranca:      { label: "Liderança",       eixoLabel: "Capacidade de Liderança", icon: "supervisor_account" },
  gestao:         { label: "Gestão de Pessoas", eixoLabel: "Gestão de Pessoas", icon: "groups_3" },
};

// MATRIZ[comportamento][eixo] → box
const MATRIZ: Record<Nivel, Record<Nivel, BoxInfo>> = {
  Acima: {
    Abaixo: { nome: "Desenvolver Técnica",          cor: "#84cc16", bg: "#f7fee7", num: 5 },
    Dentro: { nome: "Aprimorar Técnica",             cor: "#22c55e", bg: "#dcfce7", num: 8 },
    Acima:  { nome: "Destaques",                     cor: "#059669", bg: "#d1fae5", num: 9 },
  },
  Dentro: {
    Abaixo: { nome: "Verificar Situação",            cor: "#ca8a04", bg: "#fefce8", num: 3 },
    Dentro: { nome: "Aprimorar Comportamento e Técnica",  cor: "#ca8a04", bg: "#fef9c3", num: 6 },
    Acima:  { nome: "Aprimorar Comportamento",       cor: "#22c55e", bg: "#f0fdf4", num: 7 },
  },
  Abaixo: {
    Abaixo: { nome: "Insuficientes",                 cor: "#dc2626", bg: "#fef2f2", num: 1 },
    Dentro: { nome: "Trabalhar Valores",             cor: "#ea580c", bg: "#fff7ed", num: 2 },
    Acima:  { nome: "Desenvolver Comportamento",     cor: "#f97316", bg: "#fff7ed", num: 4 },
  },
};

const DADOS_INICIAIS: Record<TipoFormulario, Colaborador9Box[]> = {
  comportamental: [], lideranca: [], gestao: [],
};

const FORM_VAZIO = { nome: "", cargo: "", departamento: "", comportamento: "Dentro" as Nivel, eixo: "Dentro" as Nivel };

// ── Component ─────────────────────────────────────────────────────────
export default function PlanilhasPage() {
  const params = useParams();
  const router = useRouter();
  const projetoId = params.id as string;

  const [tipo, setTipo] = useState<TipoFormulario>("comportamental");
  const [dados, setDados] = useState<Record<TipoFormulario, Colaborador9Box[]>>(DADOS_INICIAIS);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const storageKey = `9box_${projetoId}`;

  useEffect(() => {
    if (!projetoId) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setDados(JSON.parse(stored));
    } catch {}
  }, [projetoId, storageKey]);

  const persistir = (novosDados: typeof dados) => {
    setDados(novosDados);
    localStorage.setItem(storageKey, JSON.stringify(novosDados));
  };

  const colabsDoTipo = dados[tipo];
  const cfg = TIPOS_CONFIG[tipo];

  // ── CRUD ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    const lista = [...colabsDoTipo];
    if (editId) {
      const idx = lista.findIndex(c => c.id === editId);
      if (idx >= 0) lista[idx] = { ...form, id: editId };
      setEditId(null);
    } else {
      lista.push({ ...form, id: `${Date.now()}` });
    }
    persistir({ ...dados, [tipo]: lista });
    setForm(FORM_VAZIO);
    setMostrarForm(false);
  };

  const handleEdit = (c: Colaborador9Box) => {
    setForm({ nome: c.nome, cargo: c.cargo, departamento: c.departamento, comportamento: c.comportamento, eixo: c.eixo });
    setEditId(c.id);
    setMostrarForm(true);
  };

  const handleDelete = (id: string) => {
    persistir({ ...dados, [tipo]: colabsDoTipo.filter(c => c.id !== id) });
  };

  const cancelar = () => { setForm(FORM_VAZIO); setEditId(null); setMostrarForm(false); };

  const getColabsByBox = (comp: Nivel, eixo: Nivel) =>
    colabsDoTipo.filter(c => c.comportamento === comp && c.eixo === eixo);

  // ── PDF Export ──
  const exportarPDF = () => {
    const hoje = new Date().toLocaleDateString("pt-BR");

    const matrizHTML = (["Acima", "Dentro", "Abaixo"] as Nivel[]).map(comp =>
      `<tr>
        <td style="background:#334155;color:white;font-size:10px;font-weight:900;padding:8px;text-align:center;border:2px solid white;">${comp} das Expectativas</td>
        ${NIVEIS.map(eixoVal => {
          const box = MATRIZ[comp][eixoVal];
          const nomes = getColabsByBox(comp, eixoVal).map(c =>
            `<div style="font-size:10px;font-weight:700;background:white;border-radius:4px;padding:2px 6px;margin:2px 0;">${c.nome}</div>`
          ).join("");
          return `<td style="background:${box.bg};border:2px solid white;padding:10px;min-width:140px;vertical-align:top;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px;">
              <span style="font-size:10px;font-weight:900;color:${box.cor};text-transform:uppercase;">${box.nome}</span>
              <span style="font-size:16px;font-weight:900;color:${box.cor};opacity:0.25;">${box.num}</span>
            </div>
            ${nomes || '<div style="font-size:10px;color:#94a3b8;font-style:italic;">Sem colaboradores</div>'}
          </td>`;
        }).join("")}
      </tr>`
    ).join("");

    const tabelaHTML = colabsDoTipo.map((c, i) => {
      const box = MATRIZ[c.comportamento][c.eixo];
      return `<tr style="border-bottom:1px solid #f1f5f9;${i%2!==0?"background:#f8fafc;":""}">
        <td style="padding:7px 10px;font-size:11px;">${i+1}</td>
        <td style="padding:7px 10px;font-size:11px;font-weight:700;">${c.nome}</td>
        <td style="padding:7px 10px;font-size:11px;">${c.cargo}</td>
        <td style="padding:7px 10px;font-size:11px;">${c.departamento}</td>
        <td style="padding:7px 10px;font-size:11px;">${c.comportamento}</td>
        <td style="padding:7px 10px;font-size:11px;">${c.eixo}</td>
        <td style="padding:7px 10px;font-size:11px;font-weight:900;color:${box.cor};">${box.nome}</td>
      </tr>`;
    }).join("");

    const janela = window.open("", "", "width=1300,height=900");
    if (!janela) return;
    janela.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>*{box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:28px;}
@page{margin:10mm;size:A4 landscape;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
table{width:100%;border-collapse:collapse;}th{background:#064384;color:#fff;padding:8px 10px;font-size:11px;font-weight:900;text-align:left;}
</style></head><body>
<div style="text-align:center;border-bottom:3px solid #064384;padding-bottom:14px;margin-bottom:22px;">
  <h1 style="margin:0;font-size:18px;font-weight:900;color:#064384;text-transform:uppercase;">Matriz 9 Box — ${cfg.label}</h1>
  <p style="margin:4px 0 0;font-size:13px;color:#475569;font-weight:600;">${hoje}</p>
</div>
<h2 style="font-size:12px;font-weight:900;color:#064384;text-transform:uppercase;border-bottom:2px solid #064384;padding-bottom:6px;margin-bottom:10px;">Matriz 9 Box</h2>
<p style="font-size:11px;color:#64748b;margin:0 0 8px;"><strong>Eixo vertical (Y):</strong> Comportamento &nbsp;|&nbsp; <strong>Eixo horizontal (X):</strong> ${cfg.eixoLabel}</p>
<table style="border:2px solid #1e293b;margin-bottom:28px;">
  <thead><tr>
    <th style="width:100px;text-align:center;">Comp. \\ ${cfg.eixoLabel}</th>
    <th style="text-align:center;">${cfg.eixoLabel}: Abaixo das Expectativas</th>
    <th style="text-align:center;">${cfg.eixoLabel}: Dentro das Expectativas</th>
    <th style="text-align:center;">${cfg.eixoLabel}: Acima das Expectativas</th>
  </tr></thead>
  <tbody>${matrizHTML}</tbody>
</table>
<h2 style="font-size:12px;font-weight:900;color:#064384;text-transform:uppercase;border-bottom:2px solid #064384;padding-bottom:6px;margin-bottom:10px;">Listagem de Colaboradores (${colabsDoTipo.length})</h2>
<table><thead><tr>
  <th style="width:36px;">#</th><th>Nome</th><th>Cargo</th><th>Departamento</th><th>Comportamento</th><th>${cfg.eixoLabel}</th><th>Classificação 9 Box</th>
</tr></thead><tbody>${tabelaHTML}</tbody></table>
<div style="margin-top:26px;text-align:center;font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;border-top:1px solid #e2e8f0;padding-top:10px;">
  Metodologia: Matriz 9 Box (I Sólides) &nbsp;|&nbsp; Gerado via Consultoria Wallison Branquinho &nbsp;|&nbsp; ${hoje}
</div>
<script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},600);};</script>
</body></html>`);
    janela.document.close();
  };

  // ── Render ──
  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-slate-200 shadow-sm sticky top-0 z-10 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/projetos/${projetoId}/templates`)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-black text-[#064384] tracking-tight">Planilhas 9 Box</h2>
            <p className="text-xs font-bold text-[#FF8323] uppercase tracking-widest">Matriz de Avaliação Comportamental</p>
          </div>
        </div>
        <button
          onClick={exportarPDF}
          disabled={colabsDoTipo.length === 0}
          className="flex items-center gap-2 bg-[#064384] hover:bg-blue-900 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          Exportar PDF
        </button>
      </header>

      {/* Tabs de Tipo */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1 pt-3">
        {(Object.keys(TIPOS_CONFIG) as TipoFormulario[]).map(t => (
          <button
            key={t}
            onClick={() => { setTipo(t); cancelar(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-black transition-all border-b-2 ${tipo === t ? "border-[#064384] text-[#064384] bg-blue-50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            <span className="material-symbols-outlined text-[16px]">{TIPOS_CONFIG[t].icon}</span>
            {TIPOS_CONFIG[t].label}
            <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {dados[t].length}
            </span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Botão adicionar + formulário */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-800">Base de Dados — {cfg.label}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Eixo Y: Comportamento &nbsp;|&nbsp; Eixo X: {cfg.eixoLabel}
              </p>
            </div>
            {!mostrarForm && (
              <button
                onClick={() => setMostrarForm(true)}
                className="flex items-center gap-2 bg-[#064384] hover:bg-blue-900 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Adicionar Colaborador
              </button>
            )}
          </div>

          {/* Form */}
          {mostrarForm && (
            <form onSubmit={handleSubmit} className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="lg:col-span-1">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nome do Colaborador *</label>
                  <input
                    required
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#064384] focus:ring-2 focus:ring-[#064384]/10 transition-all"
                    placeholder="Ex: Ana Carolina Silva"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Cargo</label>
                  <input
                    value={form.cargo}
                    onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#064384] focus:ring-2 focus:ring-[#064384]/10 transition-all"
                    placeholder="Ex: Analista de RH"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Departamento</label>
                  <input
                    value={form.departamento}
                    onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#064384] focus:ring-2 focus:ring-[#064384]/10 transition-all"
                    placeholder="Ex: Recursos Humanos"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Comportamento</label>
                  <select
                    value={form.comportamento}
                    onChange={e => setForm(f => ({ ...f, comportamento: e.target.value as Nivel }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#064384] appearance-none cursor-pointer"
                  >
                    {NIVEIS.map(n => <option key={n} value={n}>{n} das Expectativas</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{cfg.eixoLabel}</label>
                  <div className="flex gap-2">
                    {NIVEIS.map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, eixo: n }))}
                        className={`flex-1 py-3 rounded-xl text-sm font-black transition-all border ${form.eixo === n ? "bg-[#064384] text-white border-[#064384]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={cancelar} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 bg-[#FF8323] hover:bg-orange-600 text-white text-sm font-black rounded-xl shadow-md transition-all active:scale-95">
                  {editId ? "Salvar Alterações" : "Adicionar à Matriz"}
                </button>
              </div>
            </form>
          )}

          {/* Tabela */}
          {colabsDoTipo.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest w-10">#</th>
                    <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Nome</th>
                    <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Cargo</th>
                    <th className="text-left px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Departamento</th>
                    <th className="text-center px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Comportamento</th>
                    <th className="text-center px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">{cfg.eixoLabel}</th>
                    <th className="text-center px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Quadrante</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {colabsDoTipo.map((c, i) => {
                    const box = MATRIZ[c.comportamento][c.eixo];
                    return (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-xs text-slate-400 font-bold">{i + 1}</td>
                        <td className="px-5 py-3 font-semibold text-sm text-slate-800">{c.nome}</td>
                        <td className="px-5 py-3 text-sm text-slate-500">{c.cargo || "—"}</td>
                        <td className="px-5 py-3 text-sm text-slate-500">{c.departamento || "—"}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${c.comportamento === "Acima" ? "bg-emerald-50 text-emerald-700" : c.comportamento === "Dentro" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"}`}>
                            {c.comportamento}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${c.eixo === "Acima" ? "bg-emerald-50 text-emerald-700" : c.eixo === "Dentro" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600"}`}>
                            {c.eixo}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full border" style={{ color: box.cor, background: box.bg, borderColor: box.cor + "40" }}>
                            {box.nome}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-[#064384] transition-colors">
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">grid_view</span>
              <p className="text-sm font-medium">Nenhum colaborador adicionado ainda.</p>
              {!mostrarForm && (
                <button onClick={() => setMostrarForm(true)} className="mt-3 text-[#064384] font-bold text-sm hover:underline">
                  Adicionar o primeiro
                </button>
              )}
            </div>
          )}
        </div>

        {/* Matriz 9 Box Visual */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-black text-slate-800 mb-1">Matriz 9 Box — Visão Consolidada</h3>
          <p className="text-xs text-slate-400 font-medium mb-6">
            Y: Comportamento &nbsp;|&nbsp; X: {cfg.eixoLabel}
          </p>

          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header colunas */}
              <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "120px repeat(3, 1fr)" }}>
                <div />
                {NIVEIS.map(n => (
                  <div key={n} className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-1.5 bg-slate-100 rounded-lg">
                    {n} das Expectativas
                  </div>
                ))}
              </div>
              {/* Label X abaixo dos headers */}
              <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: "120px repeat(3, 1fr)" }}>
                <div />
                <div className="col-span-3 text-center text-[10px] font-black text-[#064384] uppercase tracking-widest opacity-60">
                  ← {cfg.eixoLabel} →
                </div>
              </div>

              {/* Linhas da matriz */}
              {(["Acima", "Dentro", "Abaixo"] as Nivel[]).map(comp => (
                <div key={comp} className="grid gap-2 mb-2" style={{ gridTemplateColumns: "120px repeat(3, 1fr)" }}>
                  {/* Label Y */}
                  <div className="flex items-center justify-center text-center text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 rounded-lg px-2 py-3">
                    <span>
                      {comp}<br />
                      <span className="text-[8px] font-medium normal-case tracking-normal opacity-60">Expectativas</span>
                    </span>
                  </div>
                  {/* 3 boxes */}
                  {NIVEIS.map(eixoVal => {
                    const box = MATRIZ[comp][eixoVal];
                    const pessoas = getColabsByBox(comp, eixoVal);
                    return (
                      <div
                        key={eixoVal}
                        className="rounded-xl border-2 p-3 min-h-[100px] relative"
                        style={{ background: box.bg, borderColor: box.cor + "50" }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-[9px] font-black uppercase leading-tight" style={{ color: box.cor }}>
                            {box.nome}
                          </span>
                          <span className="text-xl font-black opacity-10" style={{ color: box.cor }}>{box.num}</span>
                        </div>
                        <div className="space-y-1">
                          {pessoas.map(p => (
                            <div key={p.id} className="text-[11px] font-bold bg-white/80 rounded px-2 py-1 text-slate-700 shadow-sm truncate">
                              {p.nome}
                            </div>
                          ))}
                          {pessoas.length === 0 && (
                            <div className="text-[10px] text-slate-300 italic">—</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Label Y axis */}
              <div className="grid gap-2 mt-1" style={{ gridTemplateColumns: "120px repeat(3, 1fr)" }}>
                <div className="text-center text-[10px] font-black text-[#064384] uppercase tracking-widest opacity-60 py-1">
                  ↑ Comp. ↓
                </div>
                <div className="col-span-3" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
