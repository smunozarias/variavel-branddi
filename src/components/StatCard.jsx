import React from 'react';

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

export default StatCard;
