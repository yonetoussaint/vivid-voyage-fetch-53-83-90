import React, { useState } from "react";
import {
  Wifi,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import ProductSectionHeader from "./ProductSectionHeader";
import ToggleExpandButton from "./ToggleExpandButton";

// Network variant item component
const NetworkVariantItem = ({
  variant,
  selectedNetwork,
  onNetworkChange,
  convertToHTG,
  bundlePrice,
  hidePrices = false,
}) => {
  console.log('🔧 NetworkVariantItem received variant:', variant);
  
  // Determine display label - prioritize explicit type first, then fall back to locked status
  const displayLabel = variant.type === 'Unlocked' || variant.type === 'Locked' 
    ? variant.type 
    : (typeof variant.locked === 'boolean' ? (variant.locked ? 'Locked' : 'Unlocked') : variant.type);
  const isSelected = selectedNetwork === displayLabel;
  const isOutOfStock = variant.stock === 0 || variant.quantity === 0;

  // Format price with thousands separator
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(Math.round(price));
  };
  const stockCount = variant.stock || variant.quantity || 0;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all cursor-pointer bg-white
        ${isSelected
          ? "border-orange-500 ring-2 ring-orange-200"
          : "border-gray-300 hover:border-gray-400"}
        ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => {
        if (!isOutOfStock) {
          onNetworkChange(displayLabel);
        }
      }}
    >
      {/* Network type at top */}
      <div className="bg-white">
        <div className="text-sm font-bold text-gray-900 text-center py-1">
          {displayLabel}
        </div>
        <div className="bg-black bg-opacity-10 text-center leading-none">
          <span className="text-xs text-gray-700">
            {stockCount > 0 ? `${stockCount} available` : "Out of Stock"}
          </span>
        </div>
      </div>


      {/* Price and options info at bottom */}
      <div className="text-xs text-gray-600 p-2 bg-gray-100">
        {stockCount > 0 ? (
          <>
          {(() => {
            const conditionsCount = (variant.conditionOptions?.length || variant.conditions?.length || 0);
            const hasSubVariants = conditionsCount > 0;
            return (
              <>
                {!hidePrices && !hasSubVariants && variant.price && (
                  <span className="text-gray-900 font-medium">
                    USD {formatPrice(bundlePrice ? (bundlePrice / 132) : variant.price)}
                  </span>
                )}
                {conditionsCount > 0 && (
                  <span className="text-gray-600">
                    {conditionsCount} condition{conditionsCount !== 1 ? 's' : ''}
                  </span>
                )}
                {hidePrices && conditionsCount === 0 && (
                  <span className="text-gray-600">Available</span>
                )}
              </>
            );
          })()}
          </>
        ) : (
          <span className="text-red-600">Out of Stock</span>
        )}
      </div>
    </div>
  );
};

// Stock level information component
const StockLevelInfo = ({ selectedVariant, getStockLevelInfo }) => {
  const stockCount = selectedVariant.stock || selectedVariant.quantity || 0;
  const selectedStockInfo = getStockLevelInfo(stockCount);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${selectedStockInfo.progressColor}`}
          ></div>
          <span className="text-sm font-medium text-gray-700">
            {stockCount} units available
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
            ${selectedStockInfo.badgeColor} 
            ${selectedStockInfo.urgency === "high" ? "animate-pulse" : ""}`}
          >
            {selectedStockInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
};

// Network variants grid component
const NetworkVariantsGrid = ({
  displayedNetworkVariants,
  selectedNetwork,
  handleNetworkChange,
  convertToHTG,
  bundlePrice,
  hidePrices = false,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {displayedNetworkVariants.map((variant) => (
        <NetworkVariantItem
          key={variant.id}
          variant={variant}
          selectedNetwork={selectedNetwork}
          onNetworkChange={handleNetworkChange}
          convertToHTG={convertToHTG}
          bundlePrice={bundlePrice}
          hidePrices={hidePrices}
        />
      ))}
    </div>
  );
};

// Network variant interface
interface NetworkVariant {
  id: string;
  type: string;
  price: number;
  stock?: number;
  quantity?: number;
  locked?: boolean;
  carriers?: string[];
  conditionOptions?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
  conditions?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
}

// Main component interface
interface ProductNetworkVariantsProps {
  selectedNetwork?: string;
  onNetworkChange?: (network: string) => void;
  variants?: NetworkVariant[];
  hideHeader?: boolean;
  bundlePrice?: number;
  hidePrices?: boolean;
}

const ProductNetworkVariants = ({ 
  selectedNetwork: propSelectedNetwork,
  onNetworkChange,
  variants: propVariants,
  hideHeader = false,
  bundlePrice,
  hidePrices = false
}: ProductNetworkVariantsProps = {}) => {
  // Use passed variants or default variants
  const networkVariants = propVariants || [
    { id: "1", type: "Unlocked", price: 299.99, stock: 156 },
    { id: "2", type: "Verizon", price: 299.99, stock: 124 },
    { id: "3", type: "AT&T", price: 299.99, stock: 55 },
    { id: "4", type: "T-Mobile", price: 299.99, stock: 30 },
  ];

  // Find the first variant that's in stock, or just the first variant if all are out of stock
  const firstAvailableVariant = networkVariants.find(variant => 
    (variant.stock || variant.quantity || 0) > 0
  ) || networkVariants[0];

  const initialDisplay = firstAvailableVariant ? (
    firstAvailableVariant.type === 'Unlocked' || firstAvailableVariant.type === 'Locked' 
      ? firstAvailableVariant.type 
      : (typeof firstAvailableVariant.locked === 'boolean' ? (firstAvailableVariant.locked ? 'Locked' : 'Unlocked') : firstAvailableVariant.type)
  ) : "";
  const [internalSelectedNetwork, setInternalSelectedNetwork] = useState(initialDisplay);
  const [showAllNetwork, setShowAllNetwork] = useState(false);
  
  // Use prop or internal state
  const selectedNetwork = propSelectedNetwork || internalSelectedNetwork;

  // Auto-select first available variant on mount if no network is already selected
  React.useEffect(() => {
    if ((!propSelectedNetwork || propSelectedNetwork === "") && firstAvailableVariant) {
      const display = firstAvailableVariant.type === 'Unlocked' || firstAvailableVariant.type === 'Locked' 
        ? firstAvailableVariant.type 
        : (typeof firstAvailableVariant.locked === 'boolean' ? (firstAvailableVariant.locked ? 'Locked' : 'Unlocked') : firstAvailableVariant.type);
      if (onNetworkChange) {
        onNetworkChange(display);
      } else {
        setInternalSelectedNetwork(display);
      }
    }
  }, [propSelectedNetwork, firstAvailableVariant, onNetworkChange]);

  const TOTAL_CAPACITY = 256;

  const displayedNetworkVariants = showAllNetwork
    ? networkVariants
    : networkVariants.slice(0, 3);

  const selectedVariant =
    networkVariants.find((v) => {
      const lbl = v.type === 'Unlocked' || v.type === 'Locked' 
        ? v.type 
        : (typeof v.locked === 'boolean' ? (v.locked ? 'Locked' : 'Unlocked') : v.type);
      return lbl === selectedNetwork;
    }) || networkVariants[0];

  const stockCount = selectedVariant?.stock || selectedVariant?.quantity || 0;
  const stockPercentage = Math.min(
    100,
    Math.max(0, stockCount / TOTAL_CAPACITY * 100)
  );

  const toggleShowAllNetwork = () => {
    setShowAllNetwork(!showAllNetwork);
  };

  // USD to HTG conversion rate
  const USD_TO_HTG = 132;
  const convertToHTG = (usdPrice) => {
    return (usdPrice * USD_TO_HTG).toFixed(0);
  };

  const getStockLevelInfo = (stock) => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        badgeColor: "bg-red-100 text-red-800",
        progressColor: "bg-gray-400",
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        urgency: "high",
        message: "Sold out! But we'll restock soon – stay tuned!",
      };
    } else if (stock >= 1 && stock <= 25) {
      return {
        label: "Low Stock",
        badgeColor: "bg-red-100 text-red-800",
        progressColor: "bg-red-500",
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
        urgency: "high",
        message: "Almost sold out – just a few left!",
      };
    } else if (stock >= 26 && stock <= 64) {
      return {
        label: "Running Low",
        badgeColor: "bg-orange-100 text-orange-800",
        progressColor: "bg-orange-500",
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
        urgency: "medium",
        message: "Stock is running low! Don't miss your chance.",
      };
    } else if (stock >= 65 && stock <= 128) {
      return {
        label: "In Stock",
        badgeColor: "bg-yellow-100 text-yellow-800",
        progressColor: "bg-yellow-500",
        icon: <CheckCircle className="w-4 h-4 text-yellow-500" />,
        urgency: "low",
        message: "Going quick – 50% of our stock is already gone!",
      };
    } else if (stock >= 129 && stock <= 200) {
      return {
        label: "Good Stock",
        badgeColor: "bg-green-100 text-green-800",
        progressColor: "bg-green-500",
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        urgency: "none",
        message: "Still available, but demand is picking up. Secure yours today!",
      };
    } else {
      return {
        label: "Plenty Available",
        badgeColor: "bg-blue-100 text-blue-800",
        progressColor: "bg-blue-500",
        icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
        urgency: "none",
        message: "Plenty available – get the best pick while stock is high!",
      };
    }
  };

  const handleNetworkChange = (network) => {
    if (onNetworkChange) {
      onNetworkChange(network);
    } else {
      setInternalSelectedNetwork(network);
    }
  };

  // Don't render if no variants
  if (!networkVariants || networkVariants.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      {!hideHeader && (
        <ProductSectionHeader
          title="Network options"
          icon={Wifi}
          selectedInfo={selectedNetwork}
        />
      )}

      <NetworkVariantsGrid
        displayedNetworkVariants={displayedNetworkVariants}
        selectedNetwork={selectedNetwork}
        handleNetworkChange={handleNetworkChange}
        convertToHTG={convertToHTG}
        bundlePrice={bundlePrice}
        hidePrices={hidePrices}
      />

      {networkVariants.length > 3 && (
        <div className="text-center">
          <ToggleExpandButton
            isExpanded={showAllNetwork}
            onToggle={toggleShowAllNetwork}
          />
        </div>
      )}

    </div>
  );
};

export default ProductNetworkVariants;