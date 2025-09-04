import React, { useState, useMemo } from 'react';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useProductReviews } from '@/hooks/useProductReviews';
import { Button } from '@/components/ui/button';
import WriteReviewDialog from './WriteReviewDialog';
import { useAuth } from '@/context/RedirectAuthContext';
import { useAuthOverlay } from '@/context/AuthOverlayContext';

interface CustomerReviewsProps {
  productId?: string;
  limit?: number;
}

const CustomerReviews = ({ productId: propProductId, limit }: CustomerReviewsProps = {}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const DEFAULT_PRODUCT_ID = "280df32f-5ec2-4d65-af11-6be19a40cc77";
  const { user } = useAuth();
  const { openAuthOverlay } = useAuthOverlay();
  
  const productId = propProductId || paramId || DEFAULT_PRODUCT_ID;
  const [likedComments, setLikedComments] = useState(new Set());
  
  // Fetch real data from database
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(productId);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    return `${Math.floor(diffDays / 30)}mo`;
  };
  
  // Sort reviews by most recent (TikTok style)
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [reviews]);
  
  const finalReviews = limit ? sortedReviews.slice(0, limit) : sortedReviews;
  
  const toggleLike = (reviewId: string) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (reviewsLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
            <div className="w-6 h-6 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header with comment count - TikTok style */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">
          {reviews.length} comment{reviews.length !== 1 ? 's' : ''}
        </h3>
        {user ? (
          <WriteReviewDialog productId={productId}>
            <Button variant="ghost" size="sm" className="text-xs">
              Add comment
            </Button>
          </WriteReviewDialog>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs" 
            onClick={openAuthOverlay}
          >
            Sign in to comment
          </Button>
        )}
      </div>

      {/* Comments List - TikTok style */}
      <div className="space-y-3">
        {finalReviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No comments yet.</p>
            <p className="text-gray-400 text-xs mt-1">Be the first to comment!</p>
          </div>
        ) : (
          finalReviews.map((review) => (
            <div key={review.id} className="flex items-start gap-3 group">
              {/* Profile Picture */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${getAvatarColor(review.user_name)}`}>
                {review.user_name.charAt(0).toUpperCase()}
              </div>
              
              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {review.user_name}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatDate(review.created_at)}
                  </span>
                  {review.verified_purchase && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-900 leading-relaxed break-words">
                  {review.comment || review.title || 'Great product!'}
                </p>
                
                {/* Reply button - TikTok style */}
                <button className="text-xs text-gray-500 hover:text-gray-700 mt-1 transition-colors">
                  Reply
                </button>
              </div>
              
              {/* Like Button - TikTok style */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleLike(review.id)}
                  className={`p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                    likedComments.has(review.id) 
                      ? 'text-red-500' 
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart 
                    className={`w-5 h-5 transition-all duration-200 ${
                      likedComments.has(review.id) ? 'fill-current' : ''
                    }`} 
                  />
                </button>
                <span className="text-xs text-gray-500 font-medium">
                  {likedComments.has(review.id) 
                    ? (review.helpful_count || 0) + 1 
                    : review.helpful_count || 0
                  }
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View more comments - TikTok style */}
      {limit && reviews.length > limit && (
        <button 
          className="text-sm text-gray-500 hover:text-gray-700 mt-4 transition-colors"
          onClick={() => window.location.href = `/product/${productId}/reviews`}
        >
          View all {reviews.length} comments
        </button>
      )}
    </div>
  );
};

export default CustomerReviews;