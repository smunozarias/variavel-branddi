import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';

const SummaryItem = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
        <span className="text-sm opacity-70 font-medium text-cyan-50">
            {label}
        </span>
        <span className="font-black text-sm text-white">
            {formatCurrency(value)}
        </span>
    </div>
);

export default SummaryItem;
