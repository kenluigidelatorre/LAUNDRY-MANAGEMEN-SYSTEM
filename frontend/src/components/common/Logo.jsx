import React from 'react';

export const Logo = ({
  inverted = false,
  darkText = false,
  size = 'md',
}) => {
  const scaleClass = size === 'lg' ? 'scale-110' : size === 'sm' ? 'scale-90' : '';
  return (
    <div className={`inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0 ${scaleClass}`}>
      <span
        className={`wd-logo-mark ${inverted ? 'wd-logo-mark--inverted' : ''}`}
        aria-hidden="true"
      >
        <i />
        <i />
        <i />
      </span>
      <span
        className={`font-display text-[20px] font-extrabold tracking-[-0.03em] ${
          darkText ? 'text-white' : 'text-[#13213c]'
        }`}
      >
        Wash n&apos;{' '}
        <span className={inverted ? 'text-[#8db5ff]' : 'text-[#246bfd]'}>Dash</span>
      </span>
    </div>
  );
};
