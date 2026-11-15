import { Platform } from 'react-native';
import { SoundscapeType } from '../types';

let activeSoundscapeType: SoundscapeType = 'NONE';
let activeAudioPlayer: any = null;
let webAudioContext: any = null;
let webNoiseNode: any = null;

const SOUND_STREAMS: Record<Exclude<SoundscapeType, 'NONE'>, string> = {
  BROWN_NOISE: 'https://actions.google.com/sounds/v1/water/rain_heavy.ogg',
  RAIN: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  FOREST: 'https://actions.google.com/sounds/v1/ambiences/forest_birds.ogg',
  WAVES: 'https://actions.google.com/sounds/v1/water/ocean_waves.ogg',
};

/**
 * Tải module audio linh hoạt (Dynamic Loading):
 * Tránh lỗi crash "Cannot find native module 'ExpoAV'" trên Expo Go khi ứng dụng khởi chạy.
 * Hỗ trợ chuyển tiếp mượt mà giữa expo-audio (Expo 58) và dự phòng không crash.
 */
const getNativeAudioModule = () => {
  try {
    // 1. Thử expo-audio (Chuẩn mới Expo SDK 58)
    // Dùng require động để tránh Metro crash khi native module vắng mặt trên Expo Go
    const expoAudio = require('expo-audio');
    if (expoAudio && (expoAudio.createAudioPlayer || expoAudio.useAudioPlayer)) {
      return { type: 'expo-audio', module: expoAudio };
    }
  } catch {
    // Không có expo-audio trong client hiện tại
  }

  try {
    // 2. Thử expo-av nếu đang chạy trên bản build cũ
    const expoAv = require('expo-av');
    if (expoAv && expoAv.Audio) {
      return { type: 'expo-av', module: expoAv.Audio };
    }
  } catch {
    // Không có expo-av
  }

  return null;
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

      // Fallback Web Audio Generator nếu đang chạy trên Web
      if (Platform.OS === 'web') {
        SoundscapeService.playWebSynthesizer(type, volume);
        activeSoundscapeType = type;
        return true;
      }

      // Môi trường Mobile (Expo Go hoặc Development Build)
      const nativeAudio = getNativeAudioModule();
      if (!nativeAudio) {
        console.warn(
          '[SoundscapeService] Native audio module is not bundled in this Expo Go client. Skipping audio playback safely without crash.'
        );
        activeSoundscapeType = type;
        return false;
      }

      const streamUrl = SOUND_STREAMS[type];

      // Triển khai qua expo-audio (SDK 58)
      if (nativeAudio.type === 'expo-audio') {
        const { createAudioPlayer } = nativeAudio.module;
        if (createAudioPlayer) {
          const player = createAudioPlayer({ uri: streamUrl });
          player.loop = true;
          player.volume = volume;
          player.play();
          activeAudioPlayer = {
            type: 'expo-audio',
            player,
            stop: () => {
              try {
                player.pause?.();
                player.remove?.();
              } catch {}
            },
          };
          activeSoundscapeType = type;
          return true;
        }
      }

      // Triển khai qua expo-av nếu có
      if (nativeAudio.type === 'expo-av') {
        const Audio = nativeAudio.module;
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        }).catch(() => {});

        const { sound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true, isLooping: true, volume }
        );

        activeAudioPlayer = {
          type: 'expo-av',
          sound,
          stop: async () => {
            try {
              await sound.stopAsync();
              await sound.unloadAsync();
            } catch {}
          },
        };
        activeSoundscapeType = type;
        return true;
      }

      activeSoundscapeType = type;
      return false;
    } catch (err) {
      console.warn('[SoundscapeService] Playback handled gracefully:', err);
      activeSoundscapeType = type;
      return false;
    }
  },

  /**
   * Dừng âm thanh tập trung
   */
  stop: async (): Promise<void> => {
    try {
      if (activeAudioPlayer) {
        if (activeAudioPlayer.type === 'expo-audio') {
          activeAudioPlayer.stop();
        } else if (activeAudioPlayer.type === 'expo-av') {
          await activeAudioPlayer.stop();
        }
        activeAudioPlayer = null;
      }

      if (webNoiseNode) {
        try {
          webNoiseNode.disconnect();
        } catch {}
        webNoiseNode = null;
      }
      if (webAudioContext && webAudioContext.state !== 'closed') {
        try {
          await webAudioContext.suspend?.();
        } catch {}
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
