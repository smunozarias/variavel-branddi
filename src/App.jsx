import React, { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  Upload,
  Search,
  DollarSign,
  Activity,
  Award,
  Sliders,
  Trash2,
  Lock,
  Edit2,
  Target,
  TrendingUp,
  UserCheck,
  ClipboardList,
  Settings2,
  Download,
  Star,
} from "lucide-react";

// --- Funções Utilitárias Globais ---
const formatCurrency = (val) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val || 0);
};

// --- Biblioteca XLSX via CDN ---
const loadXLSX = () => {
  return new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    document.head.appendChild(script);
  });
};

// --- Componentes Auxiliares ---
const StatCard = ({ label, value, sub, icon }) => (
  <div className="bg-[#0A2230]/60 backdrop-blur-md p-7 rounded-[2rem] border border-[#00D4C5]/20 shadow-xl hover:border-[#00D4C5] transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D4C5]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div className="p-4 rounded-2xl text-[#021017] shadow-lg shadow-[#00D4C5]/20 group-hover:scale-110 transition-transform bg-[#00D4C5]">
        {icon}
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-cyan-100/60 uppercase tracking-[0.2em] mb-2">
          {label}
        </p>
        <p className="text-3xl font-black text-white leading-none tracking-tight">
          {value}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 text-[11px] font-semibold text-cyan-100/50 border-t border-white/5 pt-4">
      <div className="w-1.5 h-1.5 rounded-full bg-[#00D4C5] animate-pulse"></div>
      {sub}
    </div>
  </div>
);

const SummaryItem = ({ label, value, highlight }) => (
  <div
    className={`flex justify-between items-center py-3 ${
      highlight ? "border-b border-[#00D4C5]/30 mb-4 pb-4" : "border-b border-white/5"
    }`}
  >
    <span
      className={`text-sm ${
        highlight
          ? "font-black text-[#00D4C5] uppercase tracking-widest"
          : "opacity-70 font-medium text-cyan-50"
      }`}
    >
      {label}
    </span>
    <span
      className={`font-black ${
        highlight ? "text-3xl text-[#00D4C5]" : "text-sm text-white"
      }`}
    >
      {formatCurrency(value)}
    </span>
  </div>
);

const RuleColumn = ({
  title,
  items,
  onChange,
  labelKey,
  labelSuffix = "",
  labelPrefix = "",
}) => (
  <div className="space-y-4">
    <p className="text-xs font-black uppercase text-[#00D4C5] tracking-widest">{title}</p>
    <div className="space-y-2">
      {[...items]
        .sort((a, b) => b[labelKey] - a[labelKey])
        .map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 bg-[#0A2230] p-2 rounded-xl border border-white/5"
          >
            <span className="text-xs font-bold text-slate-400 w-16 text-right">
              {labelPrefix}
              {item[labelKey]}
              {labelSuffix}
            </span>
            <input
              type="number"
              value={item.val}
              onChange={(e) => onChange(idx, "val", e.target.value)}
              className="flex-1 bg-transparent text-right px-2 font-black text-[#00D4C5] outline-none"
            />
          </div>
        ))}
    </div>
  </div>
);

// --- APP PRINCIPAL ---
const App = () => {
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [reportTitle, setReportTitle] = useState("Janeiro 2025");
  const [selectedPerson, setSelectedPerson] = useState("");

  const [vendasRaw, setVendasRaw] = useState([]);
  const [reunioesRaw, setReunioesRaw] = useState([]);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  // --- REGRAS ---
  const [rules, setRules] = useState({
    bonusUniversal: [
      { min: 120, val: 750 },
      { min: 100, val: 500 },
      { min: 80, val: 350 },
    ],
    sdr: {
      t1MetaReunioes: [
        { perc: 200, val: 1200 },
        { perc: 150, val: 750 },
        { perc: 100, val: 600 },
        { perc: 80, val: 350 },
      ],
      t3Qualificacao: [
        { min: 16, val: 200 },
        { min: 14, val: 100 },
        { min: 12, val: 50 },
        { min: 0, val: 25 },
      ],
      t4VendasIniciadas: [
        { min: 10900, val: 300 },
        { min: 7900, val: 200 },
        { min: 0, val: 100 },
      ],
    },
    closer: {
      matriz: {
        supermeta: { threshold: 120, levels: { 120: 0.12, 100: 0.09, 80: 0.07, 0: 0.05 } },
        meta: { threshold: 100, levels: { 120: 0.10, 100: 0.08, 80: 0.06, 0: 0.04 } },
        abaixo: { threshold: 0, levels: { 120: 0.09, 100: 0.07, 80: 0.05, 0: 0.03 } },
      },
    },
    gestor: {
      bonusFaturamento: [
        { min: 120, val: 1125 },
        { min: 100, val: 875 },
        { min: 80, val: 625 },
      ],
      bonusVolumeReunioes: [
        { min: 120, val: 1125 },
        { min: 100, val: 875 },
        { min: 80, val: 625 },
      ],
      bonusMetaEquipe: [
        { min: 100, val: 2250 },
        { min: 80, val: 1750 },
      ],
      comissaoFatPerc: 0.01,
      overrideQualificacaoPerc: 0.2,
    },
    produto: {
      bonusFaturamento: [
        { min: 120, val: 600 },
        { min: 100, val: 450 },
        { min: 80, val: 350 },
      ],
      bonusVolumeReunioes: [
        { min: 120, val: 600 },
        { min: 100, val: 450 },
        { min: 80, val: 350 },
      ],
      bonusMetaEquipe: [
        { min: 100, val: 1125 },
        { min: 80, val: 900 },
      ],
      comissaoFatPerc: 0.006,
      overrideQualificacaoPerc: 0.1,
    },
    ldr: {
      bonusReunioes: [
        { min: 120, val: 250 },
        { min: 100, val: 200 },
        { min: 80, val: 150 },
      ],
      bonusGarimpados: [
        { min: 100, val: 400 },
        { min: 80, val: 250 },
        { min: 50, val: 150 },
      ],
      bonusCards: [
        { min: 100, val: 400 },
        { min: 80, val: 250 },
        { min: 50, val: 150 },
      ],
    },
  });

  const [goals, setGoals] = useState({
    timeMeta: 130000,
    timeRealManual: "",
    sdrMetaDefault: 14,
    individualSdrGoals: {},
    closerMetaBase: 35000,
    individualCloserGoals: {},
    meetingsMetaTotal: 100,
    dealsMetaTotal: 20,
    teamEfficiencyManual: 0,
    individualExtras: {},
    closedVariables: [],
    customNames: {
      gestor: "Sergio Muñoz",
      produto: "Ariel Regina",
      ldr: "Colaborador LDR",
    },
    ldrStats: { garimpados: 0, cards: 0, garimpadosMeta: 100, cardsMeta: 20 },
  });

  useEffect(() => {
    loadXLSX().then(() => setIsLibraryLoaded(true));
  }, []);

  // --- Motor de Processamento Numérico (Protegido Versão 5.1) ---
  const parseNum = (val, isScore = false) => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return val;
    let s = val.toString().replace("R$", "").replace(/[^\d.,-]/g, "").trim();
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else if (lastDot > lastComma) {
      const parts = s.split(".");
      if (parts.length > 1 && parts[parts.length - 1].length === 3 && !isScore) s = s.replace(/\./g, "");
      s = s.replace(/,/g, "");
    }
    return parseFloat(s) || 0;
  };

  const extractValue = (row, key) => {
    const keys = Object.keys(row);
    const map = {
      sdr: ["negócio - sdr", "sdr", "sdr responsável", "negocio - sdr"],
      proprietario: ["negócio - proprietário", "proprietário", "closer", "negocio - proprietario"],
      valor: ["negócio - valor do negócio", "valor do negócio", "valor", "negocio - valor"],
      soma: ["soma total", "score", "soma"],
      nome: ["organização - nome", "nome", "titulo"],
    };
    const targets = map[key.toLowerCase()] || [key.toLowerCase()];
    for (let sk of targets) {
      const found = keys.find((k) =>
        k
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .includes(sk.toLowerCase().replace(/[^a-z0-9]/g, ""))
      );
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

  const handleFileUpload = (e, type) => {
    if (!isLibraryLoaded || !window.XLSX) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = window.XLSX.read(data, { type: "array" });
      const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      if (type === "VENDAS") setVendasRaw(rows);
      if (type === "REUNIOES") setReunioesRaw(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  // --- STORE ---
  const dataStore = useMemo(() => {
    const calculatedRevenue = vendasRaw.reduce((acc, v) => acc + parseNum(extractValue(v, "valor")), 0);
    const faturamentoTimeReal = goals.timeRealManual !== "" ? parseNum(goals.timeRealManual) : calculatedRevenue;
    const atingimentoTime = (faturamentoTimeReal / goals.timeMeta) * 100;

    const sdrsSet = new Set();
    reunioesRaw.forEach((r) => sdrsSet.add(extractValue(r, "sdr")));
    vendasRaw.forEach((v) => sdrsSet.add(extractValue(v, "sdr")));

    const closers = [...new Set(vendasRaw.map((v) => extractValue(v, "proprietario")))].filter(Boolean).sort();

    return {
      faturamentoTimeReal,
      atingimentoTime,
      people: { sdrs: [...sdrsSet].filter(Boolean).sort(), closers },
      totalMeetings: reunioesRaw.length,
      totalDeals: vendasRaw.length,
    };
  }, [vendasRaw, reunioesRaw, goals.timeRealManual, goals.timeMeta]);

  // --- ACTIONS ---
  const removeClosed = (id) =>
    setGoals((prev) => ({ ...prev, closedVariables: prev.closedVariables.filter((v) => v.id !== id) }));

  const closeVariable = (name, role, value) => {
    setGoals((prev) => ({
      ...prev,
      closedVariables: [
        ...prev.closedVariables,
        { id: Date.now(), name, role, value, date: new Date().toLocaleDateString() },
      ],
    }));
    setActiveTab("FECHAMENTO");
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

  const getTierValue = (list, val, field = "min") => {
    const sorted = [...list].sort((a, b) => b[field] - a[field]);
    return sorted.find((item) => val >= item[field]);
  };

  // --- CALC SDR ---
  const calculateSDR = (name) => {
    const myReunioes = reunioesRaw.filter((r) => isSamePerson(extractValue(r, "sdr"), name));
    const myVendasRaw = vendasRaw.filter((v) => isSamePerson(extractValue(v, "sdr"), name));

    const metaIndiv = goals.individualSdrGoals[name] || goals.sdrMetaDefault;
    const atingimentoMeta = (myReunioes.length / metaIndiv) * 100;

    const v1 = getTierValue(rules.sdr.t1MetaReunioes, atingimentoMeta, "perc")?.val || 0;

    const universal = getTierValue(rules.bonusUniversal, dataStore.atingimentoTime, "min")?.val || 0;
    const v2 = universal * (Math.min(atingimentoMeta, 100) / 100);

    const meetingsDetails = myReunioes.map((r) => ({
      name: extractValue(r, "nome") || "Lead",
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

    const extras =
      goals.individualExtras[name] || [
        { label: "Bônus 1", val: 0 },
        { label: "Bônus 2", val: 0 },
        { label: "Bônus 3", val: 0 },
      ];
    const vExtra = extras.reduce((a, b) => a + b.val, 0);

    return {
      v1,
      v2,
      v3,
      v4,
      total: v1 + v2 + v3 + v4 + vExtra,
      atingimentoMeta,
      metaIndiv,
      meetingsDetails,
      salesDetails,
      extras,
    };
  };

  // --- CALC CLOSER ---
  const calculateCloser = (name) => {
    const myVendasRaw = vendasRaw.filter((v) => isSamePerson(extractValue(v, "proprietario"), name));
    const fatIndiv = myVendasRaw.reduce((acc, v) => acc + parseNum(extractValue(v, "valor")), 0);

    const metaIndiv = goals.individualCloserGoals[name] || goals.closerMetaBase;
    const atingimentoIndiv = (fatIndiv / metaIndiv) * 100;

    let key =
      dataStore.atingimentoTime >= 120 ? "supermeta" : dataStore.atingimentoTime >= 100 ? "meta" : "abaixo";

    const levels = rules.closer.matriz[key].levels;
    const threshold =
      Object.keys(levels)
        .map(Number)
        .sort((a, b) => b - a)
        .find((l) => atingimentoIndiv >= l) || 0;

    const perc = levels[threshold];
    const v1 = fatIndiv * perc;

    const v2 = getTierValue(rules.bonusUniversal, dataStore.atingimentoTime, "min")?.val || 0;

    const extras =
      goals.individualExtras[name] || [
        { label: "Bônus 1", val: 0 },
        { label: "Bônus 2", val: 0 },
        { label: "Bônus 3", val: 0 },
      ];
    const vExtra = extras.reduce((a, b) => a + b.val, 0);

    return {
      v1,
      v2,
      total: v1 + v2 + vExtra,
      fatIndiv,
      metaIndiv,
      perc,
      atingimentoIndiv,
      extras,
      myVendas: myVendasRaw.map((v) => ({ name: extractValue(v, "nome"), value: parseNum(extractValue(v, "valor")) })),
    };
  };

  // --- CALC GESTOR / PRODUTO ---
  const calculateManagement = (role) => {
    const cfg = rules[role];

    const atingimentoFat = dataStore.atingimentoTime;
    const atingimentoVol = (dataStore.totalMeetings / goals.meetingsMetaTotal) * 100;

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

    const extras =
      goals.individualExtras[name] || [
        { label: "Bônus 1", val: 0 },
        { label: "Bônus 2", val: 0 },
        { label: "Bônus 3", val: 0 },
      ];
    const vExtra = extras.reduce((a, b) => a + b.val, 0);

    return { v1, v2, v3, v4, v5, total: v1 + v2 + v3 + v4 + v5 + vExtra, totalQualifPaga, extras };
  };

  // --- CALC LDR ---
  const calculateLDR = () => {
    const stats = goals.ldrStats;

    const atingimentoReunioes = (dataStore.totalMeetings / goals.meetingsMetaTotal) * 100;
    const atingimentoFaturamento = dataStore.atingimentoTime;

    const atingimentoGarimpados = stats.garimpadosMeta > 0 ? (stats.garimpados / stats.garimpadosMeta) * 100 : 0;
    const atingimentoCards = stats.cardsMeta > 0 ? (stats.cards / stats.cardsMeta) * 100 : 0;

    const v1 = getTierValue(rules.ldr.bonusReunioes, atingimentoReunioes, "min")?.val || 0;
    const v2 = getTierValue(rules.ldr.bonusGarimpados, atingimentoGarimpados, "min")?.val || 0;
    const v3 = getTierValue(rules.ldr.bonusCards, atingimentoCards, "min")?.val || 0;
    const v4 = getTierValue(rules.bonusUniversal, atingimentoFaturamento, "min")?.val || 0;

    const name = goals.customNames.ldr;

    const extras =
      goals.individualExtras[name] || [
        { label: "Bônus 1", val: 0 },
        { label: "Bônus 2", val: 0 },
        { label: "Bônus 3", val: 0 },
      ];
    const vExtra = extras.reduce((a, b) => a + b.val, 0);

    return {
      v1,
      v2,
      v3,
      v4,
      total: v1 + v2 + v3 + v4 + vExtra,
      extras,
      atingimentoGarimpados,
      atingimentoCards,
      atingimentoReunioes,
      atingimentoFaturamento,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#021017] to-[#05202B] font-sans text-white pb-12 selection:bg-[#00D4C5]/30">
      <nav className="bg-[#0A2230]/80 backdrop-blur-xl border-b border-[#00D4C5]/10 px-8 py-5 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-[#00D4C5] p-3 rounded-2xl text-[#021017] shadow-[0_0_20px_rgba(0,212,197,0.4)]">
              <Calculator size={24} />
            </div>
            <div>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="text-xl font-black tracking-tight bg-transparent border-none p-0 focus:ring-0 w-full outline-none"
              />
              <p className="text-[10px] text-[#00D4C5] font-black uppercase tracking-[0.3em] mt-1">
                Variável Comercial Branddi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl overflow-x-auto max-w-full">
            {["DASHBOARD", "SDR", "CLOSER", "GESTOR", "PRODUCT", "LDR", "FECHAMENTO", "REGRAS"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedPerson("");
                }}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black tracking-wider transition-all uppercase ${
                  activeTab === tab ? "bg-[#00D4C5] text-[#021017]" : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* DASHBOARD */}
        {activeTab === "DASHBOARD" && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-[#0A2230] p-8 rounded-[2.5rem] border border-[#00D4C5]/10 shadow-xl">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Performance Global</h2>
                <p className="text-sm text-slate-400 font-medium">Equipe Comercial de {reportTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Atingimento do mês</p>
                <p className="text-2xl font-black text-[#00D4C5]">{dataStore.atingimentoTime.toFixed(1)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard
                label="Faturamento Equipe"
                value={formatCurrency(dataStore.faturamentoTimeReal)}
                sub={`${dataStore.atingimentoTime.toFixed(1)}% da meta batida`}
                icon={<DollarSign size={20} />}
              />
              <StatCard
                label="Total Reuniões"
                value={dataStore.totalMeetings}
                sub={`${((dataStore.totalMeetings / goals.meetingsMetaTotal) * 100).toFixed(1)}% do esperado`}
                icon={<Activity size={20} />}
              />
              <StatCard
                label="Total Deals"
                value={dataStore.totalDeals}
                sub={`${((dataStore.totalDeals / goals.dealsMetaTotal) * 100).toFixed(1)}% de conversão`}
                icon={<Award size={20} />}
              />
            </div>

            <div className="bg-[#0B132B] p-10 rounded-[3rem] border border-white/5 shadow-2xl max-w-5xl mx-auto">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3 border-b border-white/5 pb-6">
                <Sliders size={20} className="text-[#00C9C8]" /> Ajustes Globais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10 font-black">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta Fat. (R$)</label>
                  <input
                    type="number"
                    value={goals.timeMeta}
                    onChange={(e) => setGoals({ ...goals, timeMeta: parseNum(e.target.value) })}
                    className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 font-black text-[#00D4C5] outline-none ring-1 ring-white/10 focus:ring-[#00D4C5]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fat. Real Manual</label>
                  <input
                    type="text"
                    placeholder="149400"
                    value={goals.timeRealManual}
                    onChange={(e) => setGoals({ ...goals, timeRealManual: e.target.value })}
                    className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 font-black text-white outline-none ring-1 ring-white/10"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta Reuniões</label>
                  <input
                    type="number"
                    value={goals.meetingsMetaTotal}
                    onChange={(e) => setGoals({ ...goals, meetingsMetaTotal: parseNum(e.target.value) })}
                    className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 font-black text-cyan-400 ring-1 ring-white/10"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta Vendas</label>
                  <input
                    type="number"
                    value={goals.dealsMetaTotal}
                    onChange={(e) => setGoals({ ...goals, dealsMetaTotal: parseNum(e.target.value) })}
                    className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 font-black text-emerald-400 ring-1 ring-white/10"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Eficiência %</label>
                  <input
                    type="number"
                    value={goals.teamEfficiencyManual}
                    onChange={(e) => setGoals({ ...goals, teamEfficiencyManual: parseNum(e.target.value) })}
                    className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 font-black text-indigo-400 ring-1 ring-white/10"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 border-t border-white/5 pt-10">
                <label
                  className={`flex-1 flex items-center justify-center gap-3 bg-white/5 text-white p-5 rounded-2xl font-black text-[11px] uppercase tracking-widest cursor-pointer transition-all border border-white/5 active:scale-95 ${
                    isLibraryLoaded ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  <Upload size={18} className="text-[#00C9C8]" />
                  <span>Importar Vendas</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.csv"
                    disabled={!isLibraryLoaded}
                    onChange={(e) => handleFileUpload(e, "VENDAS")}
                  />
                </label>

                <label
                  className={`flex-1 flex items-center justify-center gap-3 bg-white/5 text-white p-5 rounded-2xl font-black text-[11px] uppercase tracking-widest cursor-pointer transition-all border border-white/5 active:scale-95 ${
                    isLibraryLoaded ? "hover:bg-white/10" : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  <Upload size={18} className="text-[#00C9C8]" />
                  <span>Importar Reuniões</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.csv"
                    disabled={!isLibraryLoaded}
                    onChange={(e) => handleFileUpload(e, "REUNIOES")}
                  />
                </label>
              </div>

              {!isLibraryLoaded && (
                <p className="mt-6 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Carregando biblioteca XLSX...
                </p>
              )}
            </div>
          </div>
        )}

        {/* SDR */}
        {activeTab === "SDR" && (
          <div className="space-y-10 animate-in fade-in">
            <div className="max-w-md mx-auto">
              <div className="bg-[#0B132B] p-6 rounded-3xl border border-white/5 flex items-center gap-4 shadow-xl">
                <Search className="text-slate-500" size={20} />
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="flex-1 bg-transparent font-black text-white focus:outline-none text-sm"
                >
                  <option value="" className="bg-[#0B132B]">
                    Escolher Colaborador...
                  </option>
                  {dataStore.people.sdrs.map((p) => (
                    <option key={p} value={p} className="bg-[#0B132B]">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPerson &&
              (() => {
                const res = calculateSDR(selectedPerson);
                const name = goals.customNames[selectedPerson] || selectedPerson;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-8">
                      <div className="bg-[#0B132B] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10 border border-[#00D4C5]/20">
                        <p className="text-[#00C9C8] font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                          Demonstrativo SDR
                        </p>

                        <div className="flex items-center gap-2 mb-10 group">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) =>
                              setGoals({
                                ...goals,
                                customNames: { ...goals.customNames, [selectedPerson]: e.target.value },
                              })
                            }
                            className="text-3xl font-black bg-transparent border-none p-0 focus:ring-0 text-white w-full tracking-tight"
                          />
                          <Edit2 size={16} className="text-white/20 group-hover:text-[#00C9C8] transition-colors" />
                        </div>

                        <div className="space-y-6">
                          <SummaryItem label="Variável Bruto Total" value={res.total} highlight />
                          <SummaryItem label="1. Bônus Meta Reuniões" value={res.v1} />
                          <SummaryItem label="2. Bônus Equipe" value={res.v2} />
                          <SummaryItem label="3. Qualificação (Score)" value={res.v3} />
                          <SummaryItem label="4. Vendas Iniciadas" value={res.v4} />

                          <div className="pt-6 border-t border-white/5">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">
                              Bônus Extras (Manual)
                            </p>
                            {res.extras.map((ex, i) => (
                              <div key={i} className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  value={ex.label}
                                  onChange={(e) => updateExtraValue(selectedPerson, i, "label", e.target.value)}
                                  className="w-full bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black text-white"
                                />
                                <input
                                  type="number"
                                  value={ex.val || ""}
                                  onChange={(e) => updateExtraValue(selectedPerson, i, "val", e.target.value)}
                                  className="w-24 bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black text-[#00D4C5] text-right"
                                />
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => closeVariable(name, "SDR", res.total)}
                            className="w-full mt-10 bg-[#00D4C5] text-[#010B1D] font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-cyan-500/20 uppercase tracking-widest text-[11px]"
                          >
                            <Lock size={18} /> Fechar Variável
                          </button>
                        </div>

                        <div className="mt-10 pt-10 border-t border-white/5 space-y-4">
                          <div className="flex justify-between text-[11px] uppercase text-slate-400">
                            <span>Atingimento Reuniões</span>
                            <span className="text-[#00C9C8] font-black">{res.atingimentoMeta.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#00C9C8] transition-all duration-1000 shadow-[0_0_10px_#00C9C8]"
                              style={{ width: `${Math.min(res.atingimentoMeta, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                      <section className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-sm">
                        <h3 className="p-7 font-black text-xs uppercase tracking-widest bg-white/5 border-b border-white/5 flex items-center gap-3">
                          <Star size={18} className="text-amber-500" /> Reuniões Auditadas
                        </h3>

                        <table className="w-full text-left text-sm font-semibold">
                          <thead className="bg-[#0A2230] border-b border-white/5 font-black text-slate-500 uppercase text-[10px]">
                            <tr>
                              <th className="px-8 py-5">Lead / Empresa</th>
                              <th className="px-8 py-5 text-center">Score</th>
                              <th className="px-8 py-5 text-right">Bônus</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-medium">
                            {res.meetingsDetails.map((r, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-8 py-5 text-white font-bold">{r.name}</td>
                                <td className="px-8 py-5 text-center font-black text-[#00D4C5]">
                                  {r.score.toFixed(2)}
                                </td>
                                <td className="px-8 py-5 text-right font-black text-white/50">
                                  {formatCurrency(r.bonus)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </section>

                      <section className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-sm">
                        <h3 className="p-7 font-black text-xs uppercase tracking-widest bg-emerald-500/5 text-emerald-400 border-b border-white/5 flex items-center gap-3">
                          <TrendingUp size={18} /> Vendas Iniciadas (T4)
                        </h3>

                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#0A2230] border-b border-white/5 font-black text-slate-500 uppercase text-[10px]">
                            <tr>
                              <th className="px-8 py-5">Negócio</th>
                              <th className="px-8 py-5 text-center">Valor Bruto</th>
                              <th className="px-8 py-5 text-right text-emerald-400">Bônus</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-medium">
                            {res.salesDetails.map((s, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-8 py-5 text-white font-bold">{s.name}</td>
                                <td className="px-8 py-5 text-center text-white/50 font-bold">
                                  {formatCurrency(s.revenue)}
                                </td>
                                <td className="px-8 py-5 text-right text-emerald-400 font-black">
                                  {formatCurrency(s.bonus)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </section>
                    </div>
                  </div>
                );
              })()}
          </div>
        )}

        {/* CLOSER */}
        {activeTab === "CLOSER" && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="max-w-md mx-auto">
              <div className="bg-[#0A2230] p-6 rounded-3xl border border-white/5 flex items-center gap-4 shadow-xl shadow-[#00C9C8]/5">
                <Search className="text-slate-500" size={20} />
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="flex-1 bg-transparent font-black text-white focus:outline-none text-sm"
                >
                  <option value="" className="bg-[#0A2230]">
                    Selecionar Closer...
                  </option>
                  {dataStore.people.closers.map((p) => (
                    <option key={p} value={p} className="bg-[#0A2230]">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPerson &&
              (() => {
                const res = calculateCloser(selectedPerson);
                const name = goals.customNames[selectedPerson] || selectedPerson;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-[#0A2230] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10 border border-[#00D4C5]/20">
                      <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                        Demonstrativo Closer
                      </p>

                      <div className="flex items-center gap-2 mb-10 group">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) =>
                            setGoals({
                              ...goals,
                              customNames: { ...goals.customNames, [selectedPerson]: e.target.value },
                            })
                          }
                          className="text-3xl font-black bg-transparent border-none p-0 focus:ring-0 text-white w-full tracking-tight"
                        />
                        <Edit2
                          size={16}
                          className="text-white/20 group-hover:text-indigo-400 transition-colors cursor-pointer"
                        />
                      </div>

                      <div className="space-y-6">
                        <SummaryItem label="Variável Total" value={res.total} highlight />
                        <SummaryItem label="Comissão Individual" value={res.v1} />
                        <SummaryItem label="Bônus Time Global" value={res.v2} />

                        <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
                          <div>
                            <p className="text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-widest">
                              Realizado Individual
                            </p>
                            <p className="text-2xl font-black">{formatCurrency(res.fatIndiv)}</p>
                          </div>

                          <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-[10px] text-slate-500 font-black uppercase flex items-center gap-2">
                              <Target size={12} /> Meta Individual
                            </span>
                            <input
                              type="number"
                              value={goals.individualCloserGoals[selectedPerson] || goals.closerMetaBase}
                              onChange={(e) =>
                                setGoals({
                                  ...goals,
                                  individualCloserGoals: {
                                    ...goals.individualCloserGoals,
                                    [selectedPerson]: parseNum(e.target.value),
                                  },
                                })
                              }
                              className="w-24 bg-white/5 text-white text-right font-black border-none rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 ring-[#00D4C5]"
                            />
                          </div>

                          <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">
                            Percentual Aplicado: {(res.perc * 100).toFixed(1)}%
                          </p>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                          <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">
                            Bônus Extras (Manual)
                          </p>
                          {res.extras.map((ex, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={ex.label}
                                onChange={(e) => updateExtraValue(selectedPerson, i, "label", e.target.value)}
                                className="w-full bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black text-white"
                              />
                              <input
                                type="number"
                                value={ex.val || ""}
                                onChange={(e) => updateExtraValue(selectedPerson, i, "val", e.target.value)}
                                className="w-24 bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black text-[#00D4C5] text-right"
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => closeVariable(name, "Closer", res.total)}
                          className="w-full mt-10 bg-[#00C9C8] text-[#010B1D] font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-cyan-500/20 uppercase tracking-widest text-[11px]"
                        >
                          <Lock size={18} /> Fechar Variável
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm font-semibold">
                          <thead className="bg-[#0A2230] border-b border-white/5 font-black text-slate-500 uppercase text-[10px]">
                            <tr>
                              <th className="px-8 py-5">Negócio Ganho</th>
                              <th className="px-8 py-5 text-right">Valor Bruto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-medium">
                            {res.myVendas.map((v, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-8 py-5 text-white">{v.name}</td>
                                <td className="px-8 py-5 text-right font-black text-[#00C9C8]">
                                  {formatCurrency(v.value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        )}

        {/* GESTOR E PRODUCT */}
        {(activeTab === "GESTOR" || activeTab === "PRODUCT") && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {(() => {
              const role = activeTab === "GESTOR" ? "gestor" : "produto";
              const res = calculateManagement(role);
              const name = goals.customNames[role];

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0A2230] text-white p-10 rounded-[3rem] shadow-2xl border border-white/10 relative overflow-hidden">
                      <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                        Demonstrativo Gestão
                      </p>

                      <div className="flex items-center gap-2 mb-10 group">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) =>
                            setGoals({ ...goals, customNames: { ...goals.customNames, [role]: e.target.value } })
                          }
                          className="text-3xl font-black bg-transparent border-none p-0 focus:ring-0 text-white w-full tracking-tight"
                        />
                        <Edit2 size={16} className="text-white/20 group-hover:text-[#00D4C5]" />
                      </div>

                      <div className="space-y-4">
                        <SummaryItem label="Variável Total" value={res.total} highlight />
                        <SummaryItem label="1. Bônus Fatur. Equipe" value={res.v1} />
                        <SummaryItem label="2. Bônus Volume Reuniões" value={res.v2} />
                        <SummaryItem label="3. Bônus Eficiência Equipe" value={res.v3} />
                        <SummaryItem label="4. Comissão Faturamento" value={res.v4} />
                        <SummaryItem label="5. Override Qualificação" value={res.v5} />

                        <div className="pt-6 border-t border-white/5">
                          <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">
                            Bônus Extras (Manual)
                          </p>
                          {res.extras.map((ex, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={ex.label}
                                onChange={(e) => updateExtraValue(name, i, "label", e.target.value)}
                                className="w-full bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black text-white"
                              />
                              <input
                                type="number"
                                value={ex.val || ""}
                                onChange={(e) => updateExtraValue(name, i, "val", e.target.value)}
                                className="w-24 bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black text-[#00D4C5] text-right"
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => closeVariable(name, activeTab, res.total)}
                          className="w-full mt-10 bg-[#00D4C5] text-[#010B1D] font-black py-5 rounded-[1.5rem] active:scale-95 shadow-xl uppercase tracking-widest text-[11px]"
                        >
                          <Lock size={18} /> Fechar Variável
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 bg-white/5 p-10 rounded-[3rem] border border-white/5">
                    <h3 className="font-black text-xs uppercase tracking-widest mb-6 text-[#00D4C5] border-b border-white/5 pb-4">
                      Base Qualificação Paga: {formatCurrency(res.totalQualifPaga)}
                    </h3>
                    <p className="text-sm text-slate-400">
                      O colaborador recebe um percentual sobre o total pago em bônus de qualificação (score) para todo o
                      time comercial.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* LDR */}
        {activeTab === "LDR" && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {(() => {
              const res = calculateLDR();
              const name = goals.customNames.ldr;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0A2230] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10 border border-[#00D4C5]/20">
                      <p className="text-amber-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                        Demonstrativo LDR
                      </p>

                      <div className="flex items-center gap-2 mb-10 group">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) =>
                            setGoals({ ...goals, customNames: { ...goals.customNames, ldr: e.target.value } })
                          }
                          className="text-3xl font-black bg-transparent border-none p-0 focus:ring-0 text-white w-full tracking-tight"
                        />
                        <Edit2 size={16} className="text-white/20 group-hover:text-amber-400" />
                      </div>

                      <div className="space-y-6">
                        <SummaryItem label="Variável Total LDR" value={res.total} highlight />
                        <SummaryItem label="1. Meta Reuniões" value={res.v1} />
                        <SummaryItem label="2. Bônus Contatos" value={res.v2} />
                        <SummaryItem label="3. Cards Qualificados" value={res.v3} />
                        <SummaryItem label="4. Bônus Equipe" value={res.v4} />

                        <div className="pt-6 border-t border-white/5">
                          <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">
                            Bônus Extras (Manual)
                          </p>
                          {res.extras.map((ex, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={ex.label}
                                onChange={(e) => updateExtraValue(name, i, "label", e.target.value)}
                                className="w-full bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black text-white"
                              />
                              <input
                                type="number"
                                value={ex.val || ""}
                                onChange={(e) => updateExtraValue(name, i, "val", e.target.value)}
                                className="w-24 bg-white/5 border-none rounded-xl px-4 py-2 text-[10px] font-black text-[#00D4C5] text-right"
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => closeVariable(name, "LDR", res.total)}
                          className="w-full mt-10 bg-[#00D4C5] text-[#010B1D] font-black py-5 rounded-[1.5rem] active:scale-95 shadow-xl uppercase tracking-widest text-[11px]"
                        >
                          <Lock size={18} /> Fechar Variável
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                      <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-10 flex items-center gap-3 text-[#00D4C5] border-b border-white/5 pb-6">
                        <UserCheck size={20} /> Gestão de Dados LDR
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase mb-4 tracking-widest">
                              Contatos Garimpados
                            </label>
                            <div className="flex gap-4">
                              <input
                                type="number"
                                placeholder="Real"
                                value={goals.ldrStats.garimpados}
                                onChange={(e) =>
                                  setGoals({
                                    ...goals,
                                    ldrStats: { ...goals.ldrStats, garimpados: parseNum(e.target.value) },
                                  })
                                }
                                className="w-full bg-white/5 border-none rounded-2xl px-6 py-4 font-black text-[#00C9C8] ring-1 ring-white/10 outline-none"
                              />
                              <input
                                type="number"
                                placeholder="Meta"
                                value={goals.ldrStats.garimpadosMeta}
                                onChange={(e) =>
                                  setGoals({
                                    ...goals,
                                    ldrStats: { ...goals.ldrStats, garimpadosMeta: parseNum(e.target.value) },
                                  })
                                }
                                className="w-full bg-white/5 border-none rounded-2xl px-6 py-4 font-black text-slate-500 ring-1 ring-white/10 outline-none"
                              />
                            </div>
                          </div>

                          <div className="p-6 bg-white/5 rounded-2xl flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase text-slate-400">Atingimento</span>
                            <span className="text-2xl font-black text-cyan-400">{res.atingimentoGarimpados.toFixed(1)}%</span>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase mb-4 tracking-widest">
                              Cards Qualificados
                            </label>
                            <div className="flex gap-4">
                              <input
                                type="number"
                                placeholder="Real"
                                value={goals.ldrStats.cards}
                                onChange={(e) =>
                                  setGoals({
                                    ...goals,
                                    ldrStats: { ...goals.ldrStats, cards: parseNum(e.target.value) },
                                  })
                                }
                                className="w-full bg-white/5 border-none rounded-2xl px-6 py-4 font-black text-[#00C9C8] ring-1 ring-white/10 outline-none"
                              />
                              <input
                                type="number"
                                placeholder="Meta"
                                value={goals.ldrStats.cardsMeta}
                                onChange={(e) =>
                                  setGoals({
                                    ...goals,
                                    ldrStats: { ...goals.ldrStats, cardsMeta: parseNum(e.target.value) },
                                  })
                                }
                                className="w-full bg-white/5 border-none rounded-2xl px-6 py-4 font-black text-slate-500 ring-1 ring-white/10 outline-none"
                              />
                            </div>
                          </div>

                          <div className="p-6 bg-white/5 rounded-2xl flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase text-slate-400">Atingimento</span>
                            <span className="text-2xl font-black text-indigo-400">{res.atingimentoCards.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* FECHAMENTO */}
        {activeTab === "FECHAMENTO" && (
          <div className="space-y-10 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-3 bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-4">
                    <ClipboardList size={24} className="text-[#00C9C8]" /> Resumo do Fechamento: {reportTitle}
                  </h3>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Total Variável Acumulado
                    </p>
                    <p className="text-4xl font-black text-[#00C9C8] tracking-tighter shadow-cyan-500/10">
                      {formatCurrency(goals.closedVariables.reduce((acc, v) => acc + v.value, 0))}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm font-semibold">
                    <thead className="bg-[#0B132B] font-black text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-8 py-5">Colaborador</th>
                        <th className="px-8 py-5">Área / Cargo</th>
                        <th className="px-8 py-5 text-right">Variável</th>
                        <th className="px-8 py-5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {goals.closedVariables.map((v) => (
                        <tr key={v.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-5 text-white font-bold">{v.name}</td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {v.role}
                          </td>
                          <td className="px-8 py-5 text-right font-black text-emerald-400">
                            {formatCurrency(v.value)}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <button
                              onClick={() => removeClosed(v.id)}
                              className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {goals.closedVariables.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-24 text-center text-slate-500 font-black italic tracking-widest text-[10px]">
                            Aguardando fechamento de variáveis para consolidar...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-[#0B132B] text-white p-10 rounded-[3rem] shadow-2xl text-center ring-1 ring-white/10">
                  <Award
                    className="mx-auto text-[#00C9C8] mb-6 drop-shadow-[0_0_10px_rgba(0,212,197,0.5)]"
                    size={48}
                  />
                  <h4 className="text-[11px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em]">
                    Status do Mês
                  </h4>
                  <p className="text-2xl font-black tracking-tight mb-8">Consolidar Período</p>

                  <button className="w-full bg-[#00C9C8] py-5 rounded-2xl font-black text-[#010B1D] text-sm hover:bg-cyan-400 transition-all shadow-xl uppercase tracking-widest flex items-center justify-center gap-3">
                    <Download size={20} /> Exportar Relatório
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REGRAS */}
        {activeTab === "REGRAS" && (
          <div className="space-y-10 animate-in fade-in pb-12 overflow-y-auto max-h-[85vh]">
            <div className="bg-[#0B132B] text-white p-10 rounded-[3rem] shadow-xl flex items-center gap-8 ring-1 ring-white/10">
              <div className="bg-[#00C9C8] p-5 rounded-3xl shadow-2xl text-[#010B1D]">
                <Settings2 size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">Configurações Branddi</h2>
                <p className="text-[#00D4C5] text-sm font-medium tracking-wide uppercase">
                  Configuração financeira e triggers operacionais.
                </p>
              </div>
            </div>

            <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#00C9C8] border-l-8 border-[#00C9C8] pl-6">
                Ajuste de Equipe (Universal)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {rules.bonusUniversal.map((b, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-4 p-6 bg-[#0B132B] rounded-3xl border border-white/5 shadow-inner"
                  >
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      Se Equipe atingir ≥ {b.min}%
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-500 text-sm">R$</span>
                      <input
                        type="number"
                        value={b.val}
                        onChange={(e) => {
                          const nr = { ...rules };
                          nr.bonusUniversal[i].val = parseNum(e.target.value);
                          setRules(nr);
                        }}
                        className="w-full bg-white/5 border-none rounded-xl px-4 py-3 font-black text-[#00C9C8] shadow-sm focus:ring-1 ring-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
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
                    const nr = { ...rules };
                    nr.sdr.t1MetaReunioes[idx][field] = parseNum(val);
                    setRules(nr);
                  }}
                  labelKey="perc"
                  labelSuffix="%"
                />
                <RuleColumn
                  title="T3: Qualificação (Score)"
                  items={rules.sdr.t3Qualificacao}
                  onChange={(idx, field, val) => {
                    const nr = { ...rules };
                    nr.sdr.t3Qualificacao[idx][field] = parseNum(val);
                    setRules(nr);
                  }}
                  labelKey="min"
                  labelSuffix=" pts"
                />
                <RuleColumn
                  title="T4: Bônus Venda (R$)"
                  items={rules.sdr.t4VendasIniciadas}
                  onChange={(idx, field, val) => {
                    const nr = { ...rules };
                    nr.sdr.t4VendasIniciadas[idx][field] = parseNum(val);
                    setRules(nr);
                  }}
                  labelKey="min"
                  labelPrefix="R$ "
                />
              </div>
            </section>

            <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm space-y-10">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 border-l-8 border-indigo-400 pl-6">
                Matriz Closer
              </h3>

              <div className="space-y-6">
                {Object.entries(rules.closer.matriz).map(([scenario, data]) => (
                  <div key={scenario} className="p-6 bg-[#0B132B] rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">
                      Cenário: {scenario}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(data.levels).map(([lvl, perc]) => (
                        <div key={lvl} className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-500 tracking-tighter">
                            Indiv. ≥ {lvl}%
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={perc * 100}
                              onChange={(e) => {
                                const nr = { ...rules };
                                nr.closer.matriz[scenario].levels[lvl] = parseNum(e.target.value) / 100;
                                setRules(nr);
                              }}
                              className="w-full bg-white/5 border-none rounded-xl px-4 py-2 font-black text-[#00C9C8] outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-500">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-400 border-l-8 border-amber-400 pl-6 mb-8">
                  Gestão
                </h3>

                <RuleColumn
                  title="Bônus Fat. Time"
                  items={rules.gestor.bonusFaturamento}
                  onChange={(idx, field, val) => {
                    const nr = { ...rules };
                    nr.gestor.bonusFaturamento[idx][field] = parseNum(val);
                    setRules(nr);
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
              </section>

              <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-violet-400 border-l-8 border-violet-400 pl-6 mb-8">
                  Produto
                </h3>

                <RuleColumn
                  title="Bônus Fat. Time"
                  items={rules.produto.bonusFaturamento}
                  onChange={(idx, field, val) => {
                    const nr = { ...rules };
                    nr.produto.bonusFaturamento[idx][field] = parseNum(val);
                    setRules(nr);
                  }}
                  labelKey="min"
                  labelSuffix="%"
                />
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
