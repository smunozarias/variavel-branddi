import React from 'react';
import { Calculator, Loader2 } from "lucide-react";

const NavBar = ({ activeTab, setActiveTab, reportTitle, loading, setSelectedPerson }) => (
    <nav className="bg-gradient-to-r from-[#0A1628]/95 to-[#0F1F2E]/95 backdrop-blur-xl border-b border-[#00D4C5]/15 px-6 md:px-8 py-6 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo e Título */}
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="bg-[#00D4C5] p-3 rounded-xl text-[#021017] shadow-lg shadow-[#00D4C5]/30">
                    <Calculator size={24} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                            {reportTitle || "Relatório"}
                        </h1>
                        {loading && <Loader2 size={18} className="animate-spin text-[#00D4C5]" />}
                    </div>
                    <p className="text-[10px] md:text-xs text-[#00D4C5] font-bold uppercase tracking-[0.15em] mt-1">
                        Variável Comercial Branddi
                    </p>
                </div>
            </div>

            {/* Abas */}
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl overflow-x-auto flex-wrap justify-center md:justify-end">
                {["DASHBOARD", "SDR", "CLOSER", "GESTOR", "PRODUCT", "LDR", "FECHAMENTO", "HISTÓRICO", "REGRAS"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            if (tab !== "HISTÓRICO" && setSelectedPerson) setSelectedPerson("");
                        }}
                        className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold tracking-wide transition-all uppercase whitespace-nowrap ${
                            activeTab === tab 
                                ? "bg-[#00D4C5] text-[#021017] shadow-lg shadow-[#00D4C5]/30" 
                                : "text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
            </div>
        </div>
    </nav>
);

export default NavBar;
