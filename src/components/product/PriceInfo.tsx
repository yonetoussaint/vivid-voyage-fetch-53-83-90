import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrency, currencies, currencyToCountry } from '@/contexts/CurrencyContext';

interface PriceInfoProps {
  product?: {
    id: string;
    name: string;
    price: number;
    discount_price?: number | null;
  };
  bundlePrice?: number;
  focusMode?: boolean;
  isPlaying?: boolean;
}

const PriceInfo: React.FC<PriceInfoProps> = ({ 
  product, 
  bundlePrice, 
  focusMode,
  isPlaying 
}) => {
  const { currentCurrency, toggleCurrency, formatPrice } = useCurrency();

  if (!product) return null;

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/css/flag-icons.min.css" />
      
      <div className={`absolute bottom-12 left-3 z-30 transition-opacity duration-300 ${(focusMode || isPlaying) ? 'opacity-0' : ''}`}>
        <button
          onClick={toggleCurrency}
          className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-black/70 transition-colors"
        >
          <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center">
            <span className={`fi fi-${currencyToCountry[currentCurrency]} scale-150`}></span>
          </div>
          <ChevronDown className="w-3 h-3 stroke-2" />
          <span className="text-white font-bold">
            {formatPrice(product.discount_price || product.price, bundlePrice)}
          </span>
          <span className="font-bold">
            {currencies[currentCurrency]}
          </span>
        </button>
      </div>
    </>
  );
};

export default PriceInfo;