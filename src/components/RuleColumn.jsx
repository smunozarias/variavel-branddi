import React from 'react';

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

export default RuleColumn;
