import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Upload, Search, DollarSign, Activity, Award,
  Sliders, Trash2, Lock, Edit2, Target, TrendingUp, UserCheck,
  ClipboardList, Settings2, Download, Star, Cloud, Loader2, Calendar, Save,
  History, BarChart3, Filter
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

import StatCard from "./components/StatCard";
import SummaryItem from "./components/SummaryItem";
import RuleColumn from "./components/RuleColumn";
import SimpleLineChart from "./components/SimpleLineChart";
import NavBar from "./components/NavBar";
import { formatCurrency } from "./utils/formatCurrency";
import { initialRules, initialGoals } from "./utils/constants";
import { useSupabase } from "./hooks/useSupabase";

// --- HELPERS ---
const parseNum = (val, isScore = false) => {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  let s = val.toString().trim().replace("R$", "").trim();
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else if (lastDot > lastComma) s = s.replace(/,/g, "");
  return parseFloat(s) || 0;
};

const extractValue = (row, key) => {
  const keys = Object.keys(row);
  const map = {
    sdr: ["Negócio - SDR", "sdr", "sdr responsável", "Atividade - Proprietário", "Proprietário da atividade"],
    proprietario: ["Negócio - Proprietário", "Proprietário", "closer", "proprietario"],
    valor: ["Negócio - Valor do negócio", "Valor", "Amount"],
    soma: ["Soma TOTAL", "soma total", "score", "Negócio - Pontuação total reunião"],
    nome: ["Organização - Nome", "Negócio - Nome do negócio", "Nome", "cliente", "titulo"],
  };
  const targets = map[key.toLowerCase()] || [key.toLowerCase()];
  for (let sk of targets) {
    const found = keys.find((k) => k.toLowerCase().trim() === sk.toLowerCase().trim());
    if (found) return row[found];
  }
  return undefined;
};

const normalizeName = (name) =>
  name ? name.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

const isSamePerson = (nameA, nameB) => {
  const nA = normalizeName(nameA);
  const nB = normalizeName(nameB);
  return nA && nB && (nA.includes(nB) || nB.includes(nA));
};

const getTierValue = (list, val, field = "min") => {
  const sorted = [...list].sort((a, b) => b[field] - a[field]);
  return sorted.find((item) => val >= item[field]);
};

// --- APP PRINCIPAL ---
const App = () => {
  const [activeTab, setActiveTab] = useState("DASHBOARD");

  // --- ESTADOS DE DATA E NUVEM ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportTitle, setReportTitle] = useState("");

  // --- NOVO ESTADO: HISTÓRICO ---
  const [selectedHistoryPerson, setSelectedHistoryPerson] = useState("GLOBAL");
  const [historyFilter, setHistoryFilter] = useState("LAST_6");
  const [historySort, setHistorySort] = useState("ACH_DESC"); // Default to Achievement Descending
  const [fechamentoSort, setFechamentoSort] = useState("DATE_DESC"); // New state for Fechamento sorting

  const [selectedPerson, setSelectedPerson] = useState("");
  const [vendasRaw, setVendasRaw] = useState([]);
  const [reunioesRaw, setReunioesRaw] = useState([]);

  // --- REGRAS & METAS ---
  const [rules, setRules] = useState(initialRules);
  const [goals, setGoals] = useState(initialGoals);

  // --- HOOKS ---
  const {
    loading,
    uploading,
    savingManual,
    historyDB,
    saveData,
    consolidateHistory,
    fetchData,
    handleUpload
  } = useSupabase(selectedMonth, selectedYear, reportTitle);

  // Atualiza título do relatório
  useEffect(() => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    setReportTitle(date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
  }, [selectedMonth, selectedYear]);

  // Carregar dados ao iniciar ou mudar data
  useEffect(() => {
    fetchData(setVendasRaw, setReunioesRaw, setRules, setGoals);
  }, [selectedMonth, selectedYear]);

  // --- STORE ---
  const dataStore = useMemo(() => {
    const calculatedRevenue = vendasRaw.reduce((acc, v) => acc + parseNum(extractValue(v, "valor")), 0);
    const faturamentoTimeReal = goals.timeRealManual !== "" ? parseNum(goals.timeRealManual) : calculatedRevenue;
    const atingimentoTime = goals.timeMeta > 0 ? (faturamentoTimeReal / goals.timeMeta) * 100 : 0;

    const sdrsSet = new Set();
    reunioesRaw.forEach((r) => sdrsSet.add(extractValue(r, "sdr")));
    vendasRaw.forEach((v) => sdrsSet.add(extractValue(v, "sdr")));

    const closers = [...new Set(vendasRaw.map((v) => extractValue(v, "proprietario")))].filter(Boolean).sort();
    const sdrs = [...sdrsSet].filter(Boolean).sort();

    return {
      faturamentoTimeReal,
      atingimentoTime,
      people: { sdrs, closers },
      totalMeetings: reunioesRaw.length,
      totalDeals: vendasRaw.length,
    };
  }, [vendasRaw, reunioesRaw, goals.timeRealManual, goals.timeMeta]);

  // --- HANDLERS ---
  const handleSaveManualData = async () => {
    const success = await saveData(rules, goals);
    if (success) toast.success("Dados manuais salvos com sucesso!");
    else toast.error("Erro ao salvar dados manuais.");
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("📁 Arquivo selecionado:", file.name, "Tipo:", file.type, "Tamanho:", file.size);
    const { success, rows, error } = await handleUpload(file, type);
    console.log("Upload result:", { success, error });
    if (success) {
      if (type === "VENDAS") setVendasRaw(rows);
      if (type === "REUNIOES") setReunioesRaw(rows);
      toast.success(`Arquivo salvo com sucesso para ${selectedMonth}/${selectedYear}!`);
    } else {
      console.error("❌ Erro detalhado:", error);
      toast.error(`Erro ao salvar arquivo: ${error}`);
    }
  };

  const handleConsolidateHistory = async () => {
    const { success, message } = await consolidateHistory(goals, dataStore);
    if (success) toast.success(message);
    else toast.error(message);
  };

  // --- ACTIONS ---
  const removeClosed = (id) =>
    setGoals((prev) => ({ ...prev, closedVariables: prev.closedVariables.filter((v) => v.id !== id) }));

  const closeVariable = (name, role, value, extras = {}) => {
    setGoals((prev) => ({
      ...prev,
      closedVariables: [
        ...prev.closedVariables,
        {
          id: Date.now(),
          name,
          role,
          value,
          date: new Date().toLocaleDateString(),
          ...extras
        },
      ],
    }));
    setActiveTab("FECHAMENTO");
    toast.success("Variável fechada com sucesso!");
  };

  const updateExtraValue = (person, index, field, value) => {
    setGoals((prev) => {
      const current =
        prev.individualExtras[person] || [
          { label: "Bônus 1", val: 0 },
          { label: "Bônus 2", val: 0 },
          { label: "Bônus 3", val: 0 },
        ];
      const next = [...current];
      if (field === "val") next[index] = { ...next[index], val: parseNum(value) };
      else next[index] = { ...next[index], label: value };
      return { ...prev, individualExtras: { ...prev.individualExtras, [person]: next } };
    });
  };

  // --- CALCULATION LOGIC ---
  const calculateSDR = (name) => {
    const myReunioes = reunioesRaw.filter((r) => isSamePerson(extractValue(r, "sdr"), name));
    const myVendasRaw = vendasRaw.filter((v) => isSamePerson(extractValue(v, "sdr"), name));

    const metaIndiv = goals.individualSdrGoals[name] || goals.sdrMetaDefault;
    const atingimentoMeta = metaIndiv > 0 ? (myReunioes.length / metaIndiv) * 100 : 0;

    const v1 = getTierValue(rules.sdr.t1MetaReunioes, atingimentoMeta, "perc")?.val || 0;
    const universal = getTierValue(rules.bonusUniversal, dataStore.atingimentoTime, "min")?.val || 0;
    const v2 = universal * (Math.min(atingimentoMeta, 100) / 100);

    const meetingsDetails = myReunioes.map((r) => ({
      name: extractValue(r, "nome") || "Lead/Cliente",
      score: parseNum(extractValue(r, "soma"), true),
      bonus: getTierValue(rules.sdr.t3Qualificacao, parseNum(extractValue(r, "soma"), true), "min")?.val || 0,
    }));
    const v3 = meetingsDetails.reduce((acc, d) => acc + d.bonus, 0);

    const salesDetails = myVendasRaw.map((v) => {
      const rev = parseNum(extractValue(v, "valor"));
      return {
        name: extractValue(v, "nome") || "Negócio",
        revenue: rev,
        bonus: getTierValue(rules.sdr.t4VendasIniciadas, rev, "min")?.val || 0,
      };
    });
    const v4 = salesDetails.reduce((acc, s) => acc + s.bonus, 0);

    const extras = goals.individualExtras[name] || [{ label: "Bônus 1", val: 0 }, { label: "Bônus 2", val: 0 }, { label: "Bônus 3", val: 0 }];
    const vExtra = extras.reduce((a, b) => a + b.val, 0);

    return { v1, v2, v3, v4, total: v1 + v2 + v3 + v4 + vExtra, atingimentoMeta, metaIndiv, meetingsDetails, salesDetails, extras, totalReunioesRealizadas: myReunioes.length };
  };

  const calculateCloser = (name) => {
    const myVendasRaw = vendasRaw.filter((v) => isSamePerson(extractValue(v, "proprietario"), name));
    const fatIndiv = myVendasRaw.reduce((acc, v) => acc + parseNum(extractValue(v, "valor")), 0);
    const metaIndiv = goals.individualCloserGoals[name] || goals.closerMetaBase;
    const atingimentoIndiv = metaIndiv > 0 ? (fatIndiv / metaIndiv) * 100 : 0;
    let key = dataStore.atingimentoTime >= 120 ? "supermeta" : dataStore.atingimentoTime >= 100 ? "meta" : "abaixo";
    const levels = rules.closer.matriz[key].levels;
    const threshold = Object.keys(levels).map(Number).sort((a, b) => b - a).find((l) => atingimentoIndiv >= l) || 0;
    const perc = levels[threshold];
    const v1 = fatIndiv * perc;
    const v2 = getTierValue(rules.bonusUniversal, dataStore.atingimentoTime, "min")?.val || 0;
    const extras = goals.individualExtras[name] || [{ label: "Bônus 1", val: 0 }, { label: "Bônus 2", val: 0 }, { label: "Bônus 3", val: 0 }];
    const vExtra = extras.reduce((a, b) => a + b.val, 0);
    return { v1, v2, total: v1 + v2 + vExtra, fatIndiv, metaIndiv, perc, atingimentoIndiv, extras, myVendas: myVendasRaw.map((v) => ({ name: extractValue(v, "nome"), value: parseNum(extractValue(v, "valor")) })) };
  };

  const calculateManagement = (role) => {
    const cfg = rules[role];
    const atingimentoFat = dataStore.atingimentoTime;
    const atingimentoVol = goals.meetingsMetaTotal > 0 ? (dataStore.totalMeetings / goals.meetingsMetaTotal) * 100 : 0;
    const v1 = getTierValue(cfg.bonusFaturamento, atingimentoFat, "min")?.val || 0;
    const v2 = getTierValue(cfg.bonusVolumeReunioes, atingimentoVol, "min")?.val || 0;
    const v3 = getTierValue(cfg.bonusMetaEquipe, goals.teamEfficiencyManual, "min")?.val || 0;
    const v4 = dataStore.faturamentoTimeReal * cfg.comissaoFatPerc;
    const totalQualifPaga = reunioesRaw.reduce((acc, r) => {
      const score = parseNum(extractValue(r, "soma"), true);
      const bonus = getTierValue(rules.sdr.t3Qualificacao, score, "min")?.val || 0;
      return acc + bonus;
    }, 0);
    const v5 = totalQualifPaga * cfg.overrideQualificacaoPerc;
    const name = goals.customNames[role];
    const extras = goals.individualExtras[name] || [{ label: "Bônus 1", val: 0 }, { label: "Bônus 2", val: 0 }, { label: "Bônus 3", val: 0 }];
    const vExtra = extras.reduce((a, b) => a + b.val, 0);
    return { v1, v2, v3, v4, v5, total: v1 + v2 + v3 + v4 + v5 + vExtra, totalQualifPaga, extras };
  };

  const calculateLDR = () => {
    const stats = goals.ldrStats || { garimpados: 0, cards: 0, garimpadosMeta: 1, cardsMeta: 1 };
    const atingimentoReunioes = goals.meetingsMetaTotal > 0 ? (dataStore.totalMeetings / goals.meetingsMetaTotal) * 100 : 0;
    const atingimentoFaturamento = dataStore.atingimentoTime;

    const atingimentoGarimpados = stats.garimpadosMeta > 0 ? (stats.garimpados / stats.garimpadosMeta) * 100 : 0;
    const atingimentoCards = stats.cardsMeta > 0 ? (stats.cards / stats.cardsMeta) * 100 : 0;

    const v1 = getTierValue(rules.ldr.bonusReunioes, atingimentoReunioes, "min")?.val || 0;
    const v2 = getTierValue(rules.ldr.bonusGarimpados, atingimentoGarimpados, "min")?.val || 0;
    const v3 = getTierValue(rules.ldr.bonusCards, atingimentoCards, "min")?.val || 0;
    const v4 = getTierValue(rules.bonusUniversal, atingimentoFaturamento, "min")?.val || 0;

    const name = goals.customNames.ldr;
    const extras = goals.individualExtras[name] || [{ label: "Bônus 1", val: 0 }, { label: "Bônus 2", val: 0 }, { label: "Bônus 3", val: 0 }];
    const vExtra = extras.reduce((a, b) => a + b.val, 0);

    return {
      v1, v2, v3, v4,
      total: v1 + v2 + v3 + v4 + vExtra,
      extras,
      atingimentoGarimpados,
      atingimentoCards,
      atingimentoReunioes,
      atingimentoFaturamento,
      atingimentoMedia: (atingimentoGarimpados + atingimentoCards) / 2 // Calculo da média
    };
  };

  // --- EXPORTAR RELATÓRIO ---
  const exportReport = () => {
    if (goals.closedVariables.length === 0) {
      toast.error("Não há dados fechados para exportar.");
      return;
    }

    const dataToExport = goals.closedVariables.map(v => ({
      "Mês": reportTitle,
      "Colaborador": v.name,
      "Cargo": v.role,
      "Variável a Receber": v.value,
      "Meta Pessoal": v.target ? (v.role === "Closer" ? formatCurrency(v.target) : v.target) : "-",
      "Resultado Real": v.realized ? (v.role === "Closer" ? formatCurrency(v.realized) : v.realized) : "-",
      "Atingimento %": v.achievement ? `${v.achievement.toFixed(2)}%` : "-",
      "Data Fechamento": v.date
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fechamento");
    XLSX.writeFile(wb, `Relatorio_Variavel_${reportTitle.replace(/ /g, "_")}.xlsx`);
    toast.success("Relatório gerado com sucesso!");
  };

  // --- FILTROS DE HISTÓRICO ---
  const sortedMonths = Object.keys(historyDB).sort();
  const availableYears = useMemo(() => {
    const years = new Set();
    sortedMonths.forEach(m => years.add(m.split('-')[0]));
    return Array.from(years).sort().reverse();
  }, [sortedMonths]);

  const filteredMonths = useMemo(() => {
    let result = [...sortedMonths];
    if (historyFilter === 'LAST_3') return result.slice(-3);
    if (historyFilter === 'LAST_6') return result.slice(-6);
    if (historyFilter === 'ALL') return result;
    return result.filter(m => m.startsWith(historyFilter));
  }, [sortedMonths, historyFilter]);

  // --- DADOS PARA GRÁFICO ---
  const chartData = useMemo(() => {
    if (filteredMonths.length === 0) return { data: [], lines: [] };

    if (selectedHistoryPerson === "GLOBAL") {
      return {
        data: filteredMonths.map(m => ({
          label: historyDB[m].title.split(' ')[0].substring(0, 3),
          meta: historyDB[m].teamStats.revenueGoal,
          real: historyDB[m].teamStats.revenueReal
        })),
        lines: [
          { key: 'meta', color: '#94a3b8', name: 'Meta' },
          { key: 'real', color: '#00D4C5', name: 'Realizado' }
        ]
      };
    } else {
      return {
        data: filteredMonths.map(m => {
          const monthData = historyDB[m];
          const person = monthData.individuals.find(p => p.name === selectedHistoryPerson);
          const currentRole = person?.role || (monthData.individuals.find(p => p.name === selectedHistoryPerson)?.role);

          let personAch = 0;
          let teamAvgAch = 0;

          if (currentRole) {
            if (person) personAch = person.achievement;
            const peers = monthData.individuals.filter(p => p.role === currentRole);
            if (peers.length > 0) {
              const totalAch = peers.reduce((acc, p) => acc + p.achievement, 0);
              teamAvgAch = totalAch / peers.length;
            }
          }

          return {
            label: monthData.title.split(' ')[0].substring(0, 3),
            person: personAch,
            average: teamAvgAch
          };
        }),
        lines: [
          { key: 'person', color: '#00D4C5', name: 'Atingimento Individual (%)' },
          { key: 'average', color: '#f59e0b', name: 'Média da Equipe (%)' }
        ]
      };
    }
  }, [filteredMonths, historyDB, selectedHistoryPerson]);

  const allPeopleInHistory = useMemo(() => {
    const names = new Set();
    Object.values(historyDB).forEach(month => {
      month.individuals?.forEach(ind => names.add(ind.name));
    });
    return ["GLOBAL", ...Array.from(names).sort()];
  }, [historyDB]);

  // --- DADOS PARA TABELA (HISTÓRICO) ---
  const historyTableData = useMemo(() => {
    let list = [];
    if (selectedHistoryPerson === "GLOBAL") {
      list = filteredMonths.map(m => ({
        month: historyDB[m].title,
        person: "Equipe",
        role: "Global",
        score: "-",
        value: historyDB[m].teamStats.revenueReal,
        achievement: historyDB[m].teamStats.revenueGoal > 0 ? (historyDB[m].teamStats.revenueReal / historyDB[m].teamStats.revenueGoal) * 100 : 0,
        variable: historyDB[m].individuals.reduce((acc, ind) => acc + ind.value, 0) // Sum of variables
      }));
    } else {
      filteredMonths.forEach(m => {
        const p = historyDB[m].individuals.find(i => i.name === selectedHistoryPerson);
        if (p) {
          list.push({
            month: historyDB[m].title,
            person: p.name,
            role: p.role,
            score: p.role === "SDR" ? p.realized : "-",
            value: p.role === "Closer" ? p.realized : p.value,
            achievement: p.achievement,
            variable: p.value
          });
        }
      });
    }

    return list.sort((a, b) => {
      if (historySort === "VALUE_DESC") return b.variable - a.variable;
      if (historySort === "ACH_DESC") return b.achievement - a.achievement;
      return 0;
    });
  }, [filteredMonths, historyDB, selectedHistoryPerson, historySort, rules]);

  // --- DADOS PARA TABELA DE FECHAMENTO (COM SORT) ---
  const closedTableData = useMemo(() => {
    let data = [...goals.closedVariables];
    if (fechamentoSort === "DATE_DESC") return data.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (fechamentoSort === "VALUE_DESC") return data.sort((a, b) => b.value - a.value);
    if (fechamentoSort === "VALUE_ASC") return data.sort((a, b) => a.value - b.value);
    return data;
  }, [goals.closedVariables, fechamentoSort]);


  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#021017] to-[#05202B] font-sans text-white pb-12 selection:bg-[#00D4C5]/30 relative">
      <Toaster position="top-right" />

      {/* BOTÃO FLUTUANTE DE SALVAR DADOS MANUAIS */}
      <button
        onClick={handleSaveManualData}
        disabled={savingManual}
        className="fixed bottom-8 right-8 z-50 bg-[#00D4C5] text-[#010B1D] p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest disabled:opacity-50"
      >
        {savingManual ? <Loader2 className="animate-spin" /> : <Save />}
        <span>Salvar Alterações</span>
      </button>

      <NavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reportTitle={reportTitle}
        loading={loading}
        setSelectedPerson={setSelectedPerson}
      />

      <main className="max-w-7xl mx-auto p-8">

        {/* SELETOR DE MÊS E ANO (GLOBAL) */}
        {activeTab !== "HISTÓRICO" && (
          <div className="flex justify-end items-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-[#0B132B] px-4 py-2 rounded-xl border border-white/10">
              <Calendar size={16} className="text-[#00D4C5]" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-bold text-sm outline-none text-white cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m} className="bg-[#0B132B]">{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-sm outline-none text-white cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-[#0B132B]">{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* --- DASHBOARD --- */}
        {activeTab === "DASHBOARD" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Faturamento Real"
                value={formatCurrency(dataStore.faturamentoTimeReal)}
                sub={`${dataStore.atingimentoTime.toFixed(1)}% da meta`}
                icon={<DollarSign className="text-white" size={24} />}
              />
              <StatCard
                label="Total Reuniões"
                value={dataStore.totalMeetings}
                sub="Oportunidades geradas"
                icon={<Calendar className="text-white" size={24} />}
              />
              <StatCard
                label="Total Deals"
                value={dataStore.totalDeals}
                sub="Deals criados"
                icon={<BriefcaseIcon className="text-white" size={24} />}
              />
            </div>

            <div className="bg-[#0A2230]/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-8">
                <Sliders size={20} className="text-[#00D4C5]" />
                <h2 className="text-xl font-black uppercase tracking-widest text-[#00D4C5]">Ajustes Globais</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta Faturamento</label>
                  <div className="flex items-center gap-2 bg-[#0B132B] p-4 rounded-2xl border border-white/10 focus-within:border-[#00D4C5] transition-colors">
                    <Target size={18} className="text-[#00D4C5]" />
                    <input
                      type="number"
                      value={goals.timeMeta}
                      onChange={(e) => setGoals(prev => ({ ...prev, timeMeta: parseNum(e.target.value) }))}
                      className="bg-transparent font-black text-lg outline-none w-full text-white placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fat. Real (Manual)</label>
                  <div className="flex items-center gap-2 bg-[#0B132B] p-4 rounded-2xl border border-white/10 focus-within:border-[#00D4C5] transition-colors">
                    <Edit2 size={18} className="text-amber-400" />
                    <input
                      type="number"
                      value={goals.timeRealManual}
                      placeholder="Auto"
                      onChange={(e) => setGoals(prev => ({ ...prev, timeRealManual: e.target.value }))}
                      className="bg-transparent font-black text-lg outline-none w-full text-white placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta Reuniões (Time)</label>
                  <div className="flex items-center gap-2 bg-[#0B132B] p-4 rounded-2xl border border-white/10 focus-within:border-[#00D4C5] transition-colors">
                    <UsersIcon className="text-[#00D4C5]" size={18} />
                    <input
                      type="number"
                      value={goals.meetingsMetaTotal}
                      onChange={(e) => setGoals(prev => ({ ...prev, meetingsMetaTotal: parseNum(e.target.value) }))}
                      className="bg-transparent font-black text-lg outline-none w-full text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eficiência Time (%)</label>
                  <div className="flex items-center gap-2 bg-[#0B132B] p-4 rounded-2xl border border-white/10 focus-within:border-[#00D4C5] transition-colors">
                    <Activity size={18} className="text-[#00D4C5]" />
                    <input
                      type="number"
                      value={goals.teamEfficiencyManual}
                      onChange={(e) => setGoals(prev => ({ ...prev, teamEfficiencyManual: parseNum(e.target.value) }))}
                      className="bg-transparent font-black text-lg outline-none w-full text-white"
                    />
                  </div>
                </div>
              </div>

              {/* UPLOAD AREA */}
              <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#0B132B] p-6 rounded-3xl border border-dashed border-slate-700 hover:border-[#00D4C5] transition-colors relative group">
                  <input type="file" accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => handleFileUpload(e, "VENDAS")} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400 group-hover:text-[#00D4C5] transition-colors">
                    <div className="bg-white/5 p-4 rounded-full">
                      {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Upload Planilha Vendas</span>
                  </div>
                </div>

                <div className="bg-[#0B132B] p-6 rounded-3xl border border-dashed border-slate-700 hover:border-[#00D4C5] transition-colors relative group">
                  <input type="file" accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => handleFileUpload(e, "REUNIOES")} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400 group-hover:text-[#00D4C5] transition-colors">
                    <div className="bg-white/5 p-4 rounded-full">
                      {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Upload Planilha Reuniões</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- SDR TAB --- */}
        {activeTab === "SDR" && (
          <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center bg-[#0A2230] p-6 rounded-[2rem] border border-white/5">
              <div className="flex items-center gap-4">
                <div className="bg-[#00D4C5]/10 p-3 rounded-xl text-[#00D4C5]">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">SDR Dashboard</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Selecione o colaborador abaixo</p>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="bg-[#0B132B] text-white font-bold text-sm py-3 px-6 pr-10 rounded-xl border border-white/10 outline-none appearance-none cursor-pointer focus:border-[#00D4C5] transition-colors min-w-[250px]"
                >
                  <option value="">Selecione um SDR...</option>
                  {dataStore.people.sdrs.map(sdr => (
                    <option key={sdr} value={sdr}>{sdr}</option>
                  ))}
                </select>
                <Award size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00D4C5] pointer-events-none" />
              </div>
            </div>

            {selectedPerson ? (() => {
              const data = calculateSDR(selectedPerson);
              return (
                <div className="bg-[#0A2230] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4C5]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                  <div className="flex justify-between items-start mb-10 relative">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-1">{selectedPerson}</h2>
                      <p className="text-[#00D4C5] font-bold text-sm tracking-widest uppercase">SDR Account</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Variável</p>
                      <p className="text-4xl font-black text-[#00D4C5]">{formatCurrency(data.total)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Meta Individual</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={goals.individualSdrGoals[selectedPerson] || goals.sdrMetaDefault}
                          onChange={e => setGoals(prev => ({
                            ...prev,
                            individualSdrGoals: { ...prev.individualSdrGoals, [selectedPerson]: parseNum(e.target.value) }
                          }))}
                          className="bg-transparent text-xl font-black text-white outline-none w-20"
                        />
                        <span className="text-xs font-bold text-slate-500">reuniões</span>
                      </div>
                    </div>
                    <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Realizado</p>
                      <p className="text-xl font-black text-white">{data.totalReunioesRealizadas}</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#0B132B]/50 p-6 rounded-3xl">
                    <SummaryItem label="Bônus Meta (Reuniões)" value={data.v1} highlight />
                    <SummaryItem label="Bônus Universal (Time)" value={data.v2} />
                    <SummaryItem label="Qualificação (Score)" value={data.v3} />
                    <SummaryItem label="Bônus Venda Iniciada" value={data.v4} />
                    {data.extras.map((ex, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                        <input
                          value={ex.label}
                          onChange={(e) => updateExtraValue(selectedPerson, i, "label", e.target.value)}
                          className="bg-transparent text-sm text-slate-400 font-medium outline-none w-32 focus:text-[#00D4C5]"
                        />
                        <input
                          type="number"
                          value={ex.val}
                          onChange={(e) => updateExtraValue(selectedPerson, i, "val", e.target.value)}
                          className="bg-transparent text-right font-bold text-white outline-none w-24 focus:text-[#00D4C5]"
                        />
                      </div>
                    ))}
                  </div>

                  {/* DETALHES RESTAURADOS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#00D4C5] mb-4 flex items-center gap-2">
                        <ClipboardList size={14} /> Detalhe de Reuniões
                      </h4>
                      <div className="space-y-2">
                        {data.meetingsDetails.length === 0 && <p className="text-xs text-slate-500 italic">Nenhuma reunião registrada.</p>}
                        {data.meetingsDetails.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                            <span className="text-slate-300 truncate max-w-[150px]" title={item.name}>{item.name}</span>
                            <div className="text-right">
                              <div className="font-bold text-white">{item.score} pts</div>
                              <div className="text-[10px] text-[#00D4C5]">{formatCurrency(item.bonus)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                        <TrendingUp size={14} /> Vendas Iniciadas
                      </h4>
                      <div className="space-y-2">
                        {data.salesDetails.length === 0 && <p className="text-xs text-slate-500 italic">Nenhuma venda iniciada.</p>}
                        {data.salesDetails.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                            <span className="text-slate-300 truncate max-w-[150px]" title={item.name}>{item.name}</span>
                            <div className="text-right">
                              <div className="font-bold text-white">{formatCurrency(item.revenue)}</div>
                              <div className="text-[10px] text-emerald-400">{formatCurrency(item.bonus)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => closeVariable(selectedPerson, "SDR", data.total, { target: data.metaIndiv, realized: data.totalReunioesRealizadas, achievement: data.atingimentoMeta })}
                      className="bg-[#00D4C5] hover:bg-[#00c0b2] text-[#021017] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-[#00D4C5]/20 flex items-center gap-2"
                    >
                      <Lock size={16} />
                      Fechar Variável
                    </button>
                  </div>
                </div>
              );
            })() : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4 bg-[#0A2230]/40 rounded-[2.5rem] border border-white/5 border-dashed">
                <UserCheck size={48} strokeWidth={1} />
                <p className="font-medium">Selecione um SDR acima para visualizar os dados</p>
              </div>
            )}
          </div>
        )}

        {/* --- CLOSER TAB --- */}
        {activeTab === "CLOSER" && (
          <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center bg-[#0A2230] p-6 rounded-[2rem] border border-white/5">
              <div className="flex items-center gap-4">
                <div className="bg-[#00D4C5]/10 p-3 rounded-xl text-[#00D4C5]">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Closer Dashboard</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Selecione o executivo abaixo</p>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="bg-[#0B132B] text-white font-bold text-sm py-3 px-6 pr-10 rounded-xl border border-white/10 outline-none appearance-none cursor-pointer focus:border-[#00D4C5] transition-colors min-w-[250px]"
                >
                  <option value="">Selecione um Closer...</option>
                  {dataStore.people.closers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Award size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00D4C5] pointer-events-none" />
              </div>
            </div>

            {selectedPerson ? (() => {
              const data = calculateCloser(selectedPerson);
              return (
                <div className="bg-[#0A2230] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4C5]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                  <div className="flex justify-between items-start mb-10 relative">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-1">{selectedPerson}</h2>
                      <p className="text-[#00D4C5] font-bold text-sm tracking-widest uppercase">Closer / Executivo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Variável</p>
                      <p className="text-4xl font-black text-[#00D4C5]">{formatCurrency(data.total)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                      <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Meta Individual</label>
                      <input
                        type="number"
                        value={goals.individualCloserGoals[selectedPerson] || goals.closerMetaBase}
                        onChange={e => setGoals(prev => ({
                          ...prev,
                          individualCloserGoals: { ...prev.individualCloserGoals, [selectedPerson]: parseNum(e.target.value) }
                        }))}
                        className="bg-transparent text-lg font-black text-white outline-none w-full"
                      />
                    </div>
                    <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Realizado</p>
                      <p className="text-lg font-black text-white">{formatCurrency(data.fatIndiv)}</p>
                    </div>
                    <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Atingimento</p>
                      <p className={`text-lg font-black ${data.atingimentoIndiv >= 100 ? "text-[#00D4C5]" : "text-amber-400"}`}>{data.atingimentoIndiv.toFixed(1)}%</p>
                    </div>
                    <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Comissão (%)</p>
                      <p className="text-lg font-black text-[#00D4C5]">{(data.perc * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 bg-[#0B132B]/50 p-6 rounded-3xl h-full">
                      <SummaryItem label="Comissão Faturamento" value={data.v1} highlight />
                      <SummaryItem label="Bônus Universal" value={data.v2} />
                      {data.extras.map((ex, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                          <input
                            value={ex.label}
                            onChange={(e) => updateExtraValue(selectedPerson, i, "label", e.target.value)}
                            className="bg-transparent text-sm text-slate-400 font-medium outline-none w-32 focus:text-[#00D4C5]"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-bold text-sm">R$</span>
                            <input
                              type="number"
                              value={ex.val}
                              onChange={(e) => updateExtraValue(selectedPerson, i, "val", e.target.value)}
                              className="bg-transparent text-right font-bold text-white outline-none w-20 focus:text-[#00D4C5]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5 h-full flex flex-col">
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                        <BriefcaseIcon size={14} /> Detalhe de Vendas
                      </h4>
                      <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {data.myVendas.length === 0 && <p className="text-xs text-slate-500 italic">Nenhuma venda registrada.</p>}
                        {data.myVendas.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                            <span className="text-slate-300 truncate max-w-[200px]" title={item.name}>{item.name || "Venda sem nome"}</span>
                            <div className="font-bold text-white">{formatCurrency(item.value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>


                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => closeVariable(selectedPerson, "Closer", data.total, { target: data.metaIndiv, realized: data.fatIndiv, achievement: data.atingimentoIndiv })}
                      className="bg-[#00D4C5] hover:bg-[#00c0b2] text-[#021017] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-[#00D4C5]/20 flex items-center gap-2"
                    >
                      <Lock size={16} /> Fechar Variável
                    </button>
                  </div>
                </div>
              );
            })() : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4 bg-[#0A2230]/40 rounded-[2.5rem] border border-white/5 border-dashed">
                <UserCheck size={48} strokeWidth={1} />
                <p className="font-medium">Selecione um Closer acima para visualizar os dados</p>
              </div>
            )}
          </div>
        )}

        {/* --- REGRAS (BUG FIX) --- */}
        {activeTab === "REGRAS" && (
          <div className="animate-fadeIn max-w-5xl mx-auto space-y-12">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <Settings2 size={32} className="text-[#00D4C5]" />
              <h2 className="text-3xl font-black text-white">Configuração de Regras</h2>
            </div>

            {/* CORREÇÃO AQUI: State Mutation Avoidance */}
            <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00D4C5] border-l-8 border-[#00D4C5] pl-6">
                Bônus Universal (SDR + Closer)
              </h3>
              <div className="max-w-md">
                <RuleColumn
                  title="Tabela de Atingimento (%)"
                  items={rules.bonusUniversal}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      bonusUniversal: prev.bonusUniversal.map((item, i) =>
                        i === idx ? { ...item, [field]: parseNum(val) } : item
                      )
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
              </div>
            </section>

            <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400 border-l-8 border-emerald-400 pl-6">
                Regras SDR
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <RuleColumn
                  title="T1: Meta Reuniões (%)"
                  items={rules.sdr.t1MetaReunioes}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      sdr: {
                        ...prev.sdr,
                        t1MetaReunioes: prev.sdr.t1MetaReunioes.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="perc"
                  labelSuffix="%"
                />
                <RuleColumn
                  title="T3: Qualificação (Score)"
                  items={rules.sdr.t3Qualificacao}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      sdr: {
                        ...prev.sdr,
                        t3Qualificacao: prev.sdr.t3Qualificacao.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix=" pts"
                />
                <RuleColumn
                  title="T4: Bônus Venda (R$)"
                  items={rules.sdr.t4VendasIniciadas}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      sdr: {
                        ...prev.sdr,
                        t4VendasIniciadas: prev.sdr.t4VendasIniciadas.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                />
              </div>
            </section>

            <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00D4C5] border-l-8 border-[#00D4C5] pl-6">
                Regras Closing Matrix (Closer)
              </h3>
              <div className="overflow-x-auto bg-[#0B132B] p-6 rounded-3xl border border-white/10">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 uppercase tracking-widest border-b border-white/10">
                      <th className="pb-4 font-black">Meta Atingida</th>
                      {Object.keys(rules.closer.matriz.supermeta.levels).sort((a, b) => b - a).map(lvl => (
                        <th key={lvl} className="pb-4 text-center font-black">{lvl}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {Object.keys(rules.closer.matriz).map(key => (
                      <tr key={key} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4 font-bold text-white uppercase tracking-tighter">
                          {key === 'supermeta' ? 'Supermeta (120%)' : key === 'meta' ? 'Meta (100%)' : 'Abaixo da Meta'}
                        </td>
                        {Object.keys(rules.closer.matriz[key].levels).sort((a, b) => b - a).map(lvl => (
                          <td key={lvl} className="py-2 px-2">
                            <div className="flex items-center gap-1 justify-center bg-[#0A2230] p-2 rounded-xl border border-white/5 group-hover:border-[#00D4C5]/30 transition-colors">
                              <input
                                type="number"
                                step="0.1"
                                value={(rules.closer.matriz[key].levels[lvl] * 100).toFixed(1)}
                                onChange={(e) => {
                                  const val = parseNum(e.target.value) / 100;
                                  setRules(prev => ({
                                    ...prev,
                                    closer: {
                                      ...prev.closer,
                                      matriz: {
                                        ...prev.closer.matriz,
                                        [key]: {
                                          ...prev.closer.matriz[key],
                                          levels: {
                                            ...prev.closer.matriz[key].levels,
                                            [lvl]: val
                                          }
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className="bg-transparent text-center font-black text-[#00D4C5] outline-none w-12"
                              />
                              <span className="text-slate-500 font-bold">%</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 border-l-8 border-indigo-400 pl-6">
                Regras Gestor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <RuleColumn
                  title="Bônus Faturamento Time"
                  items={rules.gestor.bonusFaturamento}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      gestor: {
                        ...prev.gestor,
                        bonusFaturamento: prev.gestor.bonusFaturamento.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
                <RuleColumn
                  title="Bônus Volume Reuniões"
                  items={rules.gestor.bonusVolumeReunioes}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      gestor: {
                        ...prev.gestor,
                        bonusVolumeReunioes: prev.gestor.bonusVolumeReunioes.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
                <RuleColumn
                  title="Bônus Meta Equipe (%)"
                  items={rules.gestor.bonusMetaEquipe}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      gestor: {
                        ...prev.gestor,
                        bonusMetaEquipe: prev.gestor.bonusMetaEquipe.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
              </div>
            </section>

            <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-400 border-l-8 border-cyan-400 pl-6">
                Regras Product Owner
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <RuleColumn
                  title="Bônus Faturamento Time"
                  items={rules.produto.bonusFaturamento}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      produto: {
                        ...prev.produto,
                        bonusFaturamento: prev.produto.bonusFaturamento.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
                <RuleColumn
                  title="Bônus Volume Reuniões"
                  items={rules.produto.bonusVolumeReunioes}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      produto: {
                        ...prev.produto,
                        bonusVolumeReunioes: prev.produto.bonusVolumeReunioes.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
                <RuleColumn
                  title="Bônus Meta Equipe (%)"
                  items={rules.produto.bonusMetaEquipe}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      produto: {
                        ...prev.produto,
                        bonusMetaEquipe: prev.produto.bonusMetaEquipe.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
              </div>
            </section>

            <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-400 border-l-8 border-amber-400 pl-6">
                Regras LDR
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <RuleColumn
                  title="Bônus Reuniões Time"
                  items={rules.ldr.bonusReunioes}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      ldr: {
                        ...prev.ldr,
                        bonusReunioes: prev.ldr.bonusReunioes.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
                <RuleColumn
                  title="Bônus Garimpados"
                  items={rules.ldr.bonusGarimpados}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      ldr: {
                        ...prev.ldr,
                        bonusGarimpados: prev.ldr.bonusGarimpados.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
                <RuleColumn
                  title="Bônus Cards"
                  items={rules.ldr.bonusCards}
                  onChange={(idx, field, val) => {
                    setRules(prev => ({
                      ...prev,
                      ldr: {
                        ...prev.ldr,
                        bonusCards: prev.ldr.bonusCards.map((item, i) =>
                          i === idx ? { ...item, [field]: parseNum(val) } : item
                        )
                      }
                    }));
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
              </div>
            </section>
          </div>
        )}

        {/* --- GESTOR TAB --- */}
        {activeTab === "GESTOR" && (() => {
          const data = calculateManagement("gestor");
          return (
            <div className="animate-fadeIn space-y-8">
              <div className="bg-[#0A2230] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4C5]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex justify-between items-start mb-10 relative">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-1"><input value={goals.customNames.gestor} onChange={(e) => setGoals(prev => ({ ...prev, customNames: { ...prev.customNames, gestor: e.target.value } }))} className="bg-transparent outline-none w-full placeholder-slate-600 focus:text-[#00D4C5] transition-colors" placeholder="Nome do Gestor" /></h2>
                    <p className="text-[#00D4C5] font-bold text-sm tracking-widest uppercase">Gestão Comercial</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Variável</p>
                    <p className="text-4xl font-black text-[#00D4C5]">{formatCurrency(data.total)}</p>
                  </div>
                </div>

                <div className="space-y-2 bg-[#0B132B]/50 p-6 rounded-3xl mb-8">
                  <SummaryItem label="Bônus Faturamento (Time)" value={data.v1} highlight />
                  <SummaryItem label="Bônus Volume Reuniões" value={data.v2} />
                  <SummaryItem label="Bônus Eficiência (Meta Equipe)" value={data.v3} />
                  <SummaryItem label="Comissão Faturamento (1%)" value={data.v4} />
                  <SummaryItem label="Override Qualificação (20%)" value={data.v5} />
                  {data.extras.map((ex, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                      <input
                        value={ex.label}
                        onChange={(e) => updateExtraValue(goals.customNames.gestor, i, "label", e.target.value)}
                        className="bg-transparent text-sm text-slate-400 font-medium outline-none w-32 focus:text-[#00D4C5]"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-bold text-sm">R$</span>
                        <input
                          type="number"
                          value={ex.val}
                          onChange={(e) => updateExtraValue(goals.customNames.gestor, i, "val", e.target.value)}
                          className="bg-transparent text-right font-bold text-white outline-none w-24 focus:text-[#00D4C5]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => closeVariable(goals.customNames.gestor, "Gestor", data.total, { realized: data.total })}
                    className="bg-[#00D4C5] hover:bg-[#00c0b2] text-[#021017] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-[#00D4C5]/20 flex items-center gap-2"
                  >
                    <Lock size={16} /> Fechar Variável
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* --- PRODUCT TAB --- */}
        {activeTab === "PRODUCT" && (() => {
          const data = calculateManagement("produto");
          return (
            <div className="animate-fadeIn space-y-8">
              <div className="bg-[#0A2230] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4C5]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex justify-between items-start mb-10 relative">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-1"><input value={goals.customNames.produto} onChange={(e) => setGoals(prev => ({ ...prev, customNames: { ...prev.customNames, produto: e.target.value } }))} className="bg-transparent outline-none w-full placeholder-slate-600 focus:text-[#00D4C5] transition-colors" placeholder="Nome do PO" /></h2>
                    <p className="text-[#00D4C5] font-bold text-sm tracking-widest uppercase">Product Owner</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Variável</p>
                    <p className="text-4xl font-black text-[#00D4C5]">{formatCurrency(data.total)}</p>
                  </div>
                </div>

                <div className="space-y-2 bg-[#0B132B]/50 p-6 rounded-3xl mb-8">
                  <SummaryItem label="Bônus Faturamento (Time)" value={data.v1} highlight />
                  <SummaryItem label="Bônus Volume Reuniões" value={data.v2} />
                  <SummaryItem label="Bônus Eficiência (Meta Equipe)" value={data.v3} />
                  <SummaryItem label="Comissão Faturamento (0.6%)" value={data.v4} />
                  <SummaryItem label="Override Qualificação (10%)" value={data.v5} />
                  {data.extras.map((ex, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                      <input
                        value={ex.label}
                        onChange={(e) => updateExtraValue(goals.customNames.produto, i, "label", e.target.value)}
                        className="bg-transparent text-sm text-slate-400 font-medium outline-none w-32 focus:text-[#00D4C5]"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-bold text-sm">R$</span>
                        <input
                          type="number"
                          value={ex.val}
                          onChange={(e) => updateExtraValue(goals.customNames.produto, i, "val", e.target.value)}
                          className="bg-transparent text-right font-bold text-white outline-none w-24 focus:text-[#00D4C5]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => closeVariable(goals.customNames.produto, "Product", data.total, { realized: data.total })}
                    className="bg-[#00D4C5] hover:bg-[#00c0b2] text-[#021017] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-[#00D4C5]/20 flex items-center gap-2"
                  >
                    <Lock size={16} /> Fechar Variável
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* --- LDR TAB --- */}
        {activeTab === "LDR" && (() => {
          const data = calculateLDR();
          return (
            <div className="animate-fadeIn space-y-8">
              <div className="bg-[#0A2230] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4C5]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex justify-between items-start mb-10 relative">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-1"><input value={goals.customNames.ldr} onChange={(e) => setGoals(prev => ({ ...prev, customNames: { ...prev.customNames, ldr: e.target.value } }))} className="bg-transparent outline-none w-full placeholder-slate-600 focus:text-[#00D4C5] transition-colors" placeholder="Nome do LDR" /></h2>
                    <p className="text-[#00D4C5] font-bold text-sm tracking-widest uppercase">LDR Account</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Variável</p>
                    <p className="text-4xl font-black text-[#00D4C5]">{formatCurrency(data.total)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Meta Garimpo</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={goals.ldrStats?.garimpadosMeta || 100}
                        onChange={(e) => setGoals(prev => ({ ...prev, ldrStats: { ...prev.ldrStats, garimpadosMeta: parseNum(e.target.value) } }))}
                        className="bg-transparent text-xl font-black text-white outline-none w-20"
                      />
                    </div>
                  </div>
                  <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Garimpados Real</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={goals.ldrStats?.garimpados || 0}
                        onChange={(e) => setGoals(prev => ({ ...prev, ldrStats: { ...prev.ldrStats, garimpados: parseNum(e.target.value) } }))}
                        className="bg-transparent text-xl font-black text-white outline-none w-20"
                      />
                    </div>
                  </div>
                  <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Meta Cards</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={goals.ldrStats?.cardsMeta || 20}
                        onChange={(e) => setGoals(prev => ({ ...prev, ldrStats: { ...prev.ldrStats, cardsMeta: parseNum(e.target.value) } }))}
                        className="bg-transparent text-xl font-black text-white outline-none w-20"
                      />
                    </div>
                  </div>
                  <div className="bg-[#0B132B] p-5 rounded-2xl border border-white/5">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Cards Real</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={goals.ldrStats?.cards || 0}
                        onChange={(e) => setGoals(prev => ({ ...prev, ldrStats: { ...prev.ldrStats, cards: parseNum(e.target.value) } }))}
                        className="bg-transparent text-xl font-black text-white outline-none w-20"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-[#0B132B]/50 p-6 rounded-3xl mb-8">
                  <SummaryItem label="Bônus Reuniões (Time)" value={data.v1} highlight />
                  <SummaryItem label="Bônus Garimpo" value={data.v2} />
                  <SummaryItem label="Bônus Cards" value={data.v3} />
                  <SummaryItem label="Bônus Faturamento (Time)" value={data.v4} />
                  {data.extras.map((ex, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                      <input
                        value={ex.label}
                        onChange={(e) => updateExtraValue(goals.customNames.ldr, i, "label", e.target.value)}
                        className="bg-transparent text-sm text-slate-400 font-medium outline-none w-32 focus:text-[#00D4C5]"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-bold text-sm">R$</span>
                        <input
                          type="number"
                          value={ex.val}
                          onChange={(e) => updateExtraValue(goals.customNames.ldr, i, "val", e.target.value)}
                          className="bg-transparent text-right font-bold text-white outline-none w-24 focus:text-[#00D4C5]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => closeVariable(goals.customNames.ldr, "LDR", data.total, { realized: data.total, achievement: data.atingimentoMedia })}
                    className="bg-[#00D4C5] hover:bg-[#00c0b2] text-[#021017] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-[#00D4C5]/20 flex items-center gap-2"
                  >
                    <Lock size={16} /> Fechar Variável
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === "FECHAMENTO" && (
          <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center bg-[#0A2230] p-8 rounded-[2rem] border border-white/5">
              <h2 className="text-2xl font-black text-white">Consolidado do Mês</h2>
              <div className="flex gap-4">
                <button onClick={handleConsolidateHistory} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all">
                  Consolidar para Histórico
                </button>
                <button onClick={exportReport} className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition-all flex items-center gap-2">
                  <Download size={16} /> Exportar XLSX
                </button>
              </div>
            </div>

            <div className="bg-[#0A2230] p-6 rounded-[2rem] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white">Variáveis Fechadas</h3>
                <div className="flex gap-2">
                  <button onClick={() => setFechamentoSort("VALUE_DESC")} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${fechamentoSort === "VALUE_DESC" ? "bg-[#00D4C5] text-black" : "bg-white/5 text-slate-400"}`}>Maior Valor</button>
                  <button onClick={() => setFechamentoSort("VALUE_ASC")} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${fechamentoSort === "VALUE_ASC" ? "bg-[#00D4C5] text-black" : "bg-white/5 text-slate-400"}`}>Menor Valor</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase tracking-widest bg-white/5">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Data</th>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Cargo</th>
                      <th className="px-4 py-3 text-right">Meta</th>
                      <th className="px-4 py-3 text-right">Realizado</th>
                      <th className="px-4 py-3 text-right">Atingimento</th>
                      <th className="px-4 py-3 text-right">Valor Variável</th>
                      <th className="px-4 py-3 rounded-r-xl text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {closedTableData.length === 0 && (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-slate-500 italic">Nenhuma variável fechada neste mês.</td>
                      </tr>
                    )}
                    {closedTableData.map((v) => (
                      <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-4 text-slate-400">{v.date}</td>
                        <td className="px-4 py-4 font-bold text-white">{v.name}</td>
                        <td className="px-4 py-4 text-xs font-bold uppercase text-[#00D4C5]">{v.role}</td>
                        <td className="px-4 py-4 text-right text-slate-400">{v.target ? (v.role === "Closer" ? formatCurrency(v.target) : v.target) : "-"}</td>
                        <td className="px-4 py-4 text-right text-white">{v.realized ? (v.role === "Closer" ? formatCurrency(v.realized) : v.realized) : "-"}</td>
                        <td className={`px-4 py-4 text-right font-bold ${v.achievement >= 100 ? "text-emerald-400" : "text-amber-400"}`}>{v.achievement ? `${v.achievement.toFixed(1)}%` : "-"}</td>
                        <td className="px-4 py-4 text-right font-black text-[#00D4C5] text-lg">{formatCurrency(v.value)}</td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => removeClosed(v.id)} className="text-slate-600 hover:text-red-400 transition-colors p-2">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "HISTÓRICO" && (
          <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center mb-6">
              <select
                value={selectedHistoryPerson}
                onChange={(e) => setSelectedHistoryPerson(e.target.value)}
                className="bg-[#0A2230] text-white px-4 py-2 rounded-xl border border-white/10 outline-none"
              >
                {allPeopleInHistory.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <div className="flex gap-2">
                {['LAST_3', 'LAST_6', 'ALL'].map(f => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold ${historyFilter === f ? 'bg-[#00D4C5] text-black' : 'bg-white/5 text-slate-400'}`}
                  >
                    {f === 'LAST_3' ? '3 Meses' : f === 'LAST_6' ? '6 Meses' : 'Tudo'}
                  </button>
                ))}
              </div>
            </div>

            <SimpleLineChart data={chartData.data} lines={chartData.lines} />

            <div className="bg-[#0A2230] p-6 rounded-[2rem] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white">Detalhamento</h3>
                <div className="flex gap-2">
                  <button onClick={() => setHistorySort("VALUE_DESC")} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${historySort === "VALUE_DESC" ? "bg-[#00D4C5] text-black" : "bg-white/5 text-slate-400"}`}>Maior Variável</button>
                  <button onClick={() => setHistorySort("ACH_DESC")} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${historySort === "ACH_DESC" ? "bg-[#00D4C5] text-black" : "bg-white/5 text-slate-400"}`}>Maior Atingimento</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase tracking-widest bg-white/5">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Mês</th>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Cargo</th>
                      <th className="px-4 py-3 text-right">Resultado</th>
                      <th className="px-4 py-3 text-right">Atingimento</th>
                      <th className="px-4 py-3 rounded-r-xl text-right">Variável Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {historyTableData.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-slate-500 italic">Nenhum dado histórico encontrado para o filtro selecionado.</td>
                      </tr>
                    )}
                    {historyTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-bold text-white">{row.month}</td>
                        <td className="px-4 py-4">{row.person}</td>
                        <td className="px-4 py-4 text-xs font-bold uppercase text-slate-500">{row.role}</td>
                        <td className="px-4 py-4 text-right">{typeof row.value === 'number' && row.role === 'Closer' ? formatCurrency(row.value) : row.role === 'SDR' ? row.score : formatCurrency(row.value)}</td>
                        <td className={`px-4 py-4 text-right font-bold ${row.achievement >= 100 ? "text-[#00D4C5]" : "text-amber-400"}`}>{row.achievement.toFixed(2)}%</td>
                        <td className="px-4 py-4 text-right font-black text-[#00D4C5]">{formatCurrency(row.variable)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

// --- ARQUIVO ÚNICO POR ENQUANTO PARA SIMPLIFICAR ---
const BriefcaseIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
)

const UsersIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
)

export default App;