import React from 'react';

const SimpleLineChart = ({ data, lines }) => {
    if (!data || data.length === 0) return null;

    const padding = 40;
    const width = 800;
    const height = 300;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const allValues = data.flatMap(d => lines.map(l => d[l.key]));
    const maxValue = Math.max(...allValues, 10) * 1.1;
    const minValue = 0;

    const getX = (index) => padding + (index / (data.length - 1 || 1)) * chartWidth;
    const getY = (value) => height - padding - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;

    return (
        <div className="w-full overflow-x-auto bg-[#0B132B] p-6 rounded-[2rem] border border-white/5 shadow-inner">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px]">
                {/* Grid Lines */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="2" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#334155" strokeWidth="2" />

                {/* Lines */}
                {lines.map((line) => {
                    const pathD = data.map((d, i) =>
                        `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[line.key] || 0)}`
                    ).join(' ');

                    return (
                        <g key={line.key}>
                            <path d={pathD} fill="none" stroke={line.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {data.map((d, i) => (
                                <circle
                                    key={i}
                                    cx={getX(i)}
                                    cy={getY(d[line.key] || 0)}
                                    r="4"
                                    fill="#0B132B"
                                    stroke={line.color}
                                    strokeWidth="2"
                                />
                            ))}
                        </g>
                    );
                })}

                {/* Labels X */}
                {data.map((d, i) => (
                    <text key={i} x={getX(i)} y={height - 10} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                        {d.label}
                    </text>
                ))}

                {/* Legend */}
                <g transform={`translate(${padding}, 10)`}>
                    {lines.map((line, i) => (
                        <g key={i} transform={`translate(${i * 180}, 0)`}>
                            <rect width="10" height="10" fill={line.color} rx="2" />
                            <text x="15" y="9" fill="#cbd5e1" fontSize="10" fontWeight="bold">{line.name}</text>
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    );
};

export default SimpleLineChart;
