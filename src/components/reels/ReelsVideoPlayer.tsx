import React from 'react';
import { Video } from '@/hooks/useVideos';
import { ReelsPlayPauseOverlay } from './ReelsPlayPauseOverlay';
import { ReelsActionButtons } from './ReelsActionButtons';
import { ReelsVideoInfo } from './ReelsVideoInfo';

interface ReelsVideoPlayerProps {
  video: Video;
  index: number;
  videoRef: (el: HTMLVideoElement | null) => void;
  isPlaying: boolean;
  isMuted: boolean;
  onVideoClick: (index: number, event?: React.MouseEvent) => void;
  formatViews: (views: number) => string;
  isModalMode?: boolean;
}

export const ReelsVideoPlayer: React.FC<ReelsVideoPlayerProps> = ({
  video,
  index,
  videoRef,
  isPlaying,
  isMuted,
  onVideoClick,
  formatViews,
  isModalMode = false,
}) => {
  return (
    <div 
      id={`reel-${index}`}
      data-reel-container
      className={`w-full ${isModalMode ? 'h-screen' : 'h-[calc(100vh-3rem)]'} relative snap-start snap-always overflow-hidden`}
    >
      <div className="w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          src={video.video_url}
          className="w-full h-full object-contain"
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          onClick={(e) => onVideoClick(index, e)}
        />
      </div>

      <ReelsPlayPauseOverlay
        isPlaying={isPlaying}
        onVideoClick={(e) => onVideoClick(index, e)}
      />

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
        <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <ReelsActionButtons
          likes={video.likes || 0}
          views={video.views || 0}
          inquiries={0}
          formatViews={formatViews}
          isLiked={false}
          isBookmarked={false}
          onLike={() => {}}
          onInquiry={() => {}}
          onShare={() => {}}
          onBookmark={() => {}}
          onViewProduct={() => {}}
        />

        <ReelsVideoInfo video={video} />
      </div>
    </div>
  );
};