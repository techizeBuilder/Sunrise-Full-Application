// Enhanced notification sound utility with multiple fallback options

export const playNotificationSound = (volume = 0.3) => {
  // Check if sound is disabled in localStorage
  const soundEnabled = localStorage.getItem('notificationSound') !== 'false';
  if (!soundEnabled) return;

  console.log('Attempting to play notification sound...');

  // Method 1: Try Web Audio API (most reliable)
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a pleasant notification sound (two-tone)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
    
    console.log('Notification sound played via Web Audio API');
    return;
  } catch (error) {
    console.warn('Web Audio API failed:', error);
  }

  // Method 2: Try HTML5 Audio with base64 encoded sound
  try {
    // Short beep sound encoded in base64
    const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBi+BzvHZhzYIFmKx7eOfUAwLTKfk8LhiFQU1jNzy0H0vBSF+yO/dj0UMFl2369OmWBQKQanj8cJkGgYq';
    
    const audio = new Audio(audioData);
    audio.volume = volume;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Notification sound played via HTML5 Audio');
        })
        .catch(error => {
          console.warn('HTML5 Audio playback failed:', error);
          // Try method 3 as fallback
          trySystemBeep();
        });
    }
    return;
  } catch (error) {
    console.warn('HTML5 Audio failed:', error);
  }

  // Method 3: System beep fallback
  trySystemBeep();
};

const trySystemBeep = () => {
  try {
    // Create a very short beep using oscillator
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
    
    console.log('System beep played as fallback');
  } catch (error) {
    console.warn('All audio methods failed:', error);
    
    // Final fallback: Visual notification in console
    console.log('🔔 NOTIFICATION: New message received (audio unavailable)');
  }
};

export const testNotificationSound = () => {
  console.log('Testing notification sound...');
  playNotificationSound(0.5); // Higher volume for test
};