import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { AudioPlayerState } from '@shared/types';

export function useAudio() {
  const state = useSelector((s: RootState) => s.audioPlayer);
  const dispatch = useDispatch<AppDispatch>();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
    }
  }, []);

  return { state, dispatch, audioRef } as { state: AudioPlayerState; dispatch: AppDispatch; audioRef: React.RefObject<HTMLAudioElement> };
}
