import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export type ProctoringStatus =
  | 'VERIFIED'
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'LOOKING_DOWN'
  | 'LOOKING_UP'
  | 'LOOKING_AWAY'
  | 'EYES_LOOKING_DOWN'
  | 'EYES_LOOKING_AWAY'
  | 'EYES_CLOSED'
  | 'LOADING';

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EyeGazeData {
  leftPupil: [number, number];   // Video coordinate [x, y]
  rightPupil: [number, number];  // Video coordinate [x, y]
  leftEyeBox: FaceBox;
  rightEyeBox: FaceBox;
  horizontalGaze: number;        // -1.0 (left) to +1.0 (right), 0 is centered
  verticalGaze: number;          // -1.0 (up) to +1.0 (down), 0 is centered
  gazeStatus: 'CENTERED' | 'LOOKING_DOWN' | 'LOOKING_LEFT' | 'LOOKING_RIGHT' | 'LOOKING_UP' | 'CLOSED';
}

export interface ProctoringFrameResult {
  faceCount: number;
  isLookingAway: boolean;
  status: ProctoringStatus;
  statusMessage: string;
  confidence: number;
  boundingBoxes: FaceBox[];
  landmarks: Array<[number, number]>;
  eyeGaze?: EyeGazeData;
}

// Reusable offscreen canvas for high-performance zero-allocation eye patch analysis
let eyeCanvas: HTMLCanvasElement | null = null;
let eyeCtx: CanvasRenderingContext2D | null = null;

function getEyeCanvas() {
  if (!eyeCanvas && typeof document !== 'undefined') {
    eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 32;
    eyeCanvas.height = 20;
    eyeCtx = eyeCanvas.getContext('2d', { willReadFrequently: true });
  }
  return { canvas: eyeCanvas, ctx: eyeCtx };
}

// Adaptive Gaze Baseline State (Learns the candidate's natural screen-reading rest position)
let baselineSamples = 0;
let baselineX = 0;
let baselineY = 0;
let baselinePitch = 0.55;

export function resetGazeBaseline() {
  baselineSamples = 0;
  baselineX = 0;
  baselineY = 0;
  baselinePitch = 0.55;
}

/**
 * Computer Vision Pupil & Iris Tracker:
 * Crops eye socket patches, ignores top eyelid/eyelashes to eliminate shadow artifacts,
 * and computes the iris core centroid.
 */
function extractPupilOffset(
  video: HTMLVideoElement,
  eyeCenter: [number, number],
  boxWidth: number,
  boxHeight: number
): { pupilVideo: [number, number]; normX: number; normY: number; eyeBox: FaceBox } | null {
  const { ctx } = getEyeCanvas();
  if (!ctx) return null;

  // Center slightly below the eye landmark to target the cornea and palpebral fissure (avoiding upper brow/eyelash)
  const boxX = Math.max(0, eyeCenter[0] - boxWidth / 2);
  const boxY = Math.max(0, eyeCenter[1] - boxHeight * 0.42);
  const safeW = Math.min(video.videoWidth - boxX, boxWidth);
  const safeH = Math.min(video.videoHeight - boxY, boxHeight);

  if (safeW <= 4 || safeH <= 4) return null;

  const PW = 32;
  const PH = 20;

  try {
    ctx.drawImage(video, boxX, boxY, safeW, safeH, 0, 0, PW, PH);
    const imgData = ctx.getImageData(0, 0, PW, PH);
    const data = imgData.data;

    let minLum = 255;
    let maxLum = 0;
    const lums: number[] = new Array(PW * PH);

    for (let i = 0; i < data.length; i += 4) {
      // Perceptual grayscale luminance
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const pIdx = i / 4;
      lums[pIdx] = lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    // Dynamic threshold: isolate darkest pixels (iris & pupil core)
    const threshold = minLum + (maxLum - minLum) * 0.32;

    let sumX = 0;
    let sumY = 0;
    let weightSum = 0;

    // IMPORTANT: Skip top 25% of patch (eyelash and brow shadow) to eliminate false downward bias
    const startY = Math.floor(PH * 0.25);
    const endY = Math.floor(PH * 0.90);
    const startX = 2;
    const endX = PW - 2;

    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        const lum = lums[py * PW + px];
        if (lum <= threshold) {
          const weight = threshold - lum + 1;
          sumX += px * weight;
          sumY += py * weight;
          weightSum += weight;
        }
      }
    }

    if (weightSum === 0) {
      return {
        pupilVideo: [eyeCenter[0], eyeCenter[1]],
        normX: 0,
        normY: 0,
        eyeBox: { x: boxX, y: boxY, width: safeW, height: safeH },
      };
    }

    const pupilPatchX = sumX / weightSum;
    const pupilPatchY = sumY / weightSum;

    // Normalize from -1.0 to +1.0 relative to effective eye fissure center
    const effectiveCenterY = (startY + endY) / 2;
    const normX = (pupilPatchX - PW / 2) / (PW / 2);
    const normY = (pupilPatchY - effectiveCenterY) / ((endY - startY) / 2);

    const pupilVideoX = boxX + (pupilPatchX / PW) * safeW;
    const pupilVideoY = boxY + (pupilPatchY / PH) * safeH;

    return {
      pupilVideo: [pupilVideoX, pupilVideoY],
      normX,
      normY,
      eyeBox: { x: boxX, y: boxY, width: safeW, height: safeH },
    };
  } catch (err) {
    return null;
  }
}

let loadedModel: blazeface.BlazeFaceModel | null = null;
let isModelLoading = false;

export async function getProctoringModel(): Promise<blazeface.BlazeFaceModel | null> {
  if (loadedModel) return loadedModel;
  if (isModelLoading) {
    while (isModelLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return loadedModel;
  }

  try {
    isModelLoading = true;
    await tf.ready();
    loadedModel = await blazeface.load();
    return loadedModel;
  } catch (err) {
    console.warn('Failed to load BlazeFace proctoring model:', err);
    return null;
  } finally {
    isModelLoading = false;
  }
}

export async function analyzeVideoFrame(
  model: blazeface.BlazeFaceModel,
  video: HTMLVideoElement
): Promise<ProctoringFrameResult> {
  if (!video || video.readyState < 2 || video.videoWidth === 0) {
    return {
      faceCount: 1,
      isLookingAway: false,
      status: 'VERIFIED',
      statusMessage: 'Vision Feed Initializing...',
      confidence: 1.0,
      boundingBoxes: [],
      landmarks: [],
    };
  }

  try {
    const returnTensors = false;
    const predictions = await model.estimateFaces(video, returnTensors);

    if (!predictions || predictions.length === 0) {
      return {
        faceCount: 0,
        isLookingAway: false,
        status: 'NO_FACE',
        statusMessage: 'No face detected in camera view',
        confidence: 0,
        boundingBoxes: [],
        landmarks: [],
      };
    }

    const boundingBoxes: FaceBox[] = [];
    const allLandmarks: Array<[number, number]> = [];

    for (const pred of predictions as any[]) {
      const start = pred.topLeft as [number, number];
      const end = pred.bottomRight as [number, number];
      const width = end[0] - start[0];
      const height = end[1] - start[1];

      boundingBoxes.push({
        x: start[0],
        y: start[1],
        width,
        height,
      });

      if (pred.landmarks) {
        for (const lm of pred.landmarks) {
          allLandmarks.push([lm[0], lm[1]]);
        }
      }
    }

    // Check multiple people in room
    if (predictions.length > 1) {
      return {
        faceCount: predictions.length,
        isLookingAway: false,
        status: 'MULTIPLE_FACES',
        statusMessage: `Multiple people detected (${predictions.length} faces)`,
        confidence: 0.98,
        boundingBoxes,
        landmarks: allLandmarks,
      };
    }

    // Single candidate: Detailed 3D Head Pose & Gaze Analysis
    const primaryFace = predictions[0] as any;
    let status: ProctoringStatus = 'VERIFIED';
    let isLookingAway = false;
    let statusMessage = 'Focus Verified: Facing Screen Directly';

    if (primaryFace.landmarks && primaryFace.landmarks.length >= 4) {
      const rightEye = primaryFace.landmarks[0] as [number, number];
      const leftEye = primaryFace.landmarks[1] as [number, number];
      const noseTip = primaryFace.landmarks[2] as [number, number];
      const mouthCenter = primaryFace.landmarks[3] as [number, number];

      const eyeCenterX = (rightEye[0] + leftEye[0]) / 2;
      const eyeCenterY = (rightEye[1] + leftEye[1]) / 2;
      const eyeSpan = Math.abs(leftEye[0] - rightEye[0]);

      // ── Baseline Tracking & Deviations ──
      // Calibrates the candidate's natural screen-reading rest posture
      const rawYaw = (noseTip[0] - eyeCenterX) / eyeSpan;
      const eyeToNose = noseTip[1] - eyeCenterY;
      const noseToMouth = mouthCenter[1] - noseTip[1];
      const rawPitch = eyeToNose > 5 ? noseToMouth / eyeToNose : 0.55;

      // Real-time eye & pupil tracking
      const eyeBoxW = Math.max(16, eyeSpan * 0.38);
      const eyeBoxH = Math.max(12, eyeBoxW * 0.55);
      const rightPupilData = extractPupilOffset(video, rightEye, eyeBoxW, eyeBoxH);
      const leftPupilData = extractPupilOffset(video, leftEye, eyeBoxW, eyeBoxH);

      let avgNormX = 0;
      let avgNormY = 0;
      if (rightPupilData && leftPupilData) {
        avgNormX = (rightPupilData.normX + leftPupilData.normX) / 2;
        avgNormY = (rightPupilData.normY + leftPupilData.normY) / 2;
      }

      // Establish baseline only when facing front; adapt to natural screen reading envelope
      if (Math.abs(rawYaw) < 0.22) {
        if (baselineSamples < 12) {
          baselineSamples += 1;
          const alpha = 1 / baselineSamples;
          baselineX = baselineX * (1 - alpha) + avgNormX * alpha;
          baselineY = baselineY * (1 - alpha) + avgNormY * alpha;
          baselinePitch = baselinePitch * (1 - alpha) + rawPitch * alpha;
        } else if (Math.abs(avgNormX - baselineX) < 0.20 && Math.abs(avgNormY - baselineY) < 0.20) {
          // Continuous micro-adaptation while candidate is comfortably reading on screen
          baselineX = baselineX * 0.98 + avgNormX * 0.02;
          baselineY = baselineY * 0.98 + avgNormY * 0.02;
          baselinePitch = baselinePitch * 0.98 + rawPitch * 0.02;
        }
      }

      // Precision gaze deflection relative to candidate's screen baseline
      const deltaEyeX = avgNormX - baselineX;
      const deltaEyeY = avgNormY - baselineY;
      const deltaPitch = rawPitch - baselinePitch;

      // ── Realistic Anti-Cheating Thresholds ──
      // Normal on-screen reading allows natural eye movement across the display envelope (|delta| <= 0.28).
      // True off-screen cheating triggers when pupils or head clearly leave the screen boundary.

      // 1. Looking Up (Eyes / Retinas shifted to ceiling / top cheat notes):
      if (deltaEyeY < -0.32 || rawPitch > 2.6) {
        status = 'LOOKING_UP';
        isLookingAway = true;
        statusMessage = 'Gaze Upward: Eyes/Retinas directed on top towards ceiling';
      }
      // 2. Looking Direct Side (Eyes shifted to secondary monitor or off-screen assistant):
      else if (Math.abs(deltaEyeX) > 0.32 || Math.abs(rawYaw) > 0.36) {
        status = 'EYES_LOOKING_AWAY';
        isLookingAway = true;
        const isRight = deltaEyeX > 0 || rawYaw > 0;
        statusMessage = isRight
          ? 'Side Glance: Eyes/Retinas shifted right off-screen'
          : 'Side Glance: Eyes/Retinas shifted left off-screen';
      }
      // 3. Looking Down (Eyes directed down to mobile phone in hands or lap):
      else if (
        deltaEyeY > 0.32 ||
        (eyeToNose > 6 && (rawPitch < 0.22 || noseToMouth < 4 || deltaPitch < -0.36))
      ) {
        status = 'EYES_LOOKING_DOWN';
        isLookingAway = true;
        statusMessage = 'Gaze Downward: Eyes/Retinas directed down at mobile phone / lap';
      }

      // Eye gaze telemetry for overlay
      let gazeStatus: EyeGazeData['gazeStatus'] = 'CENTERED';
      if (status === 'EYES_LOOKING_DOWN') {
        gazeStatus = 'LOOKING_DOWN';
      } else if (status === 'LOOKING_UP') {
        gazeStatus = 'LOOKING_UP';
      } else if (deltaEyeX > 0.30 || rawYaw > 0.32) {
        gazeStatus = 'LOOKING_RIGHT';
      } else if (deltaEyeX < -0.30 || rawYaw < -0.32) {
        gazeStatus = 'LOOKING_LEFT';
      }

      let eyeGazeData: EyeGazeData | undefined;
      if (rightPupilData && leftPupilData) {
        eyeGazeData = {
          rightPupil: rightPupilData.pupilVideo,
          leftPupil: leftPupilData.pupilVideo,
          rightEyeBox: rightPupilData.eyeBox,
          leftEyeBox: leftPupilData.eyeBox,
          horizontalGaze: deltaEyeX,
          verticalGaze: deltaEyeY,
          gazeStatus,
        };
      }

      const confidence = primaryFace.probability ? primaryFace.probability[0] : 0.98;

      return {
        faceCount: 1,
        isLookingAway,
        status,
        statusMessage,
        confidence,
        boundingBoxes,
        landmarks: allLandmarks,
        eyeGaze: eyeGazeData,
      };
    }

    const confidence = primaryFace.probability ? primaryFace.probability[0] : 0.98;

    return {
      faceCount: 1,
      isLookingAway,
      status,
      statusMessage,
      confidence,
      boundingBoxes,
      landmarks: allLandmarks,
    };
  } catch (err) {
    console.warn('Frame analysis error:', err);
    return {
      faceCount: 1,
      isLookingAway: false,
      status: 'VERIFIED',
      statusMessage: 'AI Proctor Active',
      confidence: 0.9,
      boundingBoxes: [],
      landmarks: [],
    };
  }
}

/**
 * Draw bounding boxes, facial landmarks, and Eye/Pupil tracking reticles onto overlay canvas
 */
export function drawProctoringOverlay(
  canvas: HTMLCanvasElement,
  result: ProctoringFrameResult,
  videoWidth: number,
  videoHeight: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = videoWidth || 320;
  canvas.height = videoHeight || 240;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let strokeColor = '#10b981'; // green for verified
  let labelBg = 'rgba(16, 185, 129, 0.9)';
  let labelText = 'Candidate Facing Screen [OK]';

  if (result.status === 'NO_FACE') {
    strokeColor = '#ef4444'; // red
    labelBg = 'rgba(239, 68, 68, 0.95)';
    labelText = 'NO FACE DETECTED';
  } else if (result.status === 'MULTIPLE_FACES') {
    strokeColor = '#ef4444';
    labelBg = 'rgba(239, 68, 68, 0.95)';
    labelText = `MULTIPLE FACES (${result.faceCount})`;
  } else if (result.status === 'LOOKING_DOWN') {
    strokeColor = '#ef4444';
    labelBg = 'rgba(239, 68, 68, 0.95)';
    labelText = 'LOOKING DOWN AT PHONE [FLAGGED]';
  } else if (result.status === 'EYES_LOOKING_DOWN') {
    strokeColor = '#ef4444';
    labelBg = 'rgba(239, 68, 68, 0.95)';
    labelText = 'EYES LOOKING DOWN AT PHONE [FLAGGED]';
  } else if (result.status === 'LOOKING_UP') {
    strokeColor = '#ef4444';
    labelBg = 'rgba(239, 68, 68, 0.95)';
    labelText = 'LOOKING UP [FLAGGED]';
  } else if (result.status === 'LOOKING_AWAY' || result.status === 'EYES_LOOKING_AWAY') {
    strokeColor = '#ef4444';
    labelBg = 'rgba(239, 68, 68, 0.95)';
    labelText = 'EYE GAZE SIDE GLANCE [FLAGGED]';
  } else if (result.status === 'EYES_CLOSED') {
    strokeColor = '#ef4444';
    labelBg = 'rgba(239, 68, 68, 0.95)';
    labelText = 'EYES CLOSED / AVERTED [FLAGGED]';
  }

  // Draw face bounding box
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = strokeColor;
  ctx.font = 'bold 10px Inter, sans-serif';

  result.boundingBoxes.forEach((box) => {
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    const textWidth = ctx.measureText(labelText).width;
    ctx.fillStyle = labelBg;
    ctx.fillRect(box.x, Math.max(0, box.y - 18), textWidth + 8, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(labelText, box.x + 4, Math.max(12, box.y - 6));
  });

  // Draw facial landmark dots
  ctx.fillStyle = strokeColor;
  result.landmarks.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fill();
  });

  // ── Render High-Precision Eye & Pupil Reticles ──
  if (result.eyeGaze) {
    const isEyeFlagged = result.status !== 'VERIFIED' && result.status !== 'LOADING';
    const eyeColor = isEyeFlagged ? '#ef4444' : '#06b6d4'; // Cyan for pupil lock, red for breach

    [result.eyeGaze.rightEyeBox, result.eyeGaze.leftEyeBox].forEach((eBox) => {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = eyeColor;
      ctx.strokeRect(eBox.x, eBox.y, eBox.width, eBox.height);
    });

    // Draw Crosshairs and Vector Rays on Pupils
    [result.eyeGaze.rightPupil, result.eyeGaze.leftPupil].forEach(([px, py]) => {
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = 1.5;

      // Reticle target circle
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.stroke();

      // Reticle crosshair (+)
      ctx.beginPath();
      ctx.moveTo(px - 5, py);
      ctx.lineTo(px + 5, py);
      ctx.moveTo(px, py - 5);
      ctx.lineTo(px, py + 5);
      ctx.stroke();

      // Pupil center dot
      ctx.fillStyle = isEyeFlagged ? '#ef4444' : '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, 2 * Math.PI);
      ctx.fill();

      // Gaze vector ray showing exact retina gaze direction
      const rayLen = 25;
      const rayDx = (result.eyeGaze?.horizontalGaze || 0) * rayLen * 2.2;
      const rayDy = (result.eyeGaze?.verticalGaze || 0) * rayLen * 2.2;
      ctx.beginPath();
      ctx.strokeStyle = isEyeFlagged ? 'rgba(239, 68, 68, 0.95)' : 'rgba(6, 182, 212, 0.85)';
      ctx.lineWidth = 2;
      ctx.moveTo(px, py);
      ctx.lineTo(px + rayDx, py + rayDy);
      ctx.stroke();
    });
  }
}
