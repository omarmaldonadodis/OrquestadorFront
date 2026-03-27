// utils/getLocalIP.ts
export function getLocalIP(): Promise<string | null> {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then(o => pc.setLocalDescription(o));

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const match = e.candidate.candidate.match(
        /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/
      );
      if (match) {
        resolve(match[1]);
        pc.close();
      }
    };

    setTimeout(() => resolve(null), 3000); // timeout fallback
  });
}