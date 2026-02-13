import React from 'react';

const StatCard = ({ label, value, sub, icon }) => (
    <div className="card-base p-6 md:p-7 hover:shadow-2xl group relative overflow-hidden">
        {/* Gradient background effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4C5]/8 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#00D4C5]/12 transition-all"></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
            {/* Icon */}
            <div className="p-3 md:p-4 rounded-xl text-[#021017] shadow-lg shadow-[#00D4C5]/20 group-hover:scale-110 group-hover:shadow-[#00D4C5]/40 transition-all bg-[#00D4C5]">
                {icon}
            </div>
            
            {/* Label and Value */}
            <div className="text-right">
                <p className="text-caption mb-1.5">
                    {label}
                </p>
                <p className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                    {value}
                </p>
            </div>
        </div>
        
        {/* Divider and Sub info */}
        <div className="flex items-center gap-2 text-[11px] md:text-xs font-medium text-cyan-100/50 border-t border-white/5 pt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D4C5] animate-pulse flex-shrink-0"></div>
            <span className="truncate">{sub}</span>

export default StatCard;
