import React, { useState, useEffect } from "react";
import {
  HardDrive,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import ProductSectionHeader from "./ProductSectionHeader";
import ToggleExpandButton from "./ToggleExpandButton";

// Helper function to format storage capacity
const formatStorageCapacity = (capacity: string) => {
  if (!capacity) return '';
  // If it already ends with GB, TB, etc., return as is
  if (/\d+\s?(GB|TB|MB)$/i.test(capacity)) return capacity;
  // If it's just a number, add GB
  if (/^\d+$/.test(capacity)) return `${capacity} GB`;
  // Otherwise return as is
  return capacity;
};

// Storage variant item component
const StorageVariantItem = ({
  variant,
  selectedStorage,
  onStorageChange,
  convertToHTG,
  bundlePrice,
}) => {
  const isSelected = selectedStorage === (variant.capacity || variant.name);
  const isOutOfStock = variant.stock === 0;

  // Format price with thousands separator
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(Math.round(price));
  };

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all cursor-pointer bg-white
        ${isSelected
          ? "border-orange-500 ring-2 ring-orange-200"
          : "border-gray-300 hover:border-gray-400"}
        ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => {
        if (!isOutOfStock) {
          onStorageChange(variant.capacity || variant.name);
        }
      }}
    >
      {/* Storage capacity at top */}
      <div className="bg-white">
        <div className="text-sm font-bold text-gray-900 text-center py-1">
          {formatStorageCapacity(variant.capacity || variant.name)}
        </div>
        <div className="bg-black bg-opacity-10 text-center leading-none">
          <span className="text-xs text-gray-700">
            {variant.stock > 0 ? `${variant.stock} available` : "Out of Stock"}
          </span>
        </div>
      </div>


      {/* Price and options info at bottom */}
      <div className="text-xs text-gray-600 p-2 bg-gray-100">
        {variant.stock > 0 ? (
          <>
            {/* Hide price when variant has sub-variants (network options), as pricing is handled by sub-variants */}
            {(!variant.networkOptions || variant.networkOptions.length === 0) && (
              <span className="text-gray-900 font-medium">
                USD {formatPrice(bundlePrice ? (bundlePrice / 132) : variant.price)}
              </span>
            )}

            {/* Show sub-variants indicator when network options exist */}
            {variant.networkOptions && variant.networkOptions.length > 0 && (
              <span className="text-gray-600">
                {variant.networkOptions.length} network option{variant.networkOptions.length !== 1 ? 's' : ''}
              </span>
            )}
          </>
        ) : (
          <span className="text-red-600">Out of Stock</span>
        )}
      </div>
    </div>
  );
};

// Storage variants grid component
const StorageVariantsGrid = ({
  displayedStorageVariants,
  selectedStorage,
  handleStorageChange,
  convertToHTG,
  bundlePrice,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {displayedStorageVariants.map((variant) => (
        <StorageVariantItem
          key={variant.id}
          variant={variant}
          selectedStorage={selectedStorage}
          onStorageChange={handleStorageChange}
          convertToHTG={convertToHTG}
          bundlePrice={bundlePrice}
        />
      ))}
    </div>
  );
};

// Storage variant interface
interface StorageVariant {
  id: string;
  name: string;
  capacity: string;
  price: number;
  stock: number;
  image?: string;
  bestseller?: boolean;
  limited?: boolean;
  networkOptions?: Array<{
    id: string;
    type: string;
    price: number;
    quantity: number;
  }>;
}

// Main component interface
interface ProductStorageVariantsProps {
  selectedStorage?: string;
  onStorageChange?: (storage: string) => void;
  variants?: StorageVariant[];
  hideHeader?: boolean;
  bundlePrice?: number;
}

const ProductStorageVariants = ({ 
  selectedStorage: propSelectedStorage,
  onStorageChange: propOnStorageChange,
  variants: propVariants,
  hideHeader = false,
  bundlePrice
}: ProductStorageVariantsProps = {}) => {
  // Use passed variants - no fallback to hardcoded data
  const storageVariants = propVariants || [];
  
  const [internalSelectedStorage, setInternalSelectedStorage] = useState("");
  const [showAllStorage, setShowAllStorage] = useState(false);

  // Find the first variant that's in stock, or just the first variant if all are out of stock
  const firstAvailableVariant = storageVariants.find(variant => variant.stock > 0) || storageVariants[0];

  // Use prop or internal state
  const selectedStorage = propSelectedStorage !== undefined ? propSelectedStorage : internalSelectedStorage;
  
  // Handle storage change
  const handleStorageChange = (storage) => {
    if (propOnStorageChange) {
      propOnStorageChange(storage);
    } else {
      setInternalSelectedStorage(storage);
    }
  };

  // Auto-selection is now handled by the parent ProductDetail component

  const displayedStorageVariants = showAllStorage
    ? storageVariants
    : storageVariants.slice(0, 3);

  const selectedVariant = storageVariants.find((v) => (v.capacity || v.name) === selectedStorage) || firstAvailableVariant;

  const toggleShowAllStorage = () => {
    setShowAllStorage(!showAllStorage);
  };

  // USD to HTG conversion rate
  const USD_TO_HTG = 132;
  const convertToHTG = (usdPrice) => {
    return (usdPrice * USD_TO_HTG).toFixed(0);
  };

  // Don't render if no variants
  if (!storageVariants || storageVariants.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      {!hideHeader && (
        <ProductSectionHeader
          title="Storage options"
          icon={HardDrive}
          selectedInfo={storageVariants.length > 0 && selectedStorage ? selectedStorage : undefined}
        />
      )}

      <StorageVariantsGrid
        displayedStorageVariants={displayedStorageVariants}
        selectedStorage={selectedStorage}
        handleStorageChange={handleStorageChange}
        convertToHTG={convertToHTG}
        bundlePrice={bundlePrice}
      />

      {storageVariants.length > 3 && (
        <div className="text-center">
          <ToggleExpandButton
            isExpanded={showAllStorage}
            onToggle={toggleShowAllStorage}
          />
        </div>
      )}
    </div>
  );
};

export default ProductStorageVariants;