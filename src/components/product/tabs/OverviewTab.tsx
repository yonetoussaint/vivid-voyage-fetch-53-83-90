import React from 'react';
import DynamicDescription from '../DynamicDescription';
import { Product } from '@/types/product';

interface OverviewTabProps {
  product: Product;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ product }) => {
  return (
    <div className="w-full space-y-6 py-4">
      <div className="w-full">
        {product?.description ? (
          <DynamicDescription 
            content={product.description} 
            product={product}
            className="w-full text-gray-600 leading-relaxed mb-4"
          />
        ) : (
          <p className="w-full text-gray-600 leading-relaxed mb-4">
            Experience premium quality with {product?.name || 'this product'}. This exceptional item combines cutting-edge features 
            with reliable performance, delivering outstanding value for both personal and professional use.
          </p>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;