import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from "xlsx";
import { initialRules, initialGoals } from '../utils/constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
            let currentHistory = { ...historyDB };
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

            currentHistory[monthKey] = monthSummary;
            setHistoryDB(currentHistory);

            const blob = new Blob([JSON.stringify(currentHistory)], { type: "application/json" });
            await supabase.storage.from('planilhas').upload(HISTORY_FILE_NAME, blob, { upsert: true });

            return { success: true, message: `Histórico consolidado com sucesso para ${reportTitle}!` };
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
        if (!file) return { success: false };

        setUploading(true);
        try {
            const rows = await processFile(file);
            const fileName = getFileName(type);
            const { error } = await supabase.storage.from('planilhas').upload(fileName, file, { upsert: true });
            if (error) throw error;
            return { success: true, rows };
        } catch (err) {
            console.error("Erro upload:", err);
            return { success: false, error: err };
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
