import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { SoundscapeType } from '../types';

let currentSound: Audio.Sound | null = null;
let activeSoundscapeType: SoundscapeType = 'NONE';
let webAudioContext: any = null;
let webNoiseNode: any = null;

const SOUND_STREAMS: Record<Exclude<SoundscapeType, 'NONE'>, string> = {
  BROWN_NOISE: 'https://actions.google.com/sounds/v1/water/rain_heavy.ogg',
  RAIN: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  FOREST: 'https://actions.google.com/sounds/v1/ambiences/forest_birds.ogg',
  WAVES: 'https://actions.google.com/sounds/v1/water/ocean_waves.ogg',
};

/**
 * Âm thanh trợ năng tập trung (Focus Soundscapes):
 * Tiếng ồn nâu (Brown Noise), Mưa rào, Rừng thông, Sóng biển.
 * Triệt tiêu tiếng ồn gây xao nhãng và kích thích sóng não Alpha cho người ADHD.
 */
export const SoundscapeService = {
  /**
   * Phát âm thanh trợ năng tập trung
   */
  play: async (type: SoundscapeType, volume = 0.6): Promise<boolean> => {
    if (type === 'NONE') {
      await SoundscapeService.stop();
      return true;
    }

    try {
      await SoundscapeService.stop();

      // Cấu hình audio session trên thiết bị di động
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const streamUrl = SOUND_STREAMS[type];
        const { sound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true, isLooping: true, volume },
          (status) => {
            if (!status.isLoaded && status.error) {
              console.warn('[SoundscapeService] Audio playback warning:', status.error);
            }
          }
        );

        currentSound = sound;
        activeSoundscapeType = type;
        return true;
      } else {
        // Fallback Web Audio Generator cho môi trường Web
        SoundscapeService.playWebSynthesizer(type, volume);
        activeSoundscapeType = type;
        return true;
      }
    } catch (err) {
      console.warn('[SoundscapeService] Error playing soundscape:', err);
      // Fallback web synth nếu expo-av trên web gặp trở ngại
      if (Platform.OS === 'web') {
        SoundscapeService.playWebSynthesizer(type, volume);
        activeSoundscapeType = type;
        return true;
      }
      return false;
    }
  },

  /**
   * Dừng âm thanh tập trung
   */
  stop: async (): Promise<void> => {
    try {
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        currentSound = null;
      }

      if (webNoiseNode) {
        webNoiseNode.disconnect();
        webNoiseNode = null;
      }
      if (webAudioContext && webAudioContext.state !== 'closed') {
        await webAudioContext.suspend?.();
      }

      activeSoundscapeType = 'NONE';
    } catch (err) {
      console.warn('[SoundscapeService] Error stopping soundscape:', err);
    }
  },

  /**
   * Lấy loại âm thanh đang phát
   */
  getCurrentSoundscape: (): SoundscapeType => {
    return activeSoundscapeType;
  },

  /**
   * Bộ tổng hợp sóng âm trắng / nâu trực tiếp qua Web Audio API (hoạt động 100% offline trên Web)
   */
  playWebSynthesizer: (type: SoundscapeType, volume: number) => {
    const globalObj = globalThis as any;
    if (!globalObj.AudioContext && !globalObj.window?.AudioContext) return;

    try {
      const AudioCtx =
        globalObj.AudioContext ||
        globalObj.webkitAudioContext ||
        globalObj.window?.AudioContext ||
        globalObj.window?.webkitAudioContext;
      if (!AudioCtx) return;

      if (!webAudioContext) {
        webAudioContext = new AudioCtx();
      }
      if (webAudioContext.state === 'suspended') {
        webAudioContext.resume();
      }

      const bufferSize = webAudioContext.sampleRate * 2;
      const buffer = webAudioContext.createBuffer(1, bufferSize, webAudioContext.sampleRate);
      const data = buffer.getChannelData(0);

      // Thuật toán Brown Noise lọc tích lũy (First-order integration)
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'BROWN_NOISE') {
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; // Gain compensation
        } else {
          // Pink / soft rain noise
          data[i] = (lastOut + 0.08 * white) / 1.08;
          lastOut = data[i];
          data[i] *= 2.0;
        }
      }

      const noiseSource = webAudioContext.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const gainNode = webAudioContext.createGain();
      gainNode.gain.setValueAtTime(volume * 0.15, webAudioContext.currentTime);

      noiseSource.connect(gainNode);
      gainNode.connect(webAudioContext.destination);

      noiseSource.start();
      webNoiseNode = noiseSource;
    } catch (e) {
      console.warn('[SoundscapeService] Web Audio synth fallback failed:', e);
    }
  },
};
