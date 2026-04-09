import React from 'react';

export const NovaAILogo: React.FC<{ size?: number }> = ({ size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="nova-ai-logo"
    >
      <defs>
        {/* Ring gradient - cyan to purple */}
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="1" />
          <stop offset="50%" stopColor="#5e35b1" stopOpacity="1" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="1" />
        </linearGradient>
        
        {/* N shape gradient - blue to purple */}
        <linearGradient id="nGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e90ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#9c27b0" stopOpacity="1" />
        </linearGradient>
        
        {/* Strong glow filter */}
        <filter id="strongGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Star glow filter */}
        <filter id="starGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glowing ring */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#ringGradient)" strokeWidth="3" opacity="0.8" filter="url(#strongGlow)" />
      
      {/* Inner ring accent */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#ringGradient)" strokeWidth="1.5" opacity="0.4" />

      {/* Stylized N shape with curves */}
      <g>
        {/* Left vertical line */}
        <path d="M 30 65 L 30 35" stroke="url(#nGradient)" strokeWidth="8" strokeLinecap="round" filter="url(#strongGlow)" />
        
        {/* Curved connecting element */}
        <path d="M 30 45 Q 45 38, 60 40" stroke="url(#nGradient)" strokeWidth="8" strokeLinecap="round" fill="none" filter="url(#strongGlow)" />
        
        {/* Right curved element */}
        <path d="M 60 40 Q 68 50, 65 65" stroke="url(#nGradient)" strokeWidth="8" strokeLinecap="round" fill="none" filter="url(#strongGlow)" />
      </g>

      {/* Bottom left glowing sphere */}
      <circle cx="25" cy="75" r="5" fill="#00e5ff" opacity="0.9" filter="url(#strongGlow)" />
      <circle cx="25" cy="75" r="3" fill="#00e5ff" opacity="0.6" />

      {/* Top right star/spark glow */}
      <circle cx="75" cy="20" r="4" fill="#00e5ff" opacity="1" filter="url(#starGlow)" />
      <path d="M 75 15 L 78 20 L 75 25 L 72 20 Z" fill="#00e5ff" opacity="0.8" filter="url(#starGlow)" />
    </svg>
  );
};
