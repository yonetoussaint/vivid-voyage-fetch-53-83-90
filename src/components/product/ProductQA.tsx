import React, { useState, useMemo } from 'react';
import { MessageCircle, Heart, ChevronDown, Sparkles, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductQA } from '@/hooks/useProductQA';
import { useToast } from '@/hooks/use-toast';
import VerificationBadge from '@/components/shared/VerificationBadge';
import QuestionSubmissionDialog from './QuestionSubmissionDialog';
import AskAISheet from './AskAISheet';

// Main Questions & Answers Component
const QuestionsAnswers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showAskAISheet, setShowAskAISheet] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: productId } = useParams();
  
  const { qaItems: allQAItems, seller, isLoading, error, incrementHelpful, incrementQuestionLikes, refetch } = useProductQA(productId || '');

  // Filter Q&A items based on search
  const filteredQAItems = useMemo(() => {
    if (!searchQuery.trim()) return allQAItems;
    return allQAItems.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.answer && item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, allQAItems]);

  const qaItems = filteredQAItems;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleAskQuestionClick = () => {
    setShowAskAISheet(true);
  };

  const handleLikeQuestion = async (qaId: string) => {
    await incrementQuestionLikes(qaId);
    toast({
      title: "Question liked!",
      description: "Your like has been added to this question.",
    });
  };

  const renderSellerName = (answeredBy: string | null) => {
    if (!answeredBy) return null;
    
    // Check if the answerer is the seller
    const isSeller = seller && answeredBy === seller.name;
    
    return (
      <span className="flex items-center gap-1">
        <span>Answered by {answeredBy}</span>
        {isSeller && seller.verified && (
          <VerificationBadge size="xs" />
        )}
      </span>
    );
  };

  const handleHelpfulAnswer = async (qaId: string) => {
    await incrementHelpful(qaId);
    toast({
      title: "Thanks for your feedback!",
      description: "Your feedback helps other customers.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Q&As</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pb-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Q&As</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Failed to load Q&As. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Show limited view or full view based on prop
  const displayedQAs = qaItems.slice(0, 2);
  const hasMoreQAs = qaItems.length > 2;

  const handleViewAllQAs = () => {
    navigate(`/product/${productId}/qa`);
  };

  // Render Main Q&A View
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Q&As</h3>
        <div className="flex gap-2">
          <button 
            className="bg-blue-100 hover:bg-blue-200 transition-colors px-4 py-2 rounded-full text-blue-600 font-medium text-sm flex items-center gap-1"
            onClick={handleAskQuestionClick}
          >
            <Sparkles className="w-3 h-3" />
            Ask AI
          </button>
          <button 
            className="bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-2 rounded-full text-gray-600 font-medium text-sm flex items-center gap-1"
            onClick={() => setShowQuestionDialog(true)}
          >
            <Plus className="w-3 h-3" />
            Ask Question
          </button>
        </div>
      </div>

      {/* Limited Questions Display */}
      <div className="space-y-4">
        {displayedQAs.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h4>
            <p className="text-gray-500 mb-4">Be the first to ask about this product!</p>
            <div className="flex gap-2 justify-center">
              <button 
                className="bg-blue-100 hover:bg-blue-200 transition-colors px-4 py-2 rounded-full text-blue-600 font-medium text-sm flex items-center gap-1"
                onClick={handleAskQuestionClick}
              >
                <Sparkles className="w-3 h-3" />
                Ask AI Assistant
              </button>
              <button 
                className="bg-orange-500 hover:bg-orange-600 transition-colors px-4 py-2 rounded-full text-white font-medium text-sm flex items-center gap-1"
                onClick={() => setShowQuestionDialog(true)}
              >
                <Plus className="w-3 h-3" />
                Ask Question
              </button>
            </div>
          </div>
        ) : (
          displayedQAs.map((item) => (
          <div key={item.id} className="pb-4">
            <div className="space-y-3">
              {/* Question */}
              <div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-gray-900 flex-1 pr-2">
                        {item.question}
                        {!item.answer && (
                          <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-normal">
                            Awaiting seller response
                          </span>
                        )}
                      </p>
                      <button 
                        onClick={() => handleLikeQuestion(item.id)}
                        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 transition-colors px-2 py-1 rounded-full text-gray-600 flex-shrink-0"
                      >
                        <Heart className="w-3 h-3" />
                        <span className="text-xs font-medium">{item.question_likes}</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                      Asked by {item.asked_by} • {formatDate(item.ask_date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer */}
              {item.answer && (
                <div className="ml-6 bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700 text-sm">{item.answer}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-2 whitespace-nowrap">
                    {renderSellerName(item.answered_by)} {item.answer_date && formatDate(item.answer_date)}
                  </div>
                  <div className="flex items-center justify-start mt-2">
                    <button 
                      onClick={() => handleHelpfulAnswer(item.id)}
                      className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1.5 rounded-full text-gray-600"
                    >
                      <Heart className="w-3 h-3" />
                      <span className="text-xs font-medium">{item.helpful_count}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          ))
        )}
      </div>

      {hasMoreQAs && (
        <button 
          onClick={handleViewAllQAs}
          className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors py-3 rounded-full w-full text-gray-600 font-medium"
        >
          <span>View all {qaItems.length} questions</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      <QuestionSubmissionDialog
        isOpen={showQuestionDialog}
        onClose={() => setShowQuestionDialog(false)}
        onSubmit={refetch}
      />

      <AskAISheet
        isOpen={showAskAISheet}
        onClose={() => setShowAskAISheet(false)}
        onQuestionSubmitted={refetch}
      />
    </div>
  );
};

export default QuestionsAnswers;