import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReelsSkeleton from "@/components/skeletons/ReelsSkeleton";
import { ReelsHeader } from "@/components/reels/ReelsHeader";
import { ReelsVideoPlayer } from "@/components/reels/ReelsVideoPlayer";
import { useReelsLogic } from "@/components/reels/hooks/useReelsLogic";

export default function Reels() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const isModalMode = searchParams.has('video'); // Modal mode when opened from for-you page
  
  const {
    videos,
    isLoading,
    isReady,
    isMuted,
    playingStates,
    reelRefs,
    containerRef,
    handleVideoClick,
    formatViews,
  } = useReelsLogic();

  const handleClose = () => {
    // Navigate to home page when closing modal
    navigate('/');
  };

  if (isLoading) {
    return <ReelsSkeleton />;
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-black items-center justify-center text-white">
        <p>No videos available</p>
      </div>
    );
  }

  if (!isReady) {
    return <ReelsSkeleton />;
  }

  return (
    <div className={`flex flex-col bg-black ${isModalMode ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      <ReelsHeader isModalMode={isModalMode} onClose={handleClose} />

      <div 
        className={`w-full ${isModalMode ? 'h-full' : 'h-screen'} overflow-y-auto snap-y snap-mandatory ${
          isModalMode ? 'pb-0' : 'pb-12'
        }`} 
        ref={containerRef}
      >
        {videos?.map((video, index) => (
          <ReelsVideoPlayer
            key={video.id}
            video={video}
            index={index}
            videoRef={(el) => (reelRefs.current[index] = el)}
            isPlaying={playingStates[index]}
            isMuted={isMuted}
            onVideoClick={handleVideoClick}
            formatViews={formatViews}
            isModalMode={isModalMode}
          />
        ))}
      </div>
    </div>
  );
}