// Updated ProductDetail component - Sticky button extracted to separate component
import React, { useState, useEffect, useRef } from "react";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useProduct, useProductAnalytics } from "@/hooks/useProduct";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from '@/context/RedirectAuthContext';
import { useAuthOverlay } from '@/context/AuthOverlayContext';
import { Heart, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ProductHeader from "@/components/product/ProductHeader";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductSectionWrapper from "@/components/product/ProductSectionWrapper";

import ToggleExpandButton from "@/components/product/ToggleExpandButton";

import { useVariantStockDecay } from "@/hooks/useVariantStockDecay";

import PricingSection from '@/components/product/PricingSection';


import ProductDetailsTabs from '@/components/product/ProductDetailsTabs';
import ProductRecommendationsWithTabs from '@/components/product/ProductRecommendationsWithTabs';
import SearchInfoComponent from '@/components/product/SearchInfoComponent';
import SectionHeader from "@/components/home/SectionHeader";
import TabsNavigation from "@/components/home/TabsNavigation";




import StickyCheckoutBar from '@/components/product/StickyCheckoutBar';

const DEFAULT_PRODUCT_ID = "aae97882-a3a1-4db5-b4f5-156705cd10ee";
const MAX_QUANTITY = 250;

const ProductDetail = () => {
  console.log('🚀 ProductDetail component loaded');
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showVariants, setShowVariants] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [isExpressSelected, setIsExpressSelected] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState("none");
  
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showLiveData, setShowLiveData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(44);
  const headerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [focusMode, setFocusMode] = useState(false);
  const [showHeaderInFocus, setShowHeaderInFocus] = useState(false);
  
  const [bundlePrice, setBundlePrice] = useState<number | null>(null);
  const [currentTier, setCurrentTier] = useState(null);
  const [productDetailsSheetOpen, setProductDetailsSheetOpen] = useState(false);
  
  const [showStickyRecommendations, setShowStickyRecommendations] = useState(false);
  const [stickyActiveTab, setStickyActiveTab] = useState('electronics');
  const [selectedVariantFromGallery, setSelectedVariantFromGallery] = useState<{index: number, variant: any} | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { openAuthOverlay } = useAuthOverlay();
  const { id: paramId } = useParams<{ id: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const coreIdentityRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  const productId = paramId || DEFAULT_PRODUCT_ID;

  const { data: product, isLoading } = useProduct(productId);
  console.log('🔍 PRODUCT DEBUG: Current product:', product);
  console.log('🔍 PRODUCT DEBUG: Product ID:', productId);
  console.log('🔍 PRODUCT DEBUG: Product type:', product?.product_type);
  console.log('🔍 PRODUCT DEBUG: Variants from DB:', (product as any)?.variants);
  console.log('🔍 PRODUCT DEBUG: Storage variants from DB:', product?.storage_variants);

  // Use product's color variants (no fallback mock data - only real data)
  const allColorVariants = (product as any)?.variants || [];
  console.log('🔍 PRODUCT DEBUG: allColorVariants:', allColorVariants);

  // Filter to only show variants explicitly marked active (or default to true if active property missing)
  const colorVariants = allColorVariants.filter((variant: any) => variant.active !== false);

  // Get storage variants for the selected color, or fallback to global storage variants
  const getStorageVariantsForColor = () => {
    console.log('🔍 STORAGE DEBUG: getStorageVariantsForColor called with selectedColor:', selectedColor);
    if (selectedColor) {
      const selectedColorVariant = colorVariants.find(v => v.name === selectedColor);
      console.log('🔍 Selected color variant:', selectedColorVariant);

      if (selectedColorVariant && (selectedColorVariant as any).storageOptions) {
        console.log('📦 Storage options found:', (selectedColorVariant as any).storageOptions);

        // Convert storageOptions directly to storage variants format
        const mappedVariants = (selectedColorVariant as any).storageOptions.map((storageOption: any) => {
          console.log('🔄 Processing storage option:', storageOption);

          const mappedVariant = {
            id: storageOption.id,
            name: storageOption.capacity,
            capacity: storageOption.capacity,
            price: storageOption.price || 0,
            stock: storageOption.stock || storageOption.quantity || 0,
            bestseller: storageOption.bestseller || false,
            limited: storageOption.limited || false,
            // Include networkOptions if they exist (for sub-variants)
            networkOptions: storageOption.networkOptions || []
          };

          console.log('✅ Mapped variant:', mappedVariant);
          return mappedVariant;
        }).sort((a: any, b: any) => a.price - b.price);

        console.log('📋 Final mapped storage variants:', mappedVariants);
        return mappedVariants;
      }
    }
    // Fallback to global storage variants from database
    console.log('🔍 STORAGE DEBUG: Using global storage variants from product.storage_variants:', product?.storage_variants);
    return (product?.storage_variants || []).sort((a, b) => a.price - b.price);
  };

  const storageVariants = getStorageVariantsForColor();
  console.log('🔍 STORAGE DEBUG: Final storageVariants:', storageVariants);

  // Get network variants for the selected storage (no fallback mock data - only real data)
  const getNetworkVariantsForStorage = () => {
    if (selectedStorage) {
      const selectedStorageVariant = storageVariants.find(v => (v.capacity || v.name) === selectedStorage);
      console.log('🔍 Selected storage variant:', selectedStorageVariant);

      if (selectedStorageVariant && (selectedStorageVariant as any).networkOptions) {
        console.log('📡 Network options found:', (selectedStorageVariant as any).networkOptions);
        return (selectedStorageVariant as any).networkOptions;
      }
    }
    // Return empty array if no real network data found
    return [];
  };

  // Get condition variants for the selected network, or fallback to mock data
  const getConditionVariantsForNetwork = () => {
    console.log('🔧 CONDITION DEBUG: getConditionVariantsForNetwork called');
    console.log('🔧 CONDITION DEBUG: selectedNetwork:', selectedNetwork);
    console.log('🔧 CONDITION DEBUG: networkVariants:', networkVariants);
    
    if (selectedNetwork) {
      const selectedNetworkVariant = getNetworkVariantsForStorage().find(v => {
        const displayLabel = v.type === 'Unlocked' || v.type === 'Locked' 
          ? v.type 
          : (typeof (v as any).locked === 'boolean'
            ? ((v as any).locked ? 'Locked' : 'Unlocked')
            : (v as any).type);
        return displayLabel === selectedNetwork;
      });
      console.log('🔧 CONDITION DEBUG: selectedNetworkVariant:', selectedNetworkVariant);

      if (selectedNetworkVariant) {
        const variantAny = selectedNetworkVariant as any;
        console.log('🔧 CONDITION DEBUG: variantAny.conditions:', variantAny.conditions);
        console.log('🔧 CONDITION DEBUG: variantAny.conditionOptions:', variantAny.conditionOptions);
        
        if (Array.isArray(variantAny.conditions) && variantAny.conditions.length > 0) {
          console.log('✅ CONDITION DEBUG: Found conditions array:', variantAny.conditions);
          console.log('✅ CONDITION DEBUG: Condition prices:', variantAny.conditions.map(c => ({ name: c.name, price: c.price })));
          return variantAny.conditions;
        }
        if (Array.isArray(variantAny.conditionOptions) && variantAny.conditionOptions.length > 0) {
          console.log('✅ CONDITION DEBUG: Found conditionOptions array:', variantAny.conditionOptions);
          console.log('✅ CONDITION DEBUG: Condition prices:', variantAny.conditionOptions.map(c => ({ name: c.name, price: c.price })));
          return variantAny.conditionOptions;
        }
        
        console.log('⚠️ CONDITION DEBUG: No conditions found in network variant');
      } else {
        console.log('⚠️ CONDITION DEBUG: selectedNetworkVariant is null/undefined');
      }
    } else {
      console.log('⚠️ CONDITION DEBUG: selectedNetwork is empty');
    }
    
    console.log('❌ CONDITION DEBUG: Returning empty array');
    // Return empty array if no real conditions found (don't show fallback mock data)
    return [];
  };

  const networkVariants = getNetworkVariantsForStorage();
  const conditionVariants = getConditionVariantsForNetwork();


  // Calculate dynamic price based on variant hierarchy
  const calculateVariantPrice = () => {
    // If we have condition variants and a condition is selected, use condition price
    if (selectedCondition && conditionVariants.length > 0) {
      const conditionVariant = conditionVariants.find(v => v.name === selectedCondition);
      if (conditionVariant?.price) {
        return conditionVariant.price;
      }
    }
    
    // If we have network variants and a network is selected, use network price (if no conditions)
    if (selectedNetwork && networkVariants.length > 0 && conditionVariants.length === 0) {
      const networkVariant = networkVariants.find(v => v.type === selectedNetwork);
      if (networkVariant?.price) {
        return networkVariant.price;
      }
    }
    
    // If we have storage variants and storage is selected, use storage price (if no sub-variants)
    if (selectedStorage && storageVariants.length > 0 && networkVariants.length === 0) {
      const storageVariant = storageVariants.find(v => (v.capacity || v.name) === selectedStorage);
      if (storageVariant?.price) {
        return storageVariant.price;
      }
    }
    
    // If we have color variants and color is selected, use color price (if no sub-variants)
    if (selectedColor && colorVariants.length > 0 && storageVariants.length === 0) {
      const colorVariant = colorVariants.find(v => v.name === selectedColor);
      if (colorVariant?.price) {
        return colorVariant.price;
      }
    }
    
    // Fallback to base product price
    return product?.discount_price || product?.price || 0;
  };

  const { variantStockInfo, activateVariant, getTimeRemaining, resetVariant, resetAllVariants } = useVariantStockDecay({
    variants: colorVariants,
    decayPeriod: 12 * 60 * 60 * 1000
  });

  // Check if current product has variants based on type field
  const isVariableProduct = product?.product_type === 'variable';

  // Reset selections when product changes or on mount
  useEffect(() => {
    console.log('🔄 DEBUG: Product change detected, resetting selections');
    setSelectedColor("");
    setSelectedStorage("");
    setSelectedNetwork("");
    setSelectedCondition("");
    // Reset sticky recommendations header state
    setShowStickyRecommendations(false);
  }, [productId]);

  // Reset sticky state when component unmounts
  useEffect(() => {
    return () => {
      setShowStickyRecommendations(false);
    };
  }, []);

  // Auto-select first available color when product loads
  useEffect(() => {
    console.log('🔍 DEBUG: Color auto-selection triggered');
    console.log('🔍 DEBUG: colorVariants:', colorVariants);
    console.log('🔍 DEBUG: selectedColor:', selectedColor);
    console.log('🔍 DEBUG: isVariableProduct:', isVariableProduct);
    console.log('🔍 DEBUG: (product as any)?.variants:', (product as any)?.variants);
    
    // Auto-select for ANY product with color variants, not just variable products
    if (colorVariants.length > 0 && !selectedColor) {
      // Find the first available color with stock > 0, or just the first color if none have stock
      const firstAvailableColor = colorVariants.find(variant => variant.stock > 0) || colorVariants[0];
      
      console.log('🔍 DEBUG: firstAvailableColor found:', firstAvailableColor);
      
      if (firstAvailableColor) {
        setSelectedColor(firstAvailableColor.name);
        console.log('🎯 Auto-selected color:', firstAvailableColor.name);
      }
    }
  }, [colorVariants, selectedColor, (product as any)?.variants]);

  // Auto-select first available storage when available
  useEffect(() => {
    console.log('🔍 DEBUG: Storage auto-selection triggered');
    console.log('🔍 DEBUG: storageVariants:', storageVariants);
    console.log('🔍 DEBUG: selectedStorage:', selectedStorage);
    console.log('🔍 DEBUG: selectedColor:', selectedColor);

    if (selectedColor && storageVariants.length > 0 && !selectedStorage) {
      // Find the first available storage with stock > 0, or just the first storage if none have stock
      const firstAvailableStorage = storageVariants.find(variant => variant.stock > 0) || storageVariants[0];

      console.log('🔍 DEBUG: firstAvailableStorage found:', firstAvailableStorage);

      if (firstAvailableStorage) {
        setSelectedStorage(firstAvailableStorage.capacity || firstAvailableStorage.name);
        console.log('🎯 Auto-selected storage:', firstAvailableStorage.capacity || firstAvailableStorage.name);
      }
    }
  }, [storageVariants, selectedStorage, selectedColor]);

  useEffect(() => {
    if (selectedColor && activateVariant && isVariableProduct) {
      activateVariant(selectedColor);
    }
  }, [selectedColor, activateVariant, isVariableProduct]);


// Add this useEffect to auto-select the first network variant when available
useEffect(() => {
  console.log('🔍 DEBUG: Network auto-selection triggered');
  console.log('🔍 DEBUG: networkVariants:', networkVariants);
  console.log('🔍 DEBUG: selectedNetwork:', selectedNetwork);

  if (selectedStorage && networkVariants && networkVariants.length > 0 && !selectedNetwork) {
    // Find the first available network with stock > 0 (or quantity), or just the first network if none have stock
    const firstAvailableNetwork = networkVariants.find(variant => (variant.stock || (variant as any).quantity || 0) > 0) || networkVariants[0];

    console.log('🔍 DEBUG: firstAvailableNetwork found:', firstAvailableNetwork);

    if (firstAvailableNetwork) {
      const displayLabel = firstAvailableNetwork.type === 'Unlocked' || firstAvailableNetwork.type === 'Locked' 
        ? firstAvailableNetwork.type 
        : (typeof (firstAvailableNetwork as any).locked === 'boolean'
          ? ((firstAvailableNetwork as any).locked ? 'Locked' : 'Unlocked')
          : (firstAvailableNetwork as any).type);
      setSelectedNetwork(displayLabel);
      console.log('🎯 Auto-selected network:', displayLabel);
    }
  }
}, [networkVariants, selectedNetwork, selectedStorage]);



// For condition variants auto-selection
useEffect(() => {
  console.log('🔍 DEBUG: Condition auto-selection triggered');
  console.log('🔍 DEBUG: conditionVariants:', conditionVariants);
  console.log('🔍 DEBUG: selectedCondition:', selectedCondition);

  if (selectedNetwork && conditionVariants && conditionVariants.length > 0 && !selectedCondition) {
    // Find the first available condition with stock > 0, or just the first condition if none have stock
    const firstAvailableCondition = conditionVariants.find(variant => variant.stock > 0) || conditionVariants[0];

    console.log('🔍 DEBUG: firstAvailableCondition found:', firstAvailableCondition);

    if (firstAvailableCondition) {
      setSelectedCondition(firstAvailableCondition.name);
      console.log('🎯 Auto-selected condition:', firstAvailableCondition.name);
    }
  }
}, [conditionVariants, selectedCondition, selectedNetwork]);




  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics not available');
    }
  };


  const handleShare = async () => {
    await triggerHaptic();
    if (navigator.share) {
      navigator.share({
        title: product?.name || "Product",
        text: `Check out this ${product?.name || "product"}!`,
        url: window.location.href,
      }).catch((error) => {
        console.log('Error sharing:', error);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard",
      });
    }
  };

  const toggleFavorite = async () => {
    await triggerHaptic();
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite ? "Item removed from your wishlist" : "Item added to your wishlist",
    });
  };

  const toggleSaved = async () => {
    await triggerHaptic();
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from saved items" : "Added to saved items",
      description: isSaved ? "Item removed from your saved list" : "Item saved for later",
    });
  };

  const addToCart = async () => {
    await triggerHaptic();
    const productDetails = isVariableProduct 
      ? `1 x ${product?.name || "Product"} (${selectedColor})`
      : `1 x ${product?.name || "Product"}`;

    toast({
      title: "Added to cart",
      description: `${productDetails} added to your cart`,
    });
  };

  // Calculate current price using variant hierarchy
  const currentPrice = calculateVariantPrice();
  const originalPrice = product?.price || 0;

  const buyNow = async () => {
    await triggerHaptic();

    // Check if user is authenticated
    if (!user) {
      openAuthOverlay();
      return;
    }

    // Navigate to checkout with product details
    const checkoutParams = new URLSearchParams({
      productName: product?.name || "Product",
      quantity: "1",
      price: currentPrice.toString(),
    });

    // Only add color if it's a variable product
    if (isVariableProduct) {
      checkoutParams.set('color', selectedColor);
    }

    navigate(`/product-checkout?${checkoutParams.toString()}`);
  };

  const handleCartClick = () => {
    toast({
      title: "Cart",
      description: "Opening your shopping cart",
    });
  };

  const handleResetStock = () => {
    resetAllVariants();
    toast({
      title: "Stock Reset",
      description: "All product variants stock has been reset to initial values",
    });
  };

  const scrollToSection = (section: string) => {
    const refs = {
      overview: overviewRef,
      description: descriptionRef
    };

    const targetRef = refs[section as keyof typeof refs];
    if (targetRef?.current) {
      const yOffset = -120; // Account for sticky header with tabs
      const y = targetRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setActiveSection(section);
  };

  // Measure only the ProductHeader height (not including any tabs)
  useEffect(() => {
    const measureHeaderHeight = () => {
      if (headerRef.current) {
        // Get the first child which should be the ProductHeader main content
        const headerMainContent = headerRef.current.querySelector('[class*="py-2"]');
        if (headerMainContent) {
          const height = headerMainContent.getBoundingClientRect().height;
          setHeaderHeight(height);
          document.documentElement.style.setProperty('--header-height', `${height}px`);
        }
      }
    };

    measureHeaderHeight();
    // Re-measure on window resize
    window.addEventListener('resize', measureHeaderHeight);
    return () => window.removeEventListener('resize', measureHeaderHeight);
  }, []);

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160; // Account for header + tabs height

      // Check if recommendations section is visible for sticky header
      if (recommendationsRef.current) {
        const recommendationsTop = recommendationsRef.current.offsetTop - headerHeight; // Use dynamic header height
        setShowStickyRecommendations(window.scrollY >= recommendationsTop);
      }

      // Deactivate focus mode when scrolling down (but keep header hiding logic)
      if (focusMode && window.scrollY > 100) {
        setFocusMode(false);
      }

      // Handle focus mode header visibility when not scrolling much
      if (focusMode && window.scrollY <= 50) {
        setShowHeaderInFocus(false);
      }


      // Check sections from bottom to top for accurate detection
      if (descriptionRef.current && scrollPosition >= descriptionRef.current.offsetTop) {
        setActiveSection("description");
      } else {
        setActiveSection("overview");
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [focusMode, headerHeight]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-500">The product you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const productImages = product?.product_images?.map(img => img.src) || [];

  // Debug seller data
  console.log('🔍 SELLER DEBUG: product?.sellers:', product?.sellers);
  console.log('🔍 SELLER DEBUG: typeof sellers:', typeof product?.sellers);
  console.log('🔍 SELLER DEBUG: Is array:', Array.isArray(product?.sellers));

  // Convert USD to HTG (using the same conversion as in CoreIdentity)
  const convertToHTG = (usdPrice) => {
    const exchangeRate = 132; // 1 USD = 132 HTG
    const price = parseFloat(usdPrice) || 0;
    return price * exchangeRate;
  };

  // Get the HTG price for bundle deals
  const baseHTGPrice = convertToHTG(currentPrice);

  // Handle bundle price changes
  const handleBundlePriceChange = (price: number, tier: any) => {
    setBundlePrice(price);
    setCurrentTier(tier);
  };

  const selectedVariant = colorVariants.find((v) => v.name === selectedColor);
  const selectedVariantStockInfo = selectedColor ? variantStockInfo[selectedColor] : undefined;
  
  // Get selected color variant image
  const selectedColorImage = selectedVariant?.image || product?.product_images?.[0]?.src || "/placeholder.svg";

  const currentVariant = colorVariants.find(v => v.name === selectedColor);
  const currentStock = selectedVariantStockInfo?.currentStock !== undefined 
    ? Math.floor(selectedVariantStockInfo.currentStock)
    : (currentVariant ? currentVariant.stock : 0);

  return (
    <div className="flex flex-col min-h-screen bg-white overscroll-none" ref={contentRef}>
      <div ref={headerRef} className="relative z-50">
        <ProductHeader 
          activeSection={activeSection}
          onTabChange={scrollToSection}
          focusMode={focusMode}
          showHeaderInFocus={showHeaderInFocus}
          onProductDetailsClick={() => setProductDetailsSheetOpen(true)}
          currentImageIndex={currentImageIndex}
          totalImages={totalImages}
        />
      </div>
      
      {/* Sticky Recommendations Header with Tabs */}
      {showStickyRecommendations && (
        <div 
          className="fixed left-0 right-0 z-40 bg-white"
          style={{ top: 'var(--header-height, 44px)' }}
        >
          {/* Header Row with Gradient Background */}
          <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 text-white">
            <SectionHeader
              title="RECOMMENDATIONS"
              icon={ShoppingBag}
              viewAllLink="/search"
              viewAllText="View All Products"
              showTabs={false}
            />
          </div>
          
          {/* Tabs Navigation - Full Width */}
          <div className="w-screen -mx-4 bg-white">
            <TabsNavigation
              tabs={[
                { id: 'electronics', label: 'Electronics' },
                { id: 'fashion', label: 'Fashion' },
                { id: 'home', label: 'Home' },
                { id: 'sports', label: 'Sports' },
                { id: 'books', label: 'Books' },
                { id: 'automotive', label: 'Auto' },
                { id: 'health', label: 'Health' },
                { id: 'beauty', label: 'Beauty' },
                { id: 'toys', label: 'Toys' },
                { id: 'office', label: 'Office' },
                { id: 'garden', label: 'Garden' },
                { id: 'pet', label: 'Pet' }
              ]}
              activeTab={stickyActiveTab}
              onTabChange={setStickyActiveTab}
              edgeToEdge={true}
              style={{ backgroundColor: 'white' }}
            />
          </div>
        </div>
      )}

      <div className="relative z-0 w-full bg-transparent" ref={overviewRef}>
        <ProductImageGallery 
          images={productImages.length > 0 ? productImages : ["/placeholder.svg"]}
          videos={product?.product_videos || []}
          model3dUrl={product?.model_3d_url}
          focusMode={focusMode}
          onFocusModeChange={setFocusMode}
          seller={product?.sellers}
          product={product}
          bundlePrice={bundlePrice}
          onSellerClick={() => navigate(`/seller/${product?.sellers?.id}`)}
          onProductDetailsClick={() => setProductDetailsSheetOpen(true)}
          onVariantChange={(index, variant) => {
            setSelectedVariantFromGallery({index, variant});
          }}
          onImageIndexChange={(currentIndex, totalItems) => {
            setCurrentImageIndex(currentIndex);
            setTotalImages(totalItems);
          }}
        />
      </div>

      <div className="flex-1 overscroll-none pb-[112px]"> {/* Add bottom padding */}
        <div className="bg-white pb-20">

          




          {/* Product Description Section */}
          <div ref={descriptionRef}>
            <ProductSectionWrapper>
              <ProductDetailsTabs 
                isSheetOpen={productDetailsSheetOpen}
                onSheetOpenChange={setProductDetailsSheetOpen}
              />
            </ProductSectionWrapper>
          </div>

          {/* Search Info Component */}
          <ProductSectionWrapper>
            <SearchInfoComponent productId={productId} />
          </ProductSectionWrapper>

          {/* Recommendations Section */}
          <div ref={recommendationsRef}>
            <ProductRecommendationsWithTabs 
              hideHeader={showStickyRecommendations} 
              hideTabs={showStickyRecommendations} 
            />
          </div>

        </div>
      </div>

      {/* Sticky Checkout Bar Component */}
      <StickyCheckoutBar 
        product={{
          ...product,
          name: selectedVariantFromGallery?.variant?.name || product?.name,
          image: selectedVariantFromGallery?.variant?.image || 
                 (selectedVariantFromGallery?.variant?.product_images?.[0]?.src) || 
                 selectedColorImage,
          inventory: selectedVariantFromGallery?.variant?.stock || currentStock,
          discount: { active: !!product?.discount_price, percentage: product?.discount_price ? Math.round(((product.price - product.discount_price) / product.price) * 100) : 0 },
          variants: colorVariants.map(v => ({ name: v.name, stock: v.stock })),
          storage_variants: storageVariants.map(v => ({ name: v.capacity || v.name, price: v.price }))
        }}
        quantity={1}
        onQuantityChange={(newQuantity) => {}}
        selectedColor={selectedVariantFromGallery?.variant?.name || selectedColor}
        onColorChange={(color) => setSelectedColor(color)}
        selectedStorage={selectedStorage}
        onStorageChange={(storage) => setSelectedStorage(storage)}
        selectedNetwork={selectedNetwork}
        selectedCondition={selectedCondition}
        selectedColorImage={selectedVariantFromGallery?.variant?.image || 
                           (selectedVariantFromGallery?.variant?.product_images?.[0]?.src) || 
                           selectedColorImage}
        onBuyNow={buyNow}
        currentPrice={selectedVariantFromGallery?.variant?.price || currentPrice}
        currentStock={selectedVariantFromGallery?.variant?.stock || currentStock}
        className=""
      />
    </div>
  );
};

export default ProductDetail;