import { useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore.ts';

export function useTimeline() {
  const {
    timelineWindow,
    timelineCursor,
    playbackState,
    playbackSpeed,
    setTimelineCursor,
    setPlaybackState,
    setPlaybackSpeed,
  } = useAppStore();

  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    if (playbackState !== 'playing') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTickRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;

      // Accelerate real time by playbackSpeed (e.g. 1x = 1 sec per sec, 10x = 10 sec per sec, or 60x for 1 min per sec)
      // For tactical playback, let 1x = 60s per sec so 48 hours is watchable, or speed multipliers
      const simulatedDeltaMs = deltaMs * playbackSpeed * 60;

      const nextTime = new Date(timelineCursor.getTime() + simulatedDeltaMs);

      if (nextTime >= timelineWindow.end) {
        setTimelineCursor(timelineWindow.end);
        setPlaybackState('paused');
      } else {
        setTimelineCursor(nextTime);
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [playbackState, playbackSpeed, timelineCursor, timelineWindow, setTimelineCursor, setPlaybackState]);

  return {
    timelineWindow,
    timelineCursor,
    playbackState,
    playbackSpeed,
    setTimelineCursor,
    setPlaybackState,
    setPlaybackSpeed,
  };
}

export default useTimeline;
