export const trackEvent = async (eventName: string, metadata?: any) => {
  try {
    const sessionId = sessionStorage.getItem('fp_session') || crypto.randomUUID();
    if (!sessionStorage.getItem('fp_session')) {
      sessionStorage.setItem('fp_session', sessionId);
    }
    
    // Attempt to track but don't block the UI if it fails
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        sessionId,
        metadata
      })
    }).catch(() => {});
  } catch (e) {
    // Analytics should never crash the app
    console.error('Analytics tracking failed silently');
  }
};
