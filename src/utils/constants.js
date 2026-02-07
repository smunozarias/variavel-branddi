export const initialRules = {
    bonusUniversal: [{ min: 120, val: 750 }, { min: 100, val: 500 }, { min: 80, val: 350 }],
    sdr: {
        t1MetaReunioes: [{ perc: 200, val: 1200 }, { perc: 150, val: 750 }, { perc: 100, val: 600 }, { perc: 80, val: 350 }],
        t3Qualificacao: [{ min: 16, val: 200 }, { min: 14, val: 100 }, { min: 12, val: 50 }, { min: 0, val: 25 }],
        t4VendasIniciadas: [{ min: 10900, val: 300 }, { min: 7900, val: 200 }, { min: 0, val: 100 }],
    },
    closer: {
        matriz: {
            supermeta: { threshold: 120, levels: { 120: 0.12, 100: 0.09, 80: 0.07, 0: 0.05 } },
            meta: { threshold: 100, levels: { 120: 0.10, 100: 0.08, 80: 0.06, 0: 0.04 } },
            abaixo: { threshold: 0, levels: { 120: 0.09, 100: 0.07, 80: 0.05, 0: 0.03 } },
        },
    },
    gestor: {
        bonusFaturamento: [{ min: 120, val: 1125 }, { min: 100, val: 875 }, { min: 80, val: 625 }],
        bonusVolumeReunioes: [{ min: 120, val: 1125 }, { min: 100, val: 875 }, { min: 80, val: 625 }],
        bonusMetaEquipe: [{ min: 100, val: 2250 }, { min: 80, val: 1750 }],
        comissaoFatPerc: 0.01,
        overrideQualificacaoPerc: 0.2,
    },
    produto: {
        bonusFaturamento: [{ min: 120, val: 600 }, { min: 100, val: 450 }, { min: 80, val: 350 }],
        bonusVolumeReunioes: [{ min: 120, val: 600 }, { min: 100, val: 450 }, { min: 80, val: 350 }],
        bonusMetaEquipe: [{ min: 100, val: 1125 }, { min: 80, val: 900 }],
        comissaoFatPerc: 0.006,
        overrideQualificacaoPerc: 0.1,
    },
    ldr: {
        bonusReunioes: [{ min: 120, val: 250 }, { min: 100, val: 200 }, { min: 80, val: 150 }],
        bonusGarimpados: [{ min: 100, val: 400 }, { min: 80, val: 250 }, { min: 50, val: 150 }],
        bonusCards: [{ min: 100, val: 400 }, { min: 80, val: 250 }, { min: 50, val: 150 }],
    },
};

export const initialGoals = {
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
};
