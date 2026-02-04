let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    return ctx.resume();
  }
  return Promise.resolve();
}

export function createAlarmSound(type = 'loud', initialVolume = 0.3) {
  const ctx = getAudioContext();

  const oscillators = [];
  const gains = [];
  let masterGain = null;
  let isPlaying = false;
  let escalationInterval = null;

  const configs = {
    soft: {
      frequencies: [440, 554.37], // A4 and C#5
      waveform: 'sine',
      pattern: [500, 300, 500, 300], // on, off, on, off
      maxVolume: 0.5
    },
    loud: {
      frequencies: [880, 1108.73, 1318.51], // A5, C#6, E6
      waveform: 'sawtooth',
      pattern: [200, 100, 200, 100, 400, 200],
      maxVolume: 1.0
    },
    gentle: {
      frequencies: [523.25, 659.25], // C5 and E5
      waveform: 'sine',
      pattern: [800, 400],
      maxVolume: 0.3
    }
  };

  const config = configs[type] || configs.loud;

  return {
    start() {
      if (isPlaying) return;
      isPlaying = true;

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(initialVolume, ctx.currentTime);
      masterGain.connect(ctx.destination);

      config.frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = config.waveform;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(1 / config.frequencies.length, ctx.currentTime);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start();

        oscillators.push(osc);
        gains.push(gain);
      });

      // Pattern playback
      this.playPattern();
    },

    playPattern() {
      let time = ctx.currentTime;
      const totalPatternTime = config.pattern.reduce((a, b) => a + b, 0) / 1000;

      const schedulePattern = () => {
        if (!isPlaying) return;

        let currentTime = ctx.currentTime;
        config.pattern.forEach((duration, i) => {
          const isOn = i % 2 === 0;
          gains.forEach(gain => {
            gain.gain.setValueAtTime(
              isOn ? 1 / config.frequencies.length : 0,
              currentTime
            );
          });
          currentTime += duration / 1000;
        });

        setTimeout(schedulePattern, totalPatternTime * 1000);
      };

      schedulePattern();
    },

    stop() {
      isPlaying = false;

      if (escalationInterval) {
        clearInterval(escalationInterval);
        escalationInterval = null;
      }

      oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });

      gains.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {}
      });

      if (masterGain) {
        try {
          masterGain.disconnect();
        } catch (e) {}
      }

      oscillators.length = 0;
      gains.length = 0;
      masterGain = null;
    },

    setVolume(volume) {
      if (masterGain) {
        masterGain.gain.setValueAtTime(
          Math.min(volume, config.maxVolume),
          ctx.currentTime
        );
      }
    },

    startEscalation(durationSeconds = 30) {
      const startVolume = initialVolume;
      const endVolume = config.maxVolume;
      const steps = durationSeconds;
      const volumeIncrement = (endVolume - startVolume) / steps;
      let currentVolume = startVolume;

      escalationInterval = setInterval(() => {
        currentVolume = Math.min(currentVolume + volumeIncrement, endVolume);
        this.setVolume(currentVolume);

        if (currentVolume >= endVolume) {
          clearInterval(escalationInterval);
          escalationInterval = null;
        }
      }, 1000);
    },

    isPlaying() {
      return isPlaying;
    }
  };
}

export function createVibrationPattern(type = 'normal') {
  const patterns = {
    gentle: [200, 100, 200],
    normal: [200, 100, 200, 100, 400],
    intense: [300, 100, 300, 100, 500, 100, 500],
    escalating: [
      200, 100, 200, 100,
      300, 100, 300, 100,
      400, 100, 400, 100,
      500, 100, 500, 100,
      1000, 100, 1000
    ]
  };

  return patterns[type] || patterns.normal;
}

export function vibrate(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function stopVibration() {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

export function playNotificationSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
  osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

export async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await navigator.wakeLock.request('screen');
      return wakeLock;
    } catch (e) {
      console.warn('Wake lock request failed:', e);
      return null;
    }
  }
  return null;
}
