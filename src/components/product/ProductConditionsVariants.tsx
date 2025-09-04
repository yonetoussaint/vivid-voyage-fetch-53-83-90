import React, { useState } from "react";
import {
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import ProductSectionHeader from "./ProductSectionHeader";
import ToggleExpandButton from "./ToggleExpandButton";

// Condition variant item component
const ConditionVariantItem = ({
  variant,
  selectedCondition,
  onConditionChange,
  convertToHTG,
  bundlePrice,
}) => {
  console.log('🔧 ConditionVariantItem received variant:', variant);
  
  const isSelected = selectedCondition === variant.name;
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
          onConditionChange(variant.name);
        }
      }}
    >
      {/* Condition name at top */}
      <div className="bg-white">
        <div className="text-sm font-bold text-gray-900 text-center py-1">
          {variant.name}
        </div>
        <div className="bg-black bg-opacity-10 text-center leading-none">
          <span className="text-xs text-gray-700">
            {stockCount > 0 ? `${stockCount} available` : "Out of Stock"}
          </span>
        </div>
      </div>


      {/* Price and description info at bottom */}
      <div className="text-xs text-gray-600 p-2 bg-gray-100">
        {stockCount > 0 ? (
          <>
            {/* Show price - Always use variant.price for individual condition pricing */}
            <div className="text-gray-900 font-medium mb-1">
              USD {formatPrice(variant.price)}
            </div>
            
            {/* Show description if available */}
            {variant.description && (
              <div className="text-gray-600 text-xs leading-tight">
                {variant.description}
              </div>
            )}
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

// Conditions variants grid component
const ConditionsVariantsGrid = ({
  displayedConditionVariants,
  selectedCondition,
  handleConditionChange,
  convertToHTG,
  bundlePrice,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {displayedConditionVariants.map((variant) => (
        <ConditionVariantItem
          key={variant.id}
          variant={variant}
          selectedCondition={selectedCondition}
          onConditionChange={handleConditionChange}
          convertToHTG={convertToHTG}
          bundlePrice={bundlePrice}
        />
      ))}
    </div>
  );
};

// Condition variant interface
interface ConditionVariant {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  quantity?: number;
  sku?: string;
  active?: boolean;
}

// Main component interface
interface ProductConditionsVariantsProps {
  selectedCondition?: string;
  onConditionChange?: (condition: string) => void;
  variants?: ConditionVariant[];
  hideHeader?: boolean;
  bundlePrice?: number;
}

const ProductConditionsVariants = ({ 
  selectedCondition: propSelectedCondition,
  onConditionChange,
  variants: propVariants,
  hideHeader = false,
  bundlePrice
}: ProductConditionsVariantsProps = {}) => {
  console.log('🔧 ProductConditionsVariants received propVariants:', propVariants);
  console.log('🔧 ProductConditionsVariants propVariants structure:', propVariants?.map(v => ({ id: v.id, name: v.name, price: v.price })));
  
  // Use passed variants or empty array (no fallback mock data)
  const conditionVariants = propVariants || [];

  console.log('🔧 ProductConditionsVariants using conditionVariants:', conditionVariants);
  console.log('🔧 ProductConditionsVariants conditionVariants prices:', conditionVariants?.map(v => ({ name: v.name, price: v.price })));

  // Find the first variant that's in stock, or just the first variant if all are out of stock
  const firstAvailableVariant = conditionVariants.find(variant => 
    (variant.stock || variant.quantity || 0) > 0
  ) || conditionVariants[0];

  const [internalSelectedCondition, setInternalSelectedCondition] = useState(firstAvailableVariant?.name || "");
  const [showAllConditions, setShowAllConditions] = useState(false);
  
  // Use prop or internal state
  const selectedCondition = propSelectedCondition || internalSelectedCondition;

  // Auto-select first available variant on mount if no condition is already selected
  React.useEffect(() => {
    if ((!propSelectedCondition || propSelectedCondition === "") && firstAvailableVariant) {
      if (onConditionChange) {
        onConditionChange(firstAvailableVariant.name);
      } else {
        setInternalSelectedCondition(firstAvailableVariant.name);
      }
    }
  }, [propSelectedCondition, firstAvailableVariant, onConditionChange]);

  const TOTAL_CAPACITY = 256;

  const displayedConditionVariants = showAllConditions
    ? conditionVariants
    : conditionVariants.slice(0, 3);

  const selectedVariant =
    conditionVariants.find((v) => v.name === selectedCondition) || conditionVariants[0];

  const stockCount = selectedVariant?.stock || selectedVariant?.quantity || 0;
  const stockPercentage = Math.min(
    100,
    Math.max(0, stockCount / TOTAL_CAPACITY * 100)
  );

  const toggleShowAllConditions = () => {
    setShowAllConditions(!showAllConditions);
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

  const handleConditionChange = (condition) => {
    if (onConditionChange) {
      onConditionChange(condition);
    } else {
      setInternalSelectedCondition(condition);
    }
  };

  // Don't render if no variants
  if (!conditionVariants || conditionVariants.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      {!hideHeader && (
        <ProductSectionHeader
          title="Condition options"
          icon={Package}
          selectedInfo={selectedCondition}
        />
      )}

      <ConditionsVariantsGrid
        displayedConditionVariants={displayedConditionVariants}
        selectedCondition={selectedCondition}
        handleConditionChange={handleConditionChange}
        convertToHTG={convertToHTG}
        bundlePrice={bundlePrice}
      />

      {conditionVariants.length > 3 && (
        <div className="text-center">
          <ToggleExpandButton
            isExpanded={showAllConditions}
            onToggle={toggleShowAllConditions}
          />
        </div>
      )}

    </div>
  );
};

export default ProductConditionsVariants;