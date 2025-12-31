'use client';

import React from 'react';

interface FeatureBlockProps {
    icon: string;
    title: string;
    description: string;
    accentColor?: string;
}

export const FeatureBlock: React.FC<FeatureBlockProps> = ({ icon, title, description, accentColor = '#8b5cf6' }) => {
    return (
        <div className="group relative p-8 rounded-[32px] bg-[#1c1c1e]/40 border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden h-full flex flex-col items-center text-center">
            {/* Ambient Glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 70%)`
                }}
            />

            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>

            <h3 className="text-xl font-black tracking-tight text-white mb-3 leading-tight uppercase">
                {title}
            </h3>

            <p className="text-[#86868b] font-medium leading-relaxed max-w-[240px]">
                {description}
            </p>
        </div>
    );
};

interface StepProps {
    number: string;
    title: string;
    description: string;
}

export const SuccessStep: React.FC<StepProps> = ({ number, title, description }) => {
    return (
        <div className="flex flex-col items-center text-center px-4">
            <div className="w-10 h-10 rounded-full border border-[#8b5cf6] flex items-center justify-center text-[#8b5cf6] font-black text-xs mb-6 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                {number}
            </div>
            <h4 className="text-lg font-black text-white mb-2 uppercase tracking-tight">{title}</h4>
            <p className="text-sm text-[#86868b] font-medium leading-relaxed max-w-[200px]">{description}</p>
        </div>
    );
};
