import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import VideoControls from "@/components/product/VideoControls";
import { GalleryThumbnails } from "@/components/product/GalleryThumbnails";
import ImageGalleryControls from "@/components/product/ImageGalleryControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { ArrowUpToLine } from "lucide-react";
import InfoBand from "@/components/product/InfoBand";
import PriceInfo from "@/components/product/PriceInfo";
import TabsNavigation from "@/components/home/TabsNavigation";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import VerificationBadge from "@/components/shared/VerificationBadge";
import ProductDetails from "@/components/product/ProductDetails";
import SellerInfoOverlay from "@/components/product/SellerInfoOverlay";

interface ProductImageGalleryProps {
  images: string[];
  videos?: {
    id: string;
    video_url: string;
    title?: string;
    description?: string;
    thumbnail_url?: string;
  }[];
  model3dUrl?: string;
  focusMode?: boolean;
  onFocusModeChange?: (focusMode: boolean) => void;
  seller?: {
    id: string;
    name: string;
    image_url?: string;
    verified: boolean;
    followers_count: number;
  };
  onSellerClick?: () => void;
  product?: {
    id: string;
    name: string;
    price: number;
    discount_price?: number | null;
  };
  bundlePrice?: number;
  onVariantChange?: (variantIndex: number, variant: any) => void;
  onProductDetailsClick?: () => void;
  onImageIndexChange?: (currentIndex: number, totalItems: number) => void;
}

interface GalleryItem {
  type: 'image' | 'video' | 'model3d';
  src: string;
  videoData?: any;
  index: number;
}

interface TouchPosition {
  x: number;
  y: number;
}

// Helper function to combine images, videos, and 3D models into a unified gallery
function createGalleryItems(images: string[], videos: any[] = [], model3dUrl?: string | any): GalleryItem[] {
  const items: GalleryItem[] = [];

  // Handle model3dUrl that might come as object from Supabase (can be string, object with value, or null)
  const processedModel3dUrl =
    typeof model3dUrl === 'string'
      ? model3dUrl
      : model3dUrl && typeof model3dUrl === 'object' && typeof (model3dUrl as any).value === 'string'
      ? (model3dUrl as any).value
      : null;

  // Add main image first if available
  if (images.length > 0) {
    items.push({
      type: 'image',
      src: images[0],
      index: items.length
    });
  }

  // Add 3D model second if available and valid
  if (typeof processedModel3dUrl === 'string' && processedModel3dUrl.trim() !== '') {
    items.push({
      type: 'model3d',
      src: processedModel3dUrl,
      index: items.length
    });
  }

  // Add remaining images (from index 1 onwards)
  images.slice(1).forEach((image) => {
    items.push({
      type: 'image',
      src: image,
      index: items.length
    });
  });

  // Add videos
  videos.forEach((video) => {
    items.push({
      type: 'video',
      src: video.video_url,
      videoData: video,
      index: items.length
    });
  });

  return items;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  images, 
  videos = [],
  model3dUrl,
  focusMode: externalFocusMode,
  onFocusModeChange,
  seller,
  onSellerClick,
  product,
  bundlePrice,
  onVariantChange,
  onProductDetailsClick,
  onImageIndexChange
}) => {
  // Create unified gallery items
  const galleryItems = createGalleryItems(images, videos, model3dUrl);
  
  // Debug logging for 3D model
  console.log('📷 ProductImageGallery: model3dUrl received:', model3dUrl);
  console.log('📷 ProductImageGallery: galleryItems created:', galleryItems);
  const totalItems = galleryItems.length;
  const videoIndices = galleryItems.map((item, index) => item.type === 'video' ? index : -1).filter(i => i !== -1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [isRotated, setIsRotated] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [preloadedItems, setPreloadedItems] = useState<string[]>([]);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null);
  const [thumbnailViewMode, setThumbnailViewMode] = useState<"row" | "grid">("row");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [hoveredThumbnail, setHoveredThumbnail] = useState<number | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted
  const [volume, setVolume] = useState(1);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCompareMode, setShowCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState(0);
  const [showImageInfo, setShowImageInfo] = useState(false);
  const [viewHistory, setViewHistory] = useState<number[]>([0]);
  const [imageFilter, setImageFilter] = useState<string>("none");
  const [showOtherColors, setShowOtherColors] = useState<boolean>(false);
  const [showAllControls, setShowAllControls] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"default" | "immersive">("default");

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartPosition = useRef<TouchPosition | null>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [openedThumbnailMenu, setOpenedThumbnailMenu] = useState<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  
  // Tabs navigation state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Get current item
  const currentItem = galleryItems[currentIndex];
  const isCurrentVideo = currentItem?.type === 'video';
  const isCurrentModel3D = currentItem?.type === 'model3d';

  // Debug logging
  useEffect(() => {
    console.log('Gallery items:', galleryItems);
    console.log('Current index:', currentIndex);
    console.log('Current item:', currentItem);
    console.log('Is current video:', isCurrentVideo);
  }, [galleryItems, currentIndex, currentItem, isCurrentVideo]);

  useEffect(() => {
    const preloadItems = async () => {
      const preloaded = await Promise.all(
        galleryItems.map((item) => {
          return new Promise<string>((resolve) => {
            if (item.type === 'image') {
              const img = new Image();
              img.src = item.src;
              img.onload = () => resolve(item.src);
              img.onerror = () => resolve(item.src);
            } else {
              // For videos, just resolve the URL
              resolve(item.src);
            }
          });
        })
      );
      setPreloadedItems(preloaded);
    };

    preloadItems();
  }, [galleryItems]);

  // Fixed video event listeners
  useEffect(() => {
    if (!isCurrentVideo || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const onLoadedMetadata = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBufferedTime(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onError = (e: Event) => {
      console.error('Video error:', e);
      // Don't crash the component on video error
    };

    try {
      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('progress', onProgress);
      video.addEventListener('error', onError);

      return () => {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('progress', onProgress);
        video.removeEventListener('error', onError);
      };
    } catch (error) {
      console.error('Error setting up video event listeners:', error);
    }
  }, [isCurrentVideo, currentIndex]); // Added currentIndex as dependency

  const onApiChange = useCallback((api: CarouselApi | null) => {
    if (!api) return;

    setApi(api);
    const index = api.selectedScrollSnap();
    setCurrentIndex(index);
    onImageIndexChange?.(index, totalItems);

    api.on("select", () => {
      const newIndex = api.selectedScrollSnap();
      setCurrentIndex(newIndex);
      onImageIndexChange?.(newIndex, totalItems);
      setIsRotated(0);
      setIsFlipped(false);
      setZoomLevel(1);
      setIsPlaying(false); // Reset video playing state
      setCurrentTime(0);
      setDuration(0);
      setBufferedTime(0);

      setViewHistory(prev => [...prev, newIndex]);
    });
  }, [onImageIndexChange, totalItems]);

  const handleThumbnailClick = useCallback((index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  }, [api]);

  const handlePrevious = useCallback(() => {
    if (api) api.scrollPrev();
  }, [api]);

  const handleNext = useCallback(() => {
    if (api) api.scrollNext();
  }, [api]);

  const handleRotate = useCallback(() => {
    setIsRotated(prev => (prev + 90) % 360);
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const downloadItem = useCallback((index: number) => {
    const item = galleryItems[index];
    const link = document.createElement('a');
    link.href = item.src;
    link.download = `product-${item.type}-${index + 1}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: `${item.type === 'video' ? 'Video' : 'Image'} downloaded`,
      description: `${item.type === 'video' ? 'Video' : 'Image'} ${index + 1} has been downloaded`,
      duration: 2000,
    });
  }, [galleryItems]);

  const copyItemUrl = useCallback((index: number) => {
    const item = galleryItems[index];
    navigator.clipboard.writeText(item.src);

    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);

    toast({
      title: `${item.type === 'video' ? 'Video' : 'Image'} URL copied`,
      description: `${item.type === 'video' ? 'Video' : 'Image'} URL has been copied to clipboard`,
      duration: 2000,
    });
  }, [galleryItems]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreenMode(prev => !prev);

    if (!isFullscreenMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isFullscreenMode]);

  const toggleFocusMode = useCallback(() => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    onFocusModeChange?.(newFocusMode);
  }, [focusMode, onFocusModeChange]);

  // Sync external focus mode with internal state
  useEffect(() => {
    if (externalFocusMode !== undefined && externalFocusMode !== focusMode) {
      setFocusMode(externalFocusMode);
    }
  }, [externalFocusMode, focusMode]);

  // Auto-enable focus mode when viewing 3D model
  useEffect(() => {
    if (isCurrentModel3D && !focusMode) {
      setFocusMode(true);
      onFocusModeChange?.(true);
    }
  }, [isCurrentModel3D, focusMode, onFocusModeChange]);

  const handleImageClick = useCallback(() => {
    if (focusMode) {
      setFocusMode(false);
      onFocusModeChange?.(false);
    } else if (!isCurrentVideo && !isCurrentModel3D) {
      toggleFocusMode();
    }
  }, [focusMode, onFocusModeChange, toggleFocusMode, isCurrentVideo, isCurrentModel3D]);

  // Video control handlers
  const handleMuteToggle = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min((videoRef.current.currentTime || 0) + 10, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max((videoRef.current.currentTime || 0) - 10, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleFullscreenVideo = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((error) => {
          console.error('Error playing video:', error);
        });
      }
    }
  };

  const toggleAutoScroll = useCallback(() => {
    setAutoScrollEnabled(prev => !prev);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenMode) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreenMode, toggleFullscreen]);

  useEffect(() => {
    if (autoScrollEnabled && api) {
      const interval = setInterval(() => {
        api.scrollNext();
      }, 3000);

      setAutoScrollInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else if (!autoScrollEnabled && autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }

    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [autoScrollEnabled, api]);

  if (totalItems === 0) {
    return (
      <div className="flex flex-col bg-transparent">
        <div className="relative w-full aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500">No images or videos available</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col bg-transparent w-full max-w-full overflow-x-hidden">
      <div className="relative w-full aspect-square overflow-hidden max-w-full">
        <Carousel
          className="w-full h-full"
          opts={{
            loop: totalItems > 1,
          }}
          setApi={onApiChange}
        >
          <CarouselContent className="h-full">
            {galleryItems.map((item, index) => (
              <CarouselItem key={`${item.type}-${index}`} className="h-full">
                <div className="flex h-full w-full items-center justify-center overflow-hidden relative">
                  {item.type === 'model3d' ? (
  <div
    className="square-wrapper"
    style={{ position: "relative", width: "100%", paddingBottom: "100%" }}
  >
    <iframe
      title="3D Model"
      frameBorder="0"
      allowFullScreen
      allow="autoplay; fullscreen; xr-spatial-tracking"
      src={item.src}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        border: 0,
      }}
    ></iframe>
  </div> ) : item.type === 'video' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        ref={index === currentIndex ? videoRef : undefined}
                        src={item.src}
                        className="w-full h-full object-contain cursor-pointer"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          aspectRatio: '1/1', 
                          objectFit: 'cover' 
                        }}
                        onClick={toggleVideo}
                        playsInline
                        loop
                        muted={isMuted}
                        autoPlay={false}
                        poster={item.videoData?.thumbnail_url}
                        preload="metadata"
                        onError={(e) => {
                          console.error('Video loading error:', e);
                          // You might want to show a fallback image here
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      {index === currentIndex && isCurrentVideo && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="pointer-events-auto h-full w-full flex items-end">
                            <VideoControls
                              isPlaying={isPlaying}
                              isMuted={isMuted}
                              volume={volume}
                              onPlayPause={toggleVideo}
                              onMuteToggle={handleMuteToggle}
                              onVolumeChange={handleVolumeChange}
                              currentTime={currentTime}
                              duration={duration}
                              bufferedTime={bufferedTime}
                              onSeek={handleSeek}
                              onSkipForward={handleSkipForward}
                              onSkipBackward={handleSkipBackward}
                              onFullscreenToggle={handleFullscreenVideo}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <img
                      ref={index === currentIndex ? imageRef : undefined}
                      src={item.src}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-contain transition-transform"
                      style={{
                        transform: `
                          rotate(${isRotated}deg)
                          ${isFlipped ? 'scaleX(-1)' : ''}
                          scale(${zoomLevel})
                        `,
                        transition: "transform 0.2s ease-out",
                        filter: imageFilter !== "none"
                          ? imageFilter === "grayscale" ? "grayscale(1)"
                            : imageFilter === "sepia" ? "sepia(0.7)"
                              : imageFilter === "brightness" ? "brightness(1.2)"
                                : imageFilter === "contrast" ? "contrast(1.2)"
                                  : "none"
                          : "none"
                      }}
                      draggable={false}
                      onClick={handleImageClick}
                      onError={(e) => {
                        console.error('Image loading error:', e);
                        // You might want to show a fallback image here
                      }}
                    />
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Show gallery controls for both images and videos */}
          <PriceInfo
            product={product && (product as any).variants && (product as any).variants.length > 0 ? {
              ...product,
              price: (product as any).variants[selectedVariantIndex]?.price || product.price,
              discount_price: (product as any).variants[selectedVariantIndex]?.discount_price || product.discount_price
            } : product}
            bundlePrice={bundlePrice}
            focusMode={focusMode}
            isPlaying={isCurrentVideo ? isPlaying : false}
          />
          
          {/* Seller Info - Bottom Left */}
          <SellerInfoOverlay 
            seller={seller}
            onSellerClick={onSellerClick}
            focusMode={focusMode}
            isPlaying={isCurrentVideo && isPlaying}
          />

          {/* Product Details - Bottom Right */}
          {!(focusMode || (isCurrentVideo && isPlaying)) && (
            <ProductDetails onProductDetailsClick={onProductDetailsClick} />
          )}
          
        </Carousel>
      </div>

      <InfoBand />

      {/* Tabs Navigation */}
      {totalItems > 1 && (
        <div className="w-screen -mx-4 bg-white">
          <TabsNavigation
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'variants', label: 'Variants' },
              { id: 'reviews', label: 'Reviews' }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            edgeToEdge={true}
            style={{ backgroundColor: 'white' }}
          />
        </div>
      )}

      {/* Thumbnails - Always show when there's more than 1 item OR when there's a 3D model */}
      {(totalItems > 1 || galleryItems.some(item => item.type === 'model3d')) && (
        <div className="mt-1 w-full">
          {activeTab === 'overview' && (
            <GalleryThumbnails
              images={galleryItems.map(item => item.src)}
              currentIndex={currentIndex}
              onThumbnailClick={handleThumbnailClick}
              isPlaying={isPlaying}
              videoIndices={videoIndices}
              galleryItems={galleryItems}
            />
          )}
          {activeTab === 'variants' && (
            <div className="space-y-3">
              {/* Selected Variant Title */}
              {product && (product as any).variants && (product as any).variants.length > 0 && (
                <>
                  {/* Selected Variant Info */}
                  <div className="px-2 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{(product as any).variants[selectedVariantIndex]?.name}</h3>
                      {(product as any).variants[selectedVariantIndex]?.bestseller && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Best Seller</span>
                      )}
                      {(product as any).variants[selectedVariantIndex]?.limited && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Limited Edition</span>
                      )}
                    </div>
                    {(product as any).variants[selectedVariantIndex]?.stock !== undefined && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span>{(product as any).variants[selectedVariantIndex]?.stock > 0 ? `${(product as any).variants[selectedVariantIndex]?.stock} in stock` : 'Out of stock'}</span>
                        <span className="text-sm font-bold text-red-500">${(product as any).variants[selectedVariantIndex]?.price}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Variant Thumbnails */}
                  <div className="flex gap-3 overflow-x-auto pb-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {(product as any).variants.map((variant: any, index: number) => {
                      const variantMainImage = variant.image || 
                        (variant.product_images && variant.product_images[0]?.src) ||
                        (galleryItems[0]?.src);
                      const isSelected = selectedVariantIndex === index;

                      return (
                         <div key={variant.id} className="flex-shrink-0 w-20 cursor-pointer" 
                             onClick={() => {
                               setSelectedVariantIndex(index);
                               // Notify parent component about variant change
                               onVariantChange?.(index, variant);
                               // Find variant's main image in gallery and switch to it
                               if (variantMainImage) {
                                 const mainGalleryIndex = galleryItems.findIndex(item => item.src === variantMainImage);
                                 if (mainGalleryIndex !== -1) {
                                   handleThumbnailClick(mainGalleryIndex);
                                   setActiveTab('overview'); // Switch back to overview tab
                                 }
                               }
                             }}>
                          
                          {/* Thumbnail image */}
                          <div className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-sm ${
                            isSelected 
                              ? 'border-[#FF4747] shadow-md ring-2 ring-[#FF4747]/20' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            
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
                            
                            <img
                              src={variantMainImage}
                              alt={variant.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Variant image loading error:', e);
                              }}
                            />
                            
                            {/* Stock indicator */}
                            {variant.stock !== undefined && variant.stock < 10 && variant.stock > 0 && (
                              <div className="absolute bottom-1 right-1 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded">
                                {variant.stock}
                              </div>
                            )}
                            
                            {/* Out of stock overlay */}
                            {variant.stock === 0 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="bg-white text-black text-[8px] px-1 py-0.5 rounded">
                                  Sold Out
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="flex flex-wrap gap-2 p-2">
              <div className="text-gray-500 text-sm">Review photos from buyers will be displayed here</div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Mode */}
      {isFullscreenMode && (
        <div 
          ref={fullscreenRef}
          className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-fade-in"
          onClick={toggleFullscreen}
        >
          <button 
            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
            onClick={toggleFullscreen}
          >
            <ArrowUpToLine className="h-5 w-5" />
          </button>

          {isCurrentVideo ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={currentItem.src}
                className="max-w-[90%] max-h-[90%] object-contain"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVideo();
                }}
                playsInline
                loop
                muted={isMuted}
                autoPlay={false}
                style={{ background: "black" }}
                controls={false}
                onError={(e) => {
                  console.error('Fullscreen video loading error:', e);
                }}
              >
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 pointer-events-none">
                <div className="pointer-events-auto h-full w-full flex items-end">
                  <VideoControls
                    isPlaying={isPlaying}
                    isMuted={isMuted}
                    volume={volume}
                    onPlayPause={toggleVideo}
                    onMuteToggle={handleMuteToggle}
                    onVolumeChange={handleVolumeChange}
                    currentTime={currentTime}
                    duration={duration}
                    bufferedTime={bufferedTime}
                    onSeek={handleSeek}
                    onSkipForward={handleSkipForward}
                    onSkipBackward={handleSkipBackward}
                    onFullscreenToggle={handleFullscreenVideo}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <img 
                src={currentItem.src} 
                alt={`Product fullscreen image ${currentIndex + 1}`} 
                className="max-w-[90%] max-h-[90%] object-contain"
                style={{
                  transform: `
                    rotate(${isRotated}deg)
                    ${isFlipped ? 'scaleX(-1)' : ''}
                    scale(${zoomLevel})
                  `,
                  filter: imageFilter !== "none"
                    ? imageFilter === "grayscale" ? "grayscale(1)"
                      : imageFilter === "sepia" ? "sepia(0.7)"
                        : imageFilter === "brightness" ? "brightness(1.2)"
                          : imageFilter === "contrast" ? "contrast(1.2)"
                            : "none"
                    : "none"
                }}
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error('Fullscreen image loading error:', e);
                }}
              />
              <ImageGalleryControls
                currentIndex={currentIndex}
                totalImages={totalItems}
                isRotated={isRotated}
                isFlipped={isFlipped}
                autoScrollEnabled={autoScrollEnabled}
                focusMode={focusMode}
                variant="fullscreen"
                seller={seller}
                onRotate={(e) => {
                  if (e) e.stopPropagation();
                  handleRotate();
                }}
                onFlip={(e) => {
                  if (e) e.stopPropagation();
                  handleFlip();
                }}
                onToggleAutoScroll={toggleAutoScroll}
                onToggleFocusMode={toggleFocusMode}
                onPrevious={(e) => {
                  if (e) e.stopPropagation();
                  handlePrevious();
                }}
                onNext={(e) => {
                  if (e) e.stopPropagation();
                  handleNext();
                }}
                onDownload={(e) => {
                  if (e) e.stopPropagation();
                  downloadItem(currentIndex);
                }}
                onSellerClick={onSellerClick}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;