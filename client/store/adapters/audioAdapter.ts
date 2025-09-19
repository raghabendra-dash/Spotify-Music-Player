import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { AudioPlayerState } from '@shared/types';

export function useAudioPlayer() {
  const state: AudioPlayerState = useSelector((s: RootState) => s.audioPlayer);
  const dispatch: AppDispatch = useDispatch<AppDispatch>();

  return { state, dispatch };
}
