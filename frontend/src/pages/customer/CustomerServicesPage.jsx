import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Droplets,
  Layers,
  Shirt,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPHP } from '../../utils/formatters';

const ICON_MAP = {
  shirt: <Shirt className="w-5 h-5" />,
  droplets: <Droplets className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  layers: <Layers className="w-5 h-5" />,
  wind: <Wind className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
};

const COLOR_MAP = {
  blue: 'bg-[#eaf2ff] text-[#2772e8]',
  violet: 'bg-[#f1edff] text-[#7d5cde]',
  mint: 'bg-[#e3f8f1] text-[#16a276]',
  peach: 'bg-[#fff0e4] text-[#e8873e]',
};

export const CustomerServicesPage = () => {
  const { services } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((srv) => (
          <article
            key={srv.id}
            className="border border-[#e5eaf2] bg-white rounded-[14px] p-5 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-11 h-11 rounded-[12px] grid place-items-center shrink-0 ${
                      COLOR_MAP[srv.colorVariant] || COLOR_MAP.blue
                    }`}
                  >
                    {ICON_MAP[srv.iconKey] || ICON_MAP.shirt}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[15.5px] font-bold text-[#13213c] truncate">
                      {srv.name}
                    </h3>
                    <p className="text-[12px] text-[#6e7891] inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {srv.estimatedTime}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold whitespace-nowrap ${
                    srv.available
                      ? 'bg-[#e3f8f1] text-[#14936c]'
                      : 'bg-[#fff1f2] text-[#dc2626]'
                  }`}
                >
                  {srv.available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <p className="text-[13px] text-[#5d6a85] mt-3.5 leading-relaxed">
                {srv.description}
              </p>
            </div>

            <div className="pt-3.5 border-t border-[#e5eaf2] flex items-center justify-between gap-3">
              <div>
                <span className="block text-[11px] text-[#6e7891]">Rate per kilogram</span>
                <strong className="font-display text-[20px] font-extrabold text-[#13213c] tabular-nums">
                  {formatPHP(srv.pricePerKg)}
                  <span className="text-[12px] font-semibold text-[#6e7891]"> / kg</span>
                </strong>
              </div>
              <button
                type="button"
                disabled={!srv.available}
                onClick={() => navigate(`/customer/book?service=${encodeURIComponent(srv.id)}`)}
                className="h-[38px] px-4 rounded-[9px] bg-[#1d5ef3] hover:bg-[#154fd6] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                Book Service
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
