import React from 'react';

export const LaundryHeroIllustration = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 640 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Front-load washing machine with blue laundry basket and folded towels"
    >
      <defs>
        <linearGradient id="wdBlobGrad" x1="180" y1="30" x2="580" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d7e6ff" />
          <stop offset="100%" stopColor="#c4d9ff" />
        </linearGradient>
        <linearGradient id="wdBodyGrad" x1="250" y1="78" x2="515" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f5f8ff" />
          <stop offset="100%" stopColor="#e1ebff" />
        </linearGradient>
        <linearGradient id="wdWaterGrad" x1="330" y1="220" x2="430" y2="335" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5da8ff" />
          <stop offset="55%" stopColor="#1d65f2" />
          <stop offset="100%" stopColor="#1449c7" />
        </linearGradient>
        <linearGradient id="wdBasketGrad" x1="120" y1="295" x2="310" y2="425" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2f74ff" />
          <stop offset="100%" stopColor="#1650d4" />
        </linearGradient>
        <filter id="wdSoftShadow" x="-15%" y="-15%" width="130%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#1d4ed8" floodOpacity="0.14" />
        </filter>
      </defs>

      <path
        d="M270 52C350 12 496 18 564 95C624 163 608 286 550 356C488 430 335 446 250 398C172 354 152 248 178 168C196 112 224 75 270 52Z"
        fill="url(#wdBlobGrad)"
      />

      <ellipse cx="355" cy="432" rx="228" ry="20" fill="#c7d8fb" opacity="0.7" />

      <path
        d="M196 118L202 136L220 142L202 148L196 166L190 148L172 142L190 136L196 118Z"
        fill="#246bfd"
      />
      <path
        d="M236 164L240 176L252 180L240 184L236 196L232 184L220 180L232 176L236 164Z"
        fill="#5393ff"
      />

      <path d="M542 48C548 42 558 46 556 56L545 86C543 92 534 90 534 83L542 48Z" fill="#1d5ef3" />
      <path d="M578 72C585 67 593 74 588 82L566 105C561 109 554 103 558 97L578 72Z" fill="#508dff" />
      <path d="M594 114C601 112 605 121 598 126L569 138C563 140 559 132 565 128L594 114Z" fill="#1d5ef3" />

      <g filter="url(#wdSoftShadow)">
        <rect x="242" y="72" width="268" height="346" rx="26" fill="url(#wdBodyGrad)" stroke="#d3e1fc" strokeWidth="2" />
        <path d="M242 98C242 83.64 253.64 72 268 72H484C498.36 72 510 83.64 510 98V134H242V98Z" fill="#f9fbff" />
        <line x1="242" y1="134" x2="510" y2="134" stroke="#dce6fa" strokeWidth="2" />

        <rect x="264" y="88" width="66" height="32" rx="6" fill="#edf3ff" stroke="#c8d9fb" strokeWidth="1.5" />
        <rect x="278" y="102" width="38" height="6" rx="3" fill="#9fbaff" />

        <circle cx="376" cy="103" r="17" fill="#324669" />
        <circle cx="376" cy="103" r="12" fill="#465c82" />
        <rect x="374" y="92" width="4" height="9" rx="2" fill="#93c5fd" />

        <rect x="424" y="88" width="64" height="30" rx="7" fill="#1c2d4f" />
        <rect x="434" y="96" width="28" height="7" rx="2" fill="#5da8ff" />
        <circle cx="473" cy="99" r="3" fill="#93c5fd" />
        <rect x="434" y="108" width="42" height="3.5" rx="1.75" fill="#4f6794" />

        <circle cx="376" cy="264" r="98" fill="#1f3152" />
        <circle cx="376" cy="264" r="88" fill="#3a4f75" />
        <circle cx="376" cy="264" r="76" fill="#eaf2ff" />

        <clipPath id="wdDrumClip">
          <circle cx="376" cy="264" r="74" />
        </clipPath>
        <g clipPath="url(#wdDrumClip)">
          <rect x="300" y="188" width="152" height="152" fill="#dcebff" />
          <path
            d="M298 258C324 236 358 278 388 260C418 242 440 232 456 246V346H298V258Z"
            fill="url(#wdWaterGrad)"
          />
          <path
            d="M298 278C334 294 366 266 402 276C426 283 444 278 456 270V346H298V278Z"
            fill="#154fd6"
            opacity="0.72"
          />
          <path
            d="M312 292C338 308 375 304 404 290"
            stroke="#93c5fd"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="352" cy="238" r="10" fill="#ffffff" opacity="0.65" />
          <circle cx="376" cy="222" r="6" fill="#ffffff" opacity="0.75" />
          <circle cx="395" cy="244" r="4.5" fill="#ffffff" opacity="0.6" />
          <circle cx="342" cy="296" r="5" fill="#bfdbfe" opacity="0.8" />
          <circle cx="404" cy="288" r="7" fill="#bfdbfe" opacity="0.6" />
        </g>

        <path
          d="M326 218C344 198 378 194 406 206"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.7"
        />

        <rect x="444" y="370" width="38" height="28" rx="6" fill="#edf3ff" stroke="#c8d9fb" strokeWidth="1.5" />
        <circle cx="463" cy="384" r="5" fill="#9fbaff" />
      </g>

      <g filter="url(#wdSoftShadow)">
        <path d="M138 292C146 254 194 244 232 256C272 246 312 264 312 296H138Z" fill="#1d5ef3" />
        <path d="M160 278C176 252 222 250 250 270C276 260 296 274 298 296H156Z" fill="#4f8bff" />
        <path d="M148 292C152 278 192 274 224 282C256 290 288 286 302 296L294 330C278 334 260 324 236 328C214 332 184 326 156 320L148 292Z" fill="#ffffff" />

        <rect x="122" y="294" width="204" height="22" rx="11" fill="#2f74ff" />
        <path d="M132 316H316L298 418C296 426 289 432 280 432H168C159 432 152 426 150 418L132 316Z" fill="url(#wdBasketGrad)" />

        {[154, 184, 214, 244, 274].map((x) => (
          <React.Fragment key={x}>
            <rect x={x} y="330" width="18" height="24" rx="5" fill="#0f3494" opacity="0.7" />
            <rect x={x + 2} y="366" width="16" height="24" rx="5" fill="#0f3494" opacity="0.7" />
            <rect x={x + 4} y="400" width="14" height="16" rx="4" fill="#0f3494" opacity="0.7" />
          </React.Fragment>
        ))}
      </g>

      <g filter="url(#wdSoftShadow)">
        <rect x="442" y="394" width="144" height="34" rx="15" fill="#448aff" />
        <rect x="454" y="406" width="120" height="8" rx="4" fill="#2563eb" opacity="0.35" />

        <rect x="448" y="362" width="134" height="34" rx="15" fill="#ffffff" stroke="#d5e3fc" strokeWidth="1.5" />
        <rect x="462" y="375" width="106" height="7" rx="3.5" fill="#dbe7fe" />

        <rect x="444" y="330" width="140" height="34" rx="15" fill="#1d5ef3" />
        <rect x="458" y="343" width="112" height="7" rx="3.5" fill="#1345bd" opacity="0.5" />
      </g>
    </svg>
  );
};
