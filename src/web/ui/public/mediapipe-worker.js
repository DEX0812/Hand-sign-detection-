/**
 * SignVision AI - MediaPipe Background Worker
 * Offloads AI landmarks detection from the UI thread for zero-lag 60fps performance.
 */

importScripts("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js");

const { HandLandmarker, FilesetResolver } = self.tasksVision;

let handLandmarker;
const MODEL_ASSET_PATH = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

async function initLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
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
    self.postMessage({ type: 'ready' });
  } catch (error) {
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
    
    // Close the ImageBitmap to free up memory
    if (frame.close) frame.close();
  } catch (err) {
    console.error("Worker detection error:", err);
  }
};
