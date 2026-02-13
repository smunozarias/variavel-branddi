import React from 'react';
import { Calculator, Loader2 } from "lucide-react";

const NavBar = ({ activeTab, setActiveTab, reportTitle, loading, setSelectedPerson }) => (
    <nav className="bg-[#0A2230]/80 backdrop-blur-xl border-b border-[#00D4C5]/10 px-8 py-5 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
                <div className="bg-[#00D4C5] p-3 rounded-2xl text-[#021017] shadow-[0_0_20px_rgba(0,212,197,0.4)]">
                    <Calculator size={24} />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={reportTitle}
                            readOnly
                            className="text-xl font-black tracking-tight bg-transparent border-none p-0 focus:ring-0 w-64 outline-none capitalize"
                        />
                        {loading && <Loader2 size={16} className="animate-spin text-[#00D4C5]" />}
                    </div>
                    <p className="text-[10px] text-[#00D4C5] font-black uppercase tracking-[0.3em] mt-1">
                        Variável Comercial Branddi
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl overflow-x-auto max-w-full">
                {["DASHBOARD", "SDR", "CLOSER", "GESTOR", "PRODUCT", "LDR", "FECHAMENTO", "HISTÓRICO", "REGRAS"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            if (tab !== "HISTÓRICO" && setSelectedPerson) setSelectedPerson("");
                        }}
                        className={`px-5 py-2.5 rounded-xl text-[11px] font-black tracking-wider transition-all uppercase ${activeTab === tab ? "bg-[#00D4C5] text-[#021017]" : "text-slate-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    </nav>
);

export default NavBar;
