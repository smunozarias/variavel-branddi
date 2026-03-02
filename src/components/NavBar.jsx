import React from 'react';
import { Calculator, Loader2, LogOut, User } from "lucide-react";
import toast from 'react-hot-toast';

const NavBar = ({ activeTab, setActiveTab, reportTitle, loading, setSelectedPerson, user, onLogout }) => {
  const handleLogout = async () => {
    const result = await onLogout();
    if (result.success) {
      toast.success('Desconectado com sucesso');
    } else {
      toast.error(result.error || 'Erro ao desconectar');
    }
  };

  return (
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

            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
                  <User size={16} className="text-[#00D4C5]" />
                  <span className="text-xs font-semibold text-[#00D4C5] truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
        </div>
    </nav>
  );
};

export default NavBar;
