import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Edit, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  bestseller?: boolean;
  limited?: boolean;
  active?: boolean;
  product_images?: {
    id: string;
    src: string;
    alt?: string;
  }[];
  product_videos?: {
    id: string;
    video_url: string;
    title?: string;
    description?: string;
  }[];
}

interface VariantsListProps {
  variants: Variant[];
  productId?: string;
  onDeleteVariant?: (variantId: string) => void;
  onToggleActive?: (variantId: string, active: boolean) => void;
}

export const VariantsList: React.FC<VariantsListProps> = ({ 
  variants, 
  productId, 
  onDeleteVariant, 
  onToggleActive 
}) => {
  const navigate = useNavigate();
  const [expandedVariants, setExpandedVariants] = useState<{ [key: string]: boolean }>({});

  const handleToggleActive = (variantId: string, active: boolean) => {
    if (onToggleActive) {
      onToggleActive(variantId, active);
    } else {
      console.warn('onToggleActive function not provided');
    }
  };

  const handleDeleteVariant = (variantId: string, variantName: string) => {
    if (window.confirm(`Are you sure you want to delete the ${variantName} variant?`)) {
      console.log('Delete variant:', variantId);
      if (onDeleteVariant) {
        onDeleteVariant(variantId);
      } else {
        console.warn('onDeleteVariant function not provided. Implement this function in the parent component to handle deletion.');
      }
    }
  };

  const toggleVariantExpansion = (variantId: string) => {
    setExpandedVariants(prev => ({ ...prev, [variantId]: !prev[variantId] }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (variants.length === 0) {
    return (
      <div className="w-full">
        <div className="p-2 border-b border-border">
          <p className="text-sm text-muted-foreground">Add different variants for your product to give customers more choices</p>
        </div>

        <div className="space-y-2 p-1 w-full">
          <div className="text-center py-4">
            <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Create your first variant to get started</p>

            {/* Add New Variant Button */}
            {productId && (
              <Button 
                onClick={() => {
                  console.log('VariantsList: Add New Variant clicked, productId:', productId);
                  console.log('VariantsList: Navigating to:', `/product/${productId}/edit/variants/new`);
                  navigate(`/product/${productId}/edit/variants/new`);
                }} 
                className="w-full mb-4" 
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Variant
              </Button>
            )}
            {!productId && (
              <div className="text-xs text-destructive mt-2">Product ID missing</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-2 w-full">
        {variants.map((variant, index) => (
          <div key={variant.id}>
            {index > 0 && <hr className="border-border my-2" />}

            <div className="p-1">
              {/* Variant Header */}
              <div 
                className="flex items-center gap-3 mb-2 cursor-pointer hover:bg-muted/50 -m-1 p-1 rounded"
                onClick={() => toggleVariantExpansion(variant.id)}
              >
                <div className="flex items-center gap-2">
                  {variant.image ? (
                    <img 
                      src={variant.image} 
                      alt={variant.name}
                      className="w-8 h-8 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-border bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {variant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-base">{variant.name || 'Unnamed Variant'}</h3>
                    {variant.bestseller && (
                      <Badge variant="secondary" className="text-xs">
                        Bestseller
                      </Badge>
                    )}
                    {variant.limited && (
                      <Badge variant="destructive" className="text-xs">
                        Limited
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>{formatPrice(variant.price)}</span>
                    <span>Stock: {variant.stock}</span>
                    {variant.product_images && variant.product_images.length > 0 && (
                      <span>{variant.product_images.length} image{variant.product_images.length !== 1 ? 's' : ''}</span>
                    )}
                    {variant.product_videos && variant.product_videos.length > 0 && (
                      <span>{variant.product_videos.length} video{variant.product_videos.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={variant.active !== false}
                    onCheckedChange={(checked) => handleToggleActive(variant.id, checked)}
                    className="mr-1"
                  />
                  {productId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${productId}/edit/variants/${variant.id}`);
                      }}
                      className="p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {productId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVariant(variant.id, variant.name);
                      }}
                      className="p-2 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Variant Details - Show when expanded */}
              {expandedVariants[variant.id] && (
                <div className="space-y-1 ml-10">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <span className="ml-2 font-medium">{formatPrice(variant.price)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock:</span>
                        <span className="ml-2 font-medium">{variant.stock}</span>
                      </div>
                    </div>
                    
                    {variant.product_images && variant.product_images.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Product Images:</p>
                        <div className="flex gap-2 flex-wrap">
                          {variant.product_images.slice(0, 4).map((img) => (
                            <img
                              key={img.id}
                              src={img.src}
                              alt={img.alt || variant.name}
                              className="w-12 h-12 object-cover rounded border"
                            />
                          ))}
                          {variant.product_images.length > 4 && (
                            <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                              +{variant.product_images.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {variant.product_videos && variant.product_videos.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Product Videos:</p>
                        <div className="flex gap-2 flex-wrap">
                          {variant.product_videos.slice(0, 2).map((video) => (
                            <div key={video.id} className="flex items-center gap-2 text-xs bg-background rounded p-2 border">
                              <span>{video.title || 'Video'}</span>
                            </div>
                          ))}
                          {variant.product_videos.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{variant.product_videos.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add New Variant Button */}
        {productId && (
          <Button 
            onClick={() => {
              console.log('VariantsList: Add New Variant clicked (bottom), productId:', productId);
              console.log('VariantsList: Navigating to:', `/product/${productId}/edit/variants/new`);
              navigate(`/product/${productId}/edit/variants/new`);
            }} 
            className="w-full mt-4" 
            size="lg"
            variant="outline"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Variant
          </Button>
        )}
        {!productId && (
          <div className="text-xs text-destructive mt-4">Product ID missing</div>
        )}
      </div>
    </div>
  );
};