import React, { useState } from "react";
import {
  Palette,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bell,
  ChevronDown,
} from "lucide-react";
import ProductSectionHeader from "./ProductSectionHeader";
import ToggleExpandButton from "./ToggleExpandButton";

// Color variant item component - thumbnail style
const ColorVariantItem = ({
  variant,
  selectedColor,
  onColorChange,
  getColorHex,
  convertToHTG,
  minPrice,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const isSelected = selectedColor === variant.name;
  const isOutOfStock = variant.stock === 0;

  return (
    <div className="flex-shrink-0 w-20 cursor-pointer" onClick={() => {
        if (!isOutOfStock) {
          onColorChange(variant.name);
        }
      }}>
      {/* Variant title above thumbnail */}
      <div className="mb-1 text-center">
        <div className="text-xs text-gray-800 font-medium truncate px-1">
          {variant.name}
        </div>
        {/* Hide price when variant has sub-variants (storage options), as pricing is handled by sub-variants */}
        {(!variant.storageOptions || variant.storageOptions.length === 0) && (
          <div className="text-xs font-bold text-gray-600">
            ${Math.round(variant.price || minPrice)}
          </div>
        )}
      </div>
      
      {/* Thumbnail image */}
      <div className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200
        ${isSelected
          ? "border-[#FF4747] shadow-md ring-2 ring-[#FF4747]/20"
          : "border-gray-200 hover:border-gray-300"}
        ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        hover:shadow-sm`}>
        
        {/* Out of Stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white text-black text-[8px] px-1 py-0.5 rounded flex items-center gap-1">
              <Bell className="w-2 h-2" />
              <span>Notify</span>
            </div>
          </div>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-[#FF4747] rounded-full flex items-center justify-center shadow-md z-20">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {/* Loading spinner */}
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Thumbnail image */}
        {!imageError ? (
          <img
            src={
              variant.image ||
              `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop&crop=center`
            }
            alt={variant.name}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Color swatch indicator */}
        <div className="absolute bottom-1 left-1">
          <div 
            className="w-3 h-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: variant.colorCode || getColorHex(variant.name) }}
          ></div>
        </div>
        
        {/* Stock indicator */}
        {!isOutOfStock && variant.stock < 10 && (
          <div className="absolute bottom-1 right-1 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded">
            {variant.stock}
          </div>
        )}
      </div>
    </div>
  );
};

// Stock level information component
const StockLevelInfo = ({ selectedVariant, stockPercentage, getStockLevelInfo }) => {
  const selectedStockInfo = getStockLevelInfo(selectedVariant.stock);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${selectedStockInfo.progressColor}`}
          ></div>
          <span className="text-sm font-medium text-gray-700">
            {selectedVariant.stock} units available
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

// Color variants horizontal scrollable row component
const ColorVariantsGrid = ({
  displayedColorVariants,
  selectedColor,
  handleColorChange,
  getColorHex,
  convertToHTG,
  minPrice,
}) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {displayedColorVariants.map((variant) => (
        <ColorVariantItem
          key={variant.name}
          variant={variant}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          getColorHex={getColorHex}
          convertToHTG={convertToHTG}
          minPrice={minPrice}
        />
      ))}
    </div>
  );
};

// Color variant interface
interface ColorVariant {
  name: string;
  price: number;
  stock: number;
  bestseller?: boolean;
  image?: string;
  colorCode?: string;
  active?: boolean;
  storageOptions?: Array<{
    id: string;
    capacity: string;
    networkOptions?: Array<any>;
  }>;
}

// Main component interface
interface ProductColorVariantsProps {
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  variants?: ColorVariant[];
  hideHeader?: boolean;
  bundlePrice?: number;
}

const ProductColorVariants = ({ 
  selectedColor: propSelectedColor,
  onColorChange,
  variants: propVariants,
  hideHeader = false,
  bundlePrice
}: ProductColorVariantsProps = {}) => {
  // Use passed variants - no fallback to hardcoded data
  const allVariants = propVariants || [];
  // Filter to only show active variants (explicit true)
  const colorVariants = allVariants.filter(variant => variant.active === true);

  // If no active variants, render nothing to avoid runtime errors
  if (colorVariants.length === 0) {
    return null;
  }
  // Find the first variant that's in stock, or just the first variant if all are out of stock
  const firstAvailableVariant = colorVariants.find(variant => variant.stock > 0) || colorVariants[0];

  const [internalSelectedColor, setInternalSelectedColor] = useState(firstAvailableVariant?.name || "");
  const [showAllColors, setShowAllColors] = useState(false);

  // Auto-select first available variant on mount if no color is already selected
  React.useEffect(() => {
    if ((!propSelectedColor || propSelectedColor === "") && onColorChange && firstAvailableVariant) {
      onColorChange(firstAvailableVariant.name);
    }
  }, [propSelectedColor, onColorChange, firstAvailableVariant]);
  
  // Use prop or internal state
  const selectedColor = propSelectedColor || internalSelectedColor;

  const TOTAL_CAPACITY = 256;
  
  // USD to HTG conversion rate
  const USD_TO_HTG = 132;
  
  // Find minimum price across all variants - use bundle price if available
  const minPrice = bundlePrice 
    ? bundlePrice / USD_TO_HTG  // Convert HTG to USD for display
    : Math.min(...colorVariants.map(v => v.price || 0));

  // Sort variants to put out of stock items last
  const sortedColorVariants = [...colorVariants].sort((a, b) => {
    if (a.stock === 0 && b.stock > 0) return 1;
    if (a.stock > 0 && b.stock === 0) return -1;
    return 0;
  });

  const displayedColorVariants = showAllColors
    ? sortedColorVariants
    : sortedColorVariants.slice(0, 3);

  const selectedVariant =
    colorVariants.find((v) => v.name === selectedColor) || colorVariants[0];

  const stockPercentage = Math.min(
    100,
    Math.max(0, (selectedVariant.stock / TOTAL_CAPACITY) * 100)
  );

  const toggleShowAllColors = () => {
    setShowAllColors(!showAllColors);
  };

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

  const getColorHex = (name) => {
    const colorMap = {
      "Black": "#000000",
      "Midnight Black": "#000000", 
      "White": "#ffffff",
      "Pearl White": "#ffffff",
      "Jet Black": "#111111",
      "Navy Blue": "#1e3a8a",
      "Ocean Blue": "#1e3a8a",
      "Red": "#dc2626",
      "Crimson Red": "#dc2626",
      "Forest Green": "#16a34a",
    };
    return colorMap[name];
  };

  const handleColorChange = (color) => {
    if (onColorChange) {
      onColorChange(color);
    } else {
      setInternalSelectedColor(color);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      {!hideHeader && (
        <ProductSectionHeader
          title="Product variants"
          icon={Palette}
          rightContent={
            <div className="flex items-center gap-1 text-sm text-gray-600 font-medium">
              <span>{colorVariants.length} options available</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          }
        />
      )}

      <ColorVariantsGrid
        displayedColorVariants={displayedColorVariants}
        selectedColor={selectedColor}
        handleColorChange={handleColorChange}
        getColorHex={getColorHex}
        convertToHTG={convertToHTG}
        minPrice={minPrice}
      />

      {colorVariants.length > 3 && (
        <div className="text-center">
          <ToggleExpandButton
            isExpanded={showAllColors}
            onToggle={toggleShowAllColors}
          />
        </div>
      )}

    </div>
  );
};

export default ProductColorVariants;