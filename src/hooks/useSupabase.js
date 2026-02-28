import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from "xlsx";
import { initialRules, initialGoals } from '../utils/constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔧 Inicializando Supabase:");
console.log("URL completa:", supabaseUrl);
console.log("URL length:", supabaseUrl?.length);
console.log("Key length:", supabaseKey?.length);
console.log("URL:", supabaseUrl ? "✓ Configurada" : "❌ NÃO CONFIGURADA");
console.log("Key:", supabaseKey ? "✓ Configurada" : "❌ NÃO CONFIGURADA");

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO CRÍTICO: Variáveis de ambiente não carregadas!");
    console.error("import.meta.env:", import.meta.env);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✓ Cliente Supabase criado");

export function useSupabase(selectedMonth, selectedYear, reportTitle) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [savingManual, setSavingManual] = useState(false);
    const [historyDB, setHistoryDB] = useState({});

    const getFileName = (type) => `${type}_${selectedMonth}_${selectedYear}`;
    const getManualDataFileName = () => `DADOS_MANUAIS_${selectedMonth}_${selectedYear}.json`;
    const HISTORY_FILE_NAME = "HISTORY_DB.json";

    const processFile = async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
        return rows;
    };

    const saveData = async (rules, goals) => {
        setSavingManual(true);
        try {
            const dataToSave = { rules, goals };
            const blob = new Blob([JSON.stringify(dataToSave)], { type: "application/json" });
            const fileName = getManualDataFileName();
            const { error } = await supabase.storage.from('planilhas').upload(fileName, blob, { upsert: true });
            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Erro ao salvar dados manuais:", err);
            return false;
        } finally {
            setSavingManual(false);
        }
    };

    const consolidateHistory = async (goals, dataStore) => {
        if (goals.closedVariables.length === 0) {
            return { success: false, message: "Feche ao menos uma variável antes de consolidar o mês." };
        }

        setSavingManual(true);
        try {
            // Buscando histórico mais recente do Supabase para evitar sobrescrever com estado cacheado vazio
            let latestHistory = {};
            try {
                const { data } = await supabase.storage.from('planilhas').download(HISTORY_FILE_NAME);
                if (data) {
                    const textData = await data.text();
                    latestHistory = JSON.parse(textData);
                }
            } catch (err) {
                console.log("Aviso: Falha ao baixar o histórico atual antes da consolidação (pode ser o primeiro mês ou arquivo ausente).");
            }

            const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            const monthSummary = {
                title: reportTitle,
                teamStats: {
                    revenueGoal: goals.timeMeta,
                    revenueReal: dataStore.faturamentoTimeReal,
                    achievement: dataStore.atingimentoTime,
                    totalVariablePaid: goals.closedVariables.reduce((acc, v) => acc + v.value, 0)
                },
                individuals: goals.closedVariables.map(p => ({
                    name: p.name,
                    role: p.role,
                    target: p.target || 0,
                    realized: p.realized || 0,
                    achievement: p.achievement || 0,
                    variableReceived: p.value
                }))
            };

            // Fazer merge do histórico mais recente com o novo resumo do mês
            const newHistory = { ...latestHistory, [monthKey]: monthSummary };
            setHistoryDB(newHistory); // atualiza state local

            const blob = new Blob([JSON.stringify(newHistory)], { type: "application/json" });

            // Upload do arquivo principal
            const { error: uploadError } = await supabase.storage.from('planilhas').upload(HISTORY_FILE_NAME, blob, { upsert: true });
            if (uploadError) throw uploadError;

            // Fazer Backup Mensal automático do Histórico
            const backupFileName = `HISTORY_DB_BACKUP_${String(selectedMonth).padStart(2, '0')}_${selectedYear}.json`;
            await supabase.storage.from('planilhas').upload(backupFileName, blob, { upsert: true });

            return { success: true, message: `Histórico consolidado com sucesso para ${reportTitle} e backup gerado!` };
        } catch (err) {
            console.error("Erro ao consolidar histórico:", err);
            return { success: false, message: "Erro ao salvar histórico no Supabase." };
        } finally {
            setSavingManual(false);
        }
    };

    const fetchData = async (setVendasRaw, setReunioesRaw, setRules, setGoals) => {
        setLoading(true);
        setVendasRaw([]);
        setReunioesRaw([]);
        setRules(initialRules);
        setGoals(initialGoals);

        // Carregar Histórico
        try {
            const { data } = await supabase.storage.from('planilhas').download(HISTORY_FILE_NAME);
            if (data) {
                const textData = await data.text();
                setHistoryDB(JSON.parse(textData));
            }
        } catch (err) {
            console.log("Histórico novo ou erro ao carregar:", err);
        }

        // Carregar Dados do Mês
        try {
            const vendasName = getFileName("VENDAS");
            const reunioesName = getFileName("REUNIOES");
            const manualName = getManualDataFileName();

            const { data: vendasData } = await supabase.storage.from('planilhas').download(vendasName);
            if (vendasData) {
                const rows = await processFile(vendasData);
                setVendasRaw(rows);
            }

            const { data: reunioesData } = await supabase.storage.from('planilhas').download(reunioesName);
            if (reunioesData) {
                const rows = await processFile(reunioesData);
                setReunioesRaw(rows);
            }

            const { data: manualData } = await supabase.storage.from('planilhas').download(manualName);
            if (manualData) {
                const textData = await manualData.text();
                const jsonData = JSON.parse(textData);
                if (jsonData.rules) setRules(jsonData.rules);
                if (jsonData.goals) setGoals(jsonData.goals);
            }
        } catch (error) {
            console.log("Alguns dados não encontrados para este mês.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file, type) => {
        if (!file) {
            console.log("❌ Nenhum arquivo selecionado");
            return { success: false, error: 'Nenhum arquivo selecionado' };
        }

        // Validar tipo de arquivo
        const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
        console.log("📋 Tipo do arquivo:", file.type);
        console.log("✅ Tipos válidos:", validTypes);
        console.log("✓ Tipo válido?", validTypes.includes(file.type));

        if (!validTypes.includes(file.type)) {
            console.warn("⚠️ Formato inválido");
            return { success: false, error: 'Formato inválido. Use .xlsx, .xls ou .csv' };
        }

        setUploading(true);
        try {
            console.log("🔄 Processando arquivo...");
            const rows = await processFile(file);
            console.log("✓ Arquivo processado. Linhas:", rows.length);

            const fileName = getFileName(type);
            console.log("📤 Enviando para Supabase...");
            console.log("Nome do arquivo:", fileName);
            console.log("Bucket: planilhas");
            console.log("URL Supabase:", supabaseUrl);

            // Upload com tipo MIME correto
            const { error } = await supabase.storage
                .from('planilhas')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (error) {
                console.error("❌ Erro do Supabase:", error);
                throw error;
            }

            console.log("✅ Upload realizado com sucesso!");
            return { success: true, rows };
        } catch (err) {
            console.error("❌ Erro completo:", err);
            console.error("Mensagem:", err.message);
            console.error("Status:", err.status);
            return { success: false, error: err.message || 'Erro ao fazer upload' };
        } finally {
            setUploading(false);
        }
    };

    return {
        loading,
        uploading,
        savingManual,
        historyDB,
        saveData,
        consolidateHistory,
        fetchData,
        handleUpload
    };
}
