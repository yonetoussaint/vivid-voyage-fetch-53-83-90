import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { updateProduct, type Product } from '@/integrations/supabase/products';
import { useProduct } from '@/hooks/useProduct';
import { toast } from 'sonner';
import VariantsEditPage, { type Variant } from '@/components/seller/ProductEditSteps/NewVariantsEditPage';

const ProductEditVariantPage: React.FC = () => {
  const { productId, variantId } = useParams<{ productId: string; variantId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, refetch } = useProduct(productId || '');
  const [isUpdating, setIsUpdating] = useState(false);

  console.log('ProductEditVariantPage - productId:', productId, 'variantId:', variantId);

  // Initialize with the existing variant or a new one
  const [formData, setFormData] = useState({
    variants: [{
      id: Date.now().toString(),
      name: '',
      price: 0,
      stock: 0,
      image: undefined,
      bestseller: false,
      limited: false,
      active: true,
      product_images: [],
      product_videos: []
    }] as Variant[],
  });

  useEffect(() => {
    if (product && variantId) {
      // Editing existing variant
      const existingVariant = (product.variants as Variant[])?.find(v => v.id === variantId);
      if (existingVariant) {
        setFormData({
          variants: [existingVariant]
        });
      } else {
        console.error('Variant not found:', variantId);
        toast.error('Variant not found');
        navigate(`/product/${productId}/edit/variants`);
      }
    }
  }, [product, variantId, productId, navigate]);

  const handleInputChange = (field: string, value: any) => {
    console.log('ProductEditVariantPage - Input change:', field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!product || !formData.variants[0]) {
      toast.error('Please fill in variant information');
      return;
    }

    const variant = formData.variants[0];
    if (!variant.name || !variant.name.trim()) {
      toast.error('Please enter a variant name');
      return;
    }

    setIsUpdating(true);

    try {
      const existingVariants = Array.isArray(product.variants) ? product.variants : [];
      
      const variantToSave = {
        id: variant.id,
        name: variant.name,
        price: variant.price || 0,
        stock: variant.stock || 0,
        image: variant.image,
        bestseller: variant.bestseller || false,
        limited: variant.limited || false,
        active: variant.active !== false,
        product_images: variant.product_images || [],
        product_videos: variant.product_videos || []
      };
      
      let updatedVariants;
      if (variantId) {
        // Update existing variant
        updatedVariants = existingVariants.map(v => 
          v.id === variantId ? variantToSave : v
        );
      } else {
        // Add new variant
        updatedVariants = [...existingVariants, variantToSave];
      }
      
      const updateData: Partial<Product> = {
        variants: updatedVariants
      };
      
      await updateProduct(product.id, updateData);
      await refetch();
      
      toast.success(variantId ? 'Variant updated successfully' : 'New variant added successfully');
      navigate(`/product/${productId}/edit/variants`);
    } catch (error) {
      console.error('Error saving variant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save variant');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Product not found</p>
            <button
              onClick={() => navigate(`/product/${productId}/edit/variants`)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Variants
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isEditing = !!variantId;

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col h-screen">
      {/* Header */}
      <div className="bg-background p-4 border-b border-border">
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => navigate(`/product/${productId}/edit/variants`)}
            className="absolute left-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">
              {isEditing ? 'Edit Variant' : 'Add New Variant'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? 'Update variant details' : 'Create a new variant'}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="absolute right-0 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors border border-primary hover:border-primary/80 disabled:border-muted-foreground rounded-md flex items-center gap-1"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                {isEditing ? 'Update' : 'Create'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <VariantsEditPage
          formData={formData}
          onInputChange={handleInputChange}
        />
      </div>

      {/* Bottom Action */}
      <div className="bg-background border-t border-border p-4">
        <button
          onClick={handleSubmit}
          disabled={isUpdating}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-colors flex items-center justify-center gap-2"
        >
          {isUpdating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {isEditing ? 'Updating Variant...' : 'Creating Variant...'}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {isEditing ? 'Update Variant' : 'Create Variant'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductEditVariantPage;