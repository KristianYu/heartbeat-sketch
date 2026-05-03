export const HapticManager = {
  trigger: (type: 'MISS_YOU' | 'SAD' | 'WARMTH') => {
    if (!('vibrate' in navigator)) {
      console.log(`[Haptic Mock] ${type}`);
      return;
    }

    switch (type) {
      case 'MISS_YOU':
        // Light tap * 2
        navigator.vibrate([10, 50, 10]);
        break;
      case 'SAD':
        // Long heavy vibration
        navigator.vibrate(500);
        break;
      case 'WARMTH':
        // Extremely light friction-like vibration
        navigator.vibrate([5, 10, 5, 10, 5]);
        break;
    }
  }
};
