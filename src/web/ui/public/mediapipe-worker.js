/**
 * SignVision AI - MediaPipe Background Worker (V1.1 Stable)
 * Optimized version with error reporting and stable loading paths.
 */

// Use stable version to prevent CDN version mismatch
const MP_VERSION = "0.10.15";
importScripts(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.js`);

const { HandLandmarker, FilesetResolver } = self.tasksVision;
let handLandmarker;
const MODEL_ASSET_PATH = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

async function initLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_ASSET_PATH,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    console.log("Worker: MediaPipe HandLandmarker Initialized Successfully");
    self.postMessage({ type: 'ready' });
  } catch (error) {
    console.error("Worker Initialization Failed:", error);
    self.postMessage({ type: 'error', message: error.message });
  }
}

initLandmarker();

self.onmessage = async (event) => {
  const { frame, timestamp } = event.data;
  
  if (!handLandmarker) return;

  try {
    const results = handLandmarker.detectForVideo(frame, timestamp);
    const landmarks = results.landmarks[0] || [];
    
    self.postMessage({
      type: 'result',
      landmarks,
      timestamp
    });
    
    // Cleanup ImageBitmap
    if (frame && frame.close) frame.close();
  } catch (err) {
    // If detection fails, inform the main thread to consider fallback
    self.postMessage({ type: 'error', message: "Detection Cycle Failed" });
  }
};
