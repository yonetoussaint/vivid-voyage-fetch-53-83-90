import React, { useState } from 'react';
import { Upload, Trash2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface VariantsEditPageProps {
  formData: {
    variants: Variant[];
  };
  onInputChange: (field: string, value: any) => void;
  onNavigationChange?: (context: { 
    canGoBack: boolean; 
    onBack: () => void; 
    title: string; 
    subtitle?: string;
  } | null) => void;
}

const VariantsEditPage: React.FC<VariantsEditPageProps> = ({
  formData,
  onInputChange
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [uploadingVideos, setUploadingVideos] = useState<string[]>([]);

  const variant = formData.variants[0];
  if (!variant) return null;

  const uploadFile = async (file: File, isVideo = false): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const folder = isVideo ? 'product-videos' : 'product-images';

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(`${fileName}`, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(`Failed to upload ${isVideo ? 'video' : 'image'}`);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(`${fileName}`);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${isVideo ? 'video' : 'image'}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleMainImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, false);
    if (url) {
      const updatedVariant = { ...variant, image: url };
      onInputChange('variants', [updatedVariant]);
      toast.success('Main image uploaded successfully');
    }
  };

  const handleProductImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: { id: string; src: string; alt?: string }[] = [];
    
    for (const file of Array.from(files)) {
      const imageId = `img-${Date.now()}-${Math.random()}`;
      setUploadingImages(prev => [...prev, imageId]);
      
      const url = await uploadFile(file, false);
      if (url) {
        newImages.push({
          id: imageId,
          src: url,
          alt: variant.name
        });
      }
      
      setUploadingImages(prev => prev.filter(id => id !== imageId));
    }

    if (newImages.length > 0) {
      const updatedVariant = {
        ...variant,
        product_images: [...(variant.product_images || []), ...newImages]
      };
      onInputChange('variants', [updatedVariant]);
      toast.success(`${newImages.length} image(s) uploaded successfully`);
    }
  };

  const handleProductVideosUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newVideos: { id: string; video_url: string; title?: string; description?: string }[] = [];
    
    for (const file of Array.from(files)) {
      const videoId = `vid-${Date.now()}-${Math.random()}`;
      setUploadingVideos(prev => [...prev, videoId]);
      
      const url = await uploadFile(file, true);
      if (url) {
        newVideos.push({
          id: videoId,
          video_url: url,
          title: file.name
        });
      }
      
      setUploadingVideos(prev => prev.filter(id => id !== videoId));
    }

    if (newVideos.length > 0) {
      const updatedVariant = {
        ...variant,
        product_videos: [...(variant.product_videos || []), ...newVideos]
      };
      onInputChange('variants', [updatedVariant]);
      toast.success(`${newVideos.length} video(s) uploaded successfully`);
    }
  };

  const handleVariantUpdate = (field: string, value: any) => {
    const updatedVariant = { ...variant, [field]: value };
    onInputChange('variants', [updatedVariant]);
  };

  const removeProductImage = (imageId: string) => {
    const updatedImages = variant.product_images?.filter(img => img.id !== imageId) || [];
    const updatedVariant = { ...variant, product_images: updatedImages };
    onInputChange('variants', [updatedVariant]);
  };

  const removeProductVideo = (videoId: string) => {
    const updatedVideos = variant.product_videos?.filter(vid => vid.id !== videoId) || [];
    const updatedVariant = { ...variant, product_videos: updatedVideos };
    onInputChange('variants', [updatedVariant]);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 p-4 min-h-screen bg-background">
      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Basic Information</h2>
        
        <div>
          <Label className="text-sm font-medium block mb-2">Variant Name</Label>
          <Input
            value={variant.name}
            onChange={(e) => handleVariantUpdate('name', e.target.value)}
            placeholder="e.g., Space Gray, 64GB, etc."
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium block mb-2">Price ($)</Label>
            <Input
              type="number"
              value={variant.price || 0}
              onChange={(e) => handleVariantUpdate('price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <Label className="text-sm font-medium block mb-2">Stock</Label>
            <Input
              type="number"
              value={variant.stock || 0}
              onChange={(e) => handleVariantUpdate('stock', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full"
              min="0"
            />
          </div>
        </div>

        {/* Variant Flags */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bestseller"
              checked={variant.bestseller || false}
              onCheckedChange={(checked) => handleVariantUpdate('bestseller', checked)}
            />
            <Label htmlFor="bestseller" className="text-sm">
              Mark as Bestseller
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="limited"
              checked={variant.limited || false}
              onCheckedChange={(checked) => handleVariantUpdate('limited', checked)}
            />
            <Label htmlFor="limited" className="text-sm">
              Limited Edition
            </Label>
          </div>
        </div>
      </div>

      {/* Main Image */}
      <div>
        <Label className="text-sm font-medium block mb-2">Main Image</Label>
        <div className="space-y-2">
          {variant.image && (
            <div className="relative w-24 h-24 rounded border">
              <img 
                src={variant.image} 
                alt={variant.name} 
                className="w-full h-full object-cover rounded"
              />
              <button
                onClick={() => handleVariantUpdate('image', undefined)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageUpload}
              className="hidden"
              id="main-image-upload"
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('main-image-upload')?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : variant.image ? 'Change Image' : 'Upload Image'}
            </Button>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div>
        <Label className="text-sm font-medium block mb-2">Product Images</Label>
        <div className="space-y-2">
          {variant.product_images && variant.product_images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {variant.product_images.map((image) => (
                <div key={image.id} className="relative">
                  <img 
                    src={image.src} 
                    alt={image.alt || variant.name} 
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => removeProductImage(image.id)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {uploadingImages.map(id => (
            <div key={id} className="w-full h-20 bg-muted rounded border flex items-center justify-center">
              <div className="text-xs text-muted-foreground">Uploading...</div>
            </div>
          ))}
          
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleProductImagesUpload}
              className="hidden"
              id="product-images-upload"
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('product-images-upload')?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product Images
            </Button>
          </div>
        </div>
      </div>

      {/* Product Videos */}
      <div>
        <Label className="text-sm font-medium block mb-2">Product Videos</Label>
        <div className="space-y-2">
          {variant.product_videos && variant.product_videos.length > 0 && (
            <div className="space-y-2">
              {variant.product_videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-2 bg-muted rounded border">
                  <span className="text-sm truncate flex-1">{video.title || 'Video'}</span>
                  <button
                    onClick={() => removeProductVideo(video.id)}
                    className="ml-2 text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {uploadingVideos.map(id => (
            <div key={id} className="p-2 bg-muted rounded border">
              <div className="text-xs text-muted-foreground">Uploading video...</div>
            </div>
          ))}
          
          <div>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleProductVideosUpload}
              className="hidden"
              id="product-videos-upload"
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('product-videos-upload')?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product Videos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantsEditPage;