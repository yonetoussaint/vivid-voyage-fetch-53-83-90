import React from 'react';
import ProductReviews from '../ProductReviews';

interface ReviewsTabProps {
  productId: string;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ productId }) => {
  return (
    <div className="w-full py-4">
      <ProductReviews productId={productId} limit={10} />
    </div>
  );
};

export default ReviewsTab;