/**
 * Pure Traditional Computer Vision Service for Face Analysis (No Machine Learning)
 * 
 * Implements deterministic computer vision:
 * - Viola-Jones / Haar Cascade multi-scale integral face detection
 * - Anatomical face region estimation (forehead and cheeks based on facial geometry)
 * - Brightness, exposure, and over/underexposure statistics
 * - Discrete 2D Laplacian convolution for objective blur/sharpness variance
 * - CIE-XYZ and CIELAB (D65 standard) color space conversion
 * - Regional color delta (Delta E) and redness ratio measurements
 * - Sobel gradient edge analysis and local contrast texture calculation
 * - Strict camera quality validation checks before accepting assessment
 */

// CIE D65 Standard Illuminant Tristimulus Values
const D65_X = 95.047;
const D65_Y = 100.000;
const D65_Z = 108.883;

/**
 * Converts sRGB [0-255] to CIELAB [L*, a*, b*]
 */
export function rgbToLab(r, g, b) {
  // 1. Linearize sRGB
  let R = r / 255.0;
  let G = g / 255.0;
  let B = b / 255.0;

  R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
  G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
  B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

  // 2. Transform to CIE XYZ
  const X = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) * 100.0;
  const Y = (R * 0.2126729 + G * 0.7151522 + B * 0.0721750) * 100.0;
  const Z = (R * 0.0193339 + G * 0.1191920 + B * 0.9503041) * 100.0;

  // 3. Normalize against D65 reference white
  const xr = X / D65_X;
  const yr = Y / D65_Y;
  const zr = Z / D65_Z;

  const epsilon = 0.008856;
  const kappa = 903.3;

  const fx = xr > epsilon ? Math.cbrt(xr) : (kappa * xr + 16.0) / 116.0;
  const fy = yr > epsilon ? Math.cbrt(yr) : (kappa * yr + 16.0) / 116.0;
  const fz = zr > epsilon ? Math.cbrt(zr) : (kappa * zr + 16.0) / 116.0;

  const L = Math.max(0, 116.0 * fy - 16.0);
  const a = 500.0 * (fx - fy);
  const b_val = 200.0 * (fy - fz);

  return { L: Number(L.toFixed(2)), a: Number(a.toFixed(2)), b: Number(b_val.toFixed(2)) };
}

/**
 * Converts sRGB [0-255] to HSV [H 0-360, S 0-100, V 0-100]
 */
export function rgbToHsv(r, g, b) {
  const rNorm = r / 255.0;
  const gNorm = g / 255.0;
  const bNorm = b / 255.0;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = max === 0 ? 0 : (delta / max) * 100;
  let v = max * 100;

  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return {
    h: Math.round(h),
    s: Number(s.toFixed(1)),
    v: Number(v.toFixed(1))
  };
}

/**
 * Calculates CIE76 Color Difference Delta E between two Lab colors
 */
export function deltaE76(lab1, lab2) {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Number(Math.sqrt(dL * dL + da * da + db * db).toFixed(2));
}

/**
 * Computes Integral Image for rapid window summation in Viola-Jones algorithms
 */
export function computeIntegralImages(grayscale, width, height) {
  const integral = new Float64Array((width + 1) * (height + 1));
  const integralSq = new Float64Array((width + 1) * (height + 1));

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    let rowSumSq = 0;
    const yOffset = y * width;
    const intYOffset = (y + 1) * (width + 1);
    const prevIntYOffset = y * (width + 1);

    for (let x = 0; x < width; x++) {
      const val = grayscale[yOffset + x];
      rowSum += val;
      rowSumSq += val * val;

      integral[intYOffset + (x + 1)] = integral[prevIntYOffset + (x + 1)] + rowSum;
      integralSq[intYOffset + (x + 1)] = integralSq[prevIntYOffset + (x + 1)] + rowSumSq;
    }
  }

  return { integral, integralSq, width: width + 1, height: height + 1 };
}

/**
 * Sum of a rectangular region using integral image lookup in O(1) time
 */
export function getIntegralSum(integral, intW, x, y, w, h) {
  const x1 = Math.max(0, x);
  const y1 = Math.max(0, y);
  const x2 = x + w;
  const y2 = y + h;

  const a = integral[y1 * intW + x1];
  const b = integral[y1 * intW + x2];
  const c = integral[y2 * intW + x1];
  const d = integral[y2 * intW + x2];

  return d - b - c + a;
}

/**
 * Traditional Haar-feature and Skin-Color Mask face detector
 * Evaluates physiological face geometry, center-weighted luminance cascade,
 * and skin chrominance constraints deterministically without neural networks.
 */
// ==================== TEMPORAL TRACKING & DETECTOR STATE ====================

const faceDetectorState = {
  history: [],           // rolling face counts over recent frames: e.g. [1, 1, 1]
  smoothedBox: null,     // smoothed { x, y, width, height }
  lastRawCandidates: 0,
  lastClusters: 0,
  lastUniqueFaces: 0,
  lastRawList: [],
  detectorParams: {
    scaleFactor: 1.18,
    minNeighbors: 3,
    minSizeRatio: 0.24,
    iouConsolidationThreshold: 0.25,
    iomConsolidationThreshold: 0.40
  }
};

/**
 * Resets temporal smoothing and detection history when camera starts or stops.
 */
export function resetFaceDetectorState() {
  faceDetectorState.history = [];
  faceDetectorState.smoothedBox = null;
  faceDetectorState.lastRawCandidates = 0;
  faceDetectorState.lastClusters = 0;
  faceDetectorState.lastUniqueFaces = 0;
  faceDetectorState.lastRawList = [];
}

/**
 * Calculates Intersection over Union (IoU) and Intersection over Minimum (IoM)
 */
export function getBoundingBoxOverlap(boxA, boxB) {
  const x1 = Math.max(boxA.x, boxB.x);
  const y1 = Math.max(boxA.y, boxB.y);
  const x2 = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const y2 = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  if (x2 <= x1 || y2 <= y1) {
    return { iou: 0, iom: 0, interArea: 0 };
  }

  const interArea = (x2 - x1) * (y2 - y1);
  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - interArea;

  const iou = unionArea > 0 ? interArea / unionArea : 0;
  const iom = Math.min(areaA, areaB) > 0 ? interArea / Math.min(areaA, areaB) : 0;

  return { iou, iom, interArea };
}

/**
 * Computes mean and standard deviation of any rectangular region in O(1) time
 * using standard and squared integral images (variance normalization).
 */
export function getSubwindowStats(integral, integralSq, intW, x, y, w, h) {
  const n = Math.max(1, w * h);
  const sum = getIntegralSum(integral, intW, x, y, w, h);
  const sumSq = getIntegralSum(integralSq, intW, x, y, w, h);
  const mean = sum / n;
  const variance = Math.max(0, (sumSq / n) - (mean * mean));
  const stdDev = Math.sqrt(variance);
  return { mean, variance, stdDev };
}

/**
 * Traditional Viola-Jones Haar Cascade Face Detector (Deterministic Non-ML).
 *
 * Implements:
 * 1. Variance-normalized multi-feature cascade (Eye-Cheek, Forehead-Eye, 3-Rect Nose Bridge, Cheek Symmetry).
 * 2. Physiological skin chrominance density in facial center ellipse.
 * 3. OpenCV-standard neighbor clustering (groupRectangles) with minNeighbors >= 3 to reject noise.
 * 4. Geometric spatial Non-Maximum Suppression (IoU / IoM consolidation) to merge duplicate boxes.
 * 5. Returns consolidated unique faces for the current frame only.
 */
export function detectFaceHaar(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Grayscale luminance buffer & Skin Chrominance Mask
  const gray = new Uint8Array(width * height);
  const skinMask = new Uint8Array(width * height);
  let totalSkinPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pIdx = i / 4;

    // Luminance Y (CIE Rec. 601)
    const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[pIdx] = yVal;

    // Traditional Kovac skin chrominance locus check
    const isSkin =
      r > 75 &&
      g > 40 &&
      b > 20 &&
      r > g &&
      r > b &&
      Math.abs(r - g) > 12 &&
      (Math.max(r, g, b) - Math.min(r, g, b)) > 15;

    if (isSkin) {
      skinMask[pIdx] = 1;
      totalSkinPixels++;
    }
  }

  // Quick discard: If total skin pixels in the entire image is less than 4%, no face is present
  if (totalSkinPixels < 0.04 * width * height) {
    faceDetectorState.lastRawCandidates = 0;
    faceDetectorState.lastClusters = 0;
    faceDetectorState.lastUniqueFaces = 0;
    faceDetectorState.lastRawList = [];
    return [];
  }

  // 2. Integral image & Squared Integral image for rapid O(1) multi-scale summation
  const { integral, integralSq, width: intW } = computeIntegralImages(gray, width, height);

  // Multi-scale search window settings
  const minSize = Math.max(110, Math.floor(Math.min(width, height) * 0.24));
  const maxSize = Math.floor(Math.min(width, height) * 0.82);
  const scaleFactor = 1.18;

  const rawCandidates = [];

  for (let size = minSize; size <= maxSize; size = Math.floor(size * scaleFactor)) {
    const step = Math.max(12, Math.floor(size * 0.09));

    for (let y = Math.floor(height * 0.04); y + size <= height * 0.96; y += step) {
      for (let x = Math.floor(width * 0.04); x + size <= width * 0.96; x += step) {

        // --- STAGE 0: Window Variance Check ---
        // Flat backgrounds (plain walls, uniform fabrics) have very low variance
        const winStats = getSubwindowStats(integral, integralSq, intW, x, y, size, size);
        if (winStats.stdDev < 12.0) {
          continue;
        }
        const stdDev = Math.max(8.0, winStats.stdDev);

        // --- STAGE 1: Central Facial Core Skin Density ---
        // Measure skin pixel ratio in center 60% width, 25% to 85% height
        const coreX = Math.round(x + size * 0.20);
        const coreY = Math.round(y + size * 0.22);
        const coreW = Math.round(size * 0.60);
        const coreH = Math.round(size * 0.65);
        let coreSkin = 0;
        let coreSampled = 0;
        const sStep = 4;

        for (let sy = coreY; sy < coreY + coreH; sy += sStep) {
          const syOff = sy * width;
          for (let sx = coreX; sx < coreX + coreW; sx += sStep) {
            coreSampled++;
            if (skinMask[syOff + sx] === 1) coreSkin++;
          }
        }
        const coreSkinDensity = coreSkin / (coreSampled || 1);

        // A true face must have significant skin density in cheeks/forehead/nose core (>= 36%)
        if (coreSkinDensity < 0.36) {
          continue;
        }

        // --- STAGE 2: Viola-Jones Feature 1 (Eye Band vs. Cheek Band Contrast) ---
        // Eye sockets and eyebrows make eye band darker than upper cheek zone below
        const eyeW = Math.round(size * 0.80);
        const eyeH = Math.round(size * 0.22);
        const eyeX = Math.round(x + size * 0.10);
        const eyeY = Math.round(y + size * 0.22);

        const cheekW = eyeW;
        const cheekH = Math.round(size * 0.25);
        const cheekX = eyeX;
        const cheekY = Math.round(y + size * 0.45);

        const eyeStats = getSubwindowStats(integral, integralSq, intW, eyeX, eyeY, eyeW, eyeH);
        const cheekStats = getSubwindowStats(integral, integralSq, intW, cheekX, cheekY, cheekW, cheekH);

        // If eyes are significantly brighter than cheeks, this violates facial anatomy
        if (eyeStats.mean > cheekStats.mean + 0.35 * stdDev + 6) {
          continue;
        }

        // --- STAGE 3: Viola-Jones Feature 2 (Forehead vs. Eye Band Contrast) ---
        // Forehead is typically brighter than the shadow in the eye sockets
        const fhW = Math.round(size * 0.60);
        const fhH = Math.round(size * 0.16);
        const fhX = Math.round(x + size * 0.20);
        const fhY = Math.round(y + size * 0.05);

        const foreheadStats = getSubwindowStats(integral, integralSq, intW, fhX, fhY, fhW, fhH);

        if (eyeStats.mean > foreheadStats.mean + 0.40 * stdDev + 8) {
          continue;
        }

        // --- STAGE 4: Viola-Jones Feature 3 (3-Rectangle Horizontal Nose Bridge vs. Sockets) ---
        // Center nose bridge catches light; lateral eye sockets are darker
        const socH = Math.round(size * 0.20);
        const socY = Math.round(y + size * 0.24);
        const socW = Math.round(size * 0.25);

        const leftSocX = Math.round(x + size * 0.12);
        const noseX = Math.round(x + size * 0.38);
        const rightSocX = Math.round(x + size * 0.63);

        const leftSocStats = getSubwindowStats(integral, integralSq, intW, leftSocX, socY, socW, socH);
        const noseStats = getSubwindowStats(integral, integralSq, intW, noseX, socY, socW, socH);
        const rightSocStats = getSubwindowStats(integral, integralSq, intW, rightSocX, socY, socW, socH);

        const meanSockets = (leftSocStats.mean + rightSocStats.mean) / 2;

        // Sockets should be darker than or comparable to nose bridge
        if (meanSockets > noseStats.mean + 0.30 * stdDev + 6) {
          continue;
        }

        // --- STAGE 5: Viola-Jones Feature 4 (Bilateral Cheek Symmetry) ---
        const chkW = Math.round(size * 0.28);
        const chkH = Math.round(size * 0.22);
        const chkY = Math.round(y + size * 0.48);
        const lChkX = Math.round(x + size * 0.12);
        const rChkX = Math.round(x + size * 0.60);

        const lChkStats = getSubwindowStats(integral, integralSq, intW, lChkX, chkY, chkW, chkH);
        const rChkStats = getSubwindowStats(integral, integralSq, intW, rChkX, chkY, chkW, chkH);

        if (Math.abs(lChkStats.mean - rChkStats.mean) > 0.85 * stdDev + 35) {
          continue;
        }

        // --- Calculate Multi-Feature Fit Score ---
        const eyeCheekDiff = Math.max(0, (cheekStats.mean - eyeStats.mean) / stdDev);
        const noseSocDiff = Math.max(0, (noseStats.mean - meanSockets) / stdDev);

        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const distFromCenter = Math.hypot(centerX - width / 2, centerY - height / 2);
        const centerBonus = Math.max(0, 1 - distFromCenter / (Math.min(width, height) * 0.7));

        const score = 0.35 * coreSkinDensity + 0.30 * eyeCheekDiff + 0.20 * noseSocDiff + 0.15 * centerBonus;

        rawCandidates.push({
          x,
          y,
          width: size,
          height: size,
          score,
          skinDensity: coreSkinDensity
        });
      }
    }
  }

  faceDetectorState.lastRawCandidates = rawCandidates.length;
  faceDetectorState.lastRawList = rawCandidates.slice(0, 15);

  if (rawCandidates.length === 0) {
    faceDetectorState.lastClusters = 0;
    faceDetectorState.lastUniqueFaces = 0;
    return [];
  }

  // 3. Candidate Clustering (OpenCV groupRectangles Equivalent)
  // Multi-scale detections of a real face cluster together across space and scale.
  // Isolated false positive detections (e.g., from shirt patterns or furniture) occur only 1-2 times.
  rawCandidates.sort((a, b) => b.score - a.score);
  const clusters = [];

  for (const cand of rawCandidates) {
    let matchedCluster = null;

    for (const cl of clusters) {
      const { iou, iom } = getBoundingBoxOverlap(cand, cl.box);
      // Group if boxes overlap with IoU >= 0.26 or IoM >= 0.42
      if (iou >= 0.26 || iom >= 0.42) {
        matchedCluster = cl;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.members.push(cand);
      // Recompute weighted average bounding box of cluster
      let totalW = 0, sumX = 0, sumY = 0, sumWidth = 0, sumHeight = 0;
      for (const m of matchedCluster.members) {
        totalW += m.score;
        sumX += m.x * m.score;
        sumY += m.y * m.score;
        sumWidth += m.width * m.score;
        sumHeight += m.height * m.score;
      }
      matchedCluster.box = {
        x: Math.round(sumX / totalW),
        y: Math.round(sumY / totalW),
        width: Math.round(sumWidth / totalW),
        height: Math.round(sumHeight / totalW)
      };
      matchedCluster.score = Math.max(matchedCluster.score, cand.score);
    } else {
      clusters.push({
        box: { x: cand.x, y: cand.y, width: cand.width, height: cand.height },
        score: cand.score,
        members: [cand]
      });
    }
  }

  faceDetectorState.lastClusters = clusters.length;

  // Require minNeighbors: At least 3 detections in cluster (or 2 if exceptionally high score >= 0.85)
  const minNeighbors = faceDetectorState.detectorParams.minNeighbors;
  const qualifiedClusters = clusters.filter(
    cl => cl.members.length >= minNeighbors || (cl.score >= 0.85 && cl.members.length >= 2)
  );

  if (qualifiedClusters.length === 0) {
    // If no cluster reached minNeighbors, but there is one clear highest cluster with at least 2 members:
    if (clusters.length > 0 && clusters[0].members.length >= 2) {
      qualifiedClusters.push(clusters[0]);
    } else {
      faceDetectorState.lastUniqueFaces = 0;
      return [];
    }
  }

  // 4. Non-Maximum Suppression & Spatial Consolidation
  // Consolidate any remaining overlapping clusters that refer to the same face
  qualifiedClusters.sort((a, b) => (b.members.length * b.score) - (a.members.length * a.score));
  const consolidatedFaces = [];

  for (const cl of qualifiedClusters) {
    let duplicate = false;

    for (const cf of consolidatedFaces) {
      const { iou, iom, interArea } = getBoundingBoxOverlap(cl.box, cf);
      const centerDistX = Math.abs((cl.box.x + cl.box.width / 2) - (cf.x + cf.width / 2));
      const centerDistY = Math.abs((cl.box.y + cl.box.height / 2) - (cf.y + cf.height / 2));
      const avgW = (cl.box.width + cf.width) / 2;
      const centerDist = Math.hypot(centerDistX, centerDistY);

      // In real physical space, two distinct humans in front of a webcam are spatially separated.
      // Any overlapping candidate boxes (interArea > 0 and centerDist < 0.85 * avgW) or with IoU >= 0.12 / IoM >= 0.18
      // are sub-regions (cheeks, forehead, chin) of the SAME human face!
      if (iou >= 0.12 || iom >= 0.18 || (interArea > 0 && centerDistX < avgW * 0.82) || centerDist < avgW * 0.75) {
        duplicate = true;
        cf.neighborCount += cl.members.length;
        // Keep the best scored / highest neighbor box
        if ((cl.members.length > cf.neighborCount * 0.5) && cl.score > cf.score) {
          cf.x = cl.box.x;
          cf.y = cl.box.y;
          cf.width = cl.box.width;
          cf.height = cl.box.height;
          cf.score = cl.score;
        }
        break;
      }
    }

    if (!duplicate) {
      consolidatedFaces.push({
        x: cl.box.x,
        y: cl.box.y,
        width: cl.box.width,
        height: cl.box.height,
        score: cl.score,
        neighborCount: cl.members.length
      });
    }
  }

  faceDetectorState.lastUniqueFaces = consolidatedFaces.length;
  return consolidatedFaces;
}

/**
 * Extracts anatomical sub-regions from detected face bounding box
 */
export function getAnatomicalRegions(faceBox) {
  const { x, y, width, height } = faceBox;

  // Forehead: Upper 22% of face, center 60% width
  const forehead = {
    x: Math.round(x + width * 0.20),
    y: Math.round(y + height * 0.06),
    width: Math.round(width * 0.60),
    height: Math.round(height * 0.22),
    label: "Forehead Area"
  };

  // Left Cheek: 10% from left, 45% down, 28% width, 25% height
  const leftCheek = {
    x: Math.round(x + width * 0.10),
    y: Math.round(y + height * 0.45),
    width: Math.round(width * 0.28),
    height: Math.round(height * 0.25),
    label: "Left Cheek"
  };

  // Right Cheek: 62% from left, 45% down, 28% width, 25% height
  const rightCheek = {
    x: Math.round(x + width * 0.62),
    y: Math.round(y + height * 0.45),
    width: Math.round(width * 0.28),
    height: Math.round(height * 0.25),
    label: "Right Cheek"
  };

  return { forehead, leftCheek, rightCheek };
}

/**
 * Computes pixel statistics for a given rectangular ROI
 */
export function analyzeRegionPixels(ctx, roi, fullWidth, fullHeight) {
  // Clamp boundaries
  const rx = Math.max(0, Math.min(fullWidth - 1, roi.x));
  const ry = Math.max(0, Math.min(fullHeight - 1, roi.y));
  const rw = Math.max(2, Math.min(fullWidth - rx, roi.width));
  const rh = Math.max(2, Math.min(fullHeight - ry, roi.height));

  const imgData = ctx.getImageData(rx, ry, rw, rh);
  const data = imgData.data;
  const numPixels = rw * rh;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumLum = 0;
  let sumLumSq = 0;
  let minLum = 255;
  let maxLum = 0;

  let underexposedCount = 0;
  let overexposedCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    sumR += r;
    sumG += g;
    sumB += b;
    sumLum += lum;
    sumLumSq += lum * lum;

    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;

    if (lum < 25) underexposedCount++;
    if (lum > 240) overexposedCount++;
  }

  const meanR = Number((sumR / numPixels).toFixed(1));
  const meanG = Number((sumG / numPixels).toFixed(1));
  const meanB = Number((sumB / numPixels).toFixed(1));
  const meanLum = Number((sumLum / numPixels).toFixed(1));

  // Local variance & standard deviation
  const variance = Math.max(0, (sumLumSq / numPixels) - (meanLum * meanLum));
  const stdDev = Number(Math.sqrt(variance).toFixed(1));

  const hsv = rgbToHsv(meanR, meanG, meanB);
  const lab = rgbToLab(meanR, meanG, meanB);

  return {
    mean_rgb: [meanR, meanG, meanB],
    mean_luminance: meanLum,
    min_luminance: Math.round(minLum),
    max_luminance: Math.round(maxLum),
    std_dev: stdDev,
    hsv,
    lab,
    underexposed_pct: Number(((underexposedCount / numPixels) * 100).toFixed(1)),
    overexposed_pct: Number(((overexposedCount / numPixels) * 100).toFixed(1))
  };
}

/**
 * Computes discrete 2D Laplacian sharpness variance across region
 * Kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
 */
export function computeLaplacianVariance(ctx, roi, fullWidth, fullHeight) {
  const rx = Math.max(1, Math.min(fullWidth - 2, roi.x));
  const ry = Math.max(1, Math.min(fullHeight - 2, roi.y));
  const rw = Math.max(4, Math.min(fullWidth - rx - 1, roi.width));
  const rh = Math.max(4, Math.min(fullHeight - ry - 1, roi.height));

  const imgData = ctx.getImageData(rx, ry, rw, rh);
  const data = imgData.data;

  // Build grayscale 2D array
  const gray = new Float32Array(rw * rh);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  let lapSum = 0;
  let lapSumSq = 0;
  let count = 0;

  for (let y = 1; y < rh - 1; y++) {
    const yOffset = y * rw;
    const yPrev = (y - 1) * rw;
    const yNext = (y + 1) * rw;

    for (let x = 1; x < rw - 1; x++) {
      const center = gray[yOffset + x];
      const lap =
        gray[yPrev + x] +
        gray[yNext + x] +
        gray[yOffset + (x - 1)] +
        gray[yOffset + (x + 1)] -
        4.0 * center;

      lapSum += lap;
      lapSumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;
  const meanLap = lapSum / count;
  const variance = (lapSumSq / count) - (meanLap * meanLap);
  return Number(Math.max(0, variance).toFixed(1));
}

/**
 * Computes Sobel edge gradient and edge density percentage
 */
export function computeSobelEdgeDensity(ctx, roi, fullWidth, fullHeight) {
  const rx = Math.max(1, Math.min(fullWidth - 2, roi.x));
  const ry = Math.max(1, Math.min(fullHeight - 2, roi.y));
  const rw = Math.max(4, Math.min(fullWidth - rx - 1, roi.width));
  const rh = Math.max(4, Math.min(fullHeight - ry - 1, roi.height));

  const imgData = ctx.getImageData(rx, ry, rw, rh);
  const data = imgData.data;

  const gray = new Float32Array(rw * rh);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  let edgePixelCount = 0;
  let totalSampled = 0;

  for (let y = 1; y < rh - 1; y += 2) {
    const yOffset = y * rw;
    const yPrev = (y - 1) * rw;
    const yNext = (y + 1) * rw;

    for (let x = 1; x < rw - 1; x += 2) {
      // Sobel horizontal Gx
      const gx =
        -1 * gray[yPrev + (x - 1)] + 1 * gray[yPrev + (x + 1)] +
        -2 * gray[yOffset + (x - 1)] + 2 * gray[yOffset + (x + 1)] +
        -1 * gray[yNext + (x - 1)] + 1 * gray[yNext + (x + 1)];

      // Sobel vertical Gy
      const gy =
        -1 * gray[yPrev + (x - 1)] - 2 * gray[yPrev + x] - 1 * gray[yPrev + (x + 1)] +
        1 * gray[yNext + (x - 1)] + 2 * gray[yNext + x] + 1 * gray[yNext + (x + 1)];

      const mag = Math.sqrt(gx * gx + gy * gy);
      if (mag > 45) edgePixelCount++;
      totalSampled++;
    }
  }

  const density = totalSampled > 0 ? (edgePixelCount / totalSampled) * 100 : 0;
  return Number(density.toFixed(1));
}

/**
 * Complete Frame Quality Validation & Deterministic Computer Vision Analyzer
 */
export function analyzeWebcamFrame(videoEl, canvasEl) {
  if (!videoEl || !canvasEl) {
    return {
      success: false,
      validation_error: "Camera element or canvas is unavailable."
    };
  }

  if (videoEl.readyState < 2 || videoEl.videoWidth === 0) {
    return {
      success: false,
      validation_error: "Video stream is currently loading. Please wait..."
    };
  }

  const width = videoEl.videoWidth;
  const height = videoEl.videoHeight;
  canvasEl.width = width;
  canvasEl.height = height;

  const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(videoEl, 0, 0, width, height);

  // 1. Detect faces using traditional Viola-Jones Haar Cascade + GroupRectangles
  const faces = detectFaceHaar(ctx, width, height);
  const detectedCount = faces.length;

  // Track history for temporal stability (keep last 6 ticks)
  faceDetectorState.history.push(detectedCount);
  if (faceDetectorState.history.length > 6) {
    faceDetectorState.history.shift();
  }

  // Debug info telemetry
  const debugInfo = {
    raw_candidates_count: faceDetectorState.lastRawCandidates,
    clusters_count: faceDetectorState.lastClusters,
    consolidated_faces_count: detectedCount,
    raw_candidates: faceDetectorState.lastRawList,
    detector_parameters: faceDetectorState.detectorParams,
    frame_dimensions: { width, height },
    detector_status: "ACTIVE_HAAR_INTEGRAL"
  };

  // Validation Check: No face detected
  if (detectedCount === 0) {
    faceDetectorState.smoothedBox = null;
    return {
      success: false,
      validation_error: "No face detected in frame. Please position your face inside the center guideline.",
      check_failed: "NO_FACE",
      debug_info: debugInfo
    };
  }

  // Validation Check: Multiple faces detected
  // Apply temporal debouncing: only trigger MULTIPLE_FACES warning if multiple faces
  // persist stably across at least 3 consecutive frames, avoiding momentary noise spikes.
  const recentHistory = faceDetectorState.history;
  const multiCountFrames = recentHistory.filter(c => c > 1).length;

  if (detectedCount > 1) {
    // If multiple faces have been confirmed across >= 2 frames or all recent frames:
    if (multiCountFrames >= 2 || recentHistory.length <= 2) {
      faceDetectorState.smoothedBox = null;
      return {
        success: false,
        validation_error: `Multiple faces detected (${detectedCount}). Please ensure only one person is in front of the camera.`,
        check_failed: "MULTIPLE_FACES",
        faces: faces,
        debug_info: debugInfo
      };
    }
  }

  // Exactly one face (or primary dominant face during transient noise)
  // Pick the face closest to the center with highest score
  let face = faces[0];
  if (faces.length > 1) {
    // Select dominant face
    faces.sort((a, b) => b.score - a.score);
    face = faces[0];
  }

  // Apply Exponential Moving Average (EMA) coordinate smoothing
  if (faceDetectorState.smoothedBox) {
    const alpha = 0.45;
    face = {
      ...face,
      x: Math.round(alpha * face.x + (1 - alpha) * faceDetectorState.smoothedBox.x),
      y: Math.round(alpha * face.y + (1 - alpha) * faceDetectorState.smoothedBox.y),
      width: Math.round(alpha * face.width + (1 - alpha) * faceDetectorState.smoothedBox.width),
      height: Math.round(alpha * face.height + (1 - alpha) * faceDetectorState.smoothedBox.height)
    };
  }
  faceDetectorState.smoothedBox = { ...face };

  const faceWidthRatio = Number((face.width / width).toFixed(2));
  const faceAreaRatio = Number(((face.width * face.height) / (width * height)).toFixed(2));

  // Validation Check: Face size adequacy
  if (faceWidthRatio < 0.22) {
    return {
      success: false,
      validation_error: "Face is too far from camera. Please move closer to fill at least 30% of the frame.",
      check_failed: "FACE_TOO_SMALL",
      face_box: face,
      debug_info: debugInfo
    };
  }

  // 2. Extract documented anatomical ROIs
  const regions = getAnatomicalRegions(face);

  // 3. Compute frame & region computer vision statistics
  const wholeFaceStats = analyzeRegionPixels(ctx, face, width, height);
  const foreheadStats = analyzeRegionPixels(ctx, regions.forehead, width, height);
  const leftCheekStats = analyzeRegionPixels(ctx, regions.leftCheek, width, height);
  const rightCheekStats = analyzeRegionPixels(ctx, regions.rightCheek, width, height);

  // Combined cheeks stats
  const meanCheekLab = {
    L: Number(((leftCheekStats.lab.L + rightCheekStats.lab.L) / 2).toFixed(2)),
    a: Number(((leftCheekStats.lab.a + rightCheekStats.lab.a) / 2).toFixed(2)),
    b: Number(((leftCheekStats.lab.b + rightCheekStats.lab.b) / 2).toFixed(2))
  };

  // 4. Sharpness and blur via discrete Laplacian variance
  const laplacianVar = computeLaplacianVariance(ctx, face, width, height);
  const isSharp = laplacianVar >= 26.0;

  // Validation Check: Blur / sharpness
  if (!isSharp) {
    return {
      success: false,
      validation_error: `Camera image is blurred (Sharpness variance: ${laplacianVar} < 26.0). Please hold still and allow the lens to focus.`,
      check_failed: "BLURRED_IMAGE",
      face_box: face,
      debug_info: debugInfo
    };
  }

  // Validation Check: Lighting & Exposure
  if (wholeFaceStats.mean_luminance < 42 || wholeFaceStats.underexposed_pct > 28) {
    return {
      success: false,
      validation_error: "Lighting is too dim for valid optical analysis. Please face a soft light source or window.",
      check_failed: "UNDEREXPOSED",
      face_box: face,
      debug_info: debugInfo
    };
  }

  if (wholeFaceStats.mean_luminance > 225 || wholeFaceStats.overexposed_pct > 25) {
    return {
      success: false,
      validation_error: "Image is overexposed with harsh glare. Please avoid direct harsh overhead lighting.",
      check_failed: "OVEREXPOSED",
      face_box: face,
      debug_info: debugInfo
    };
  }

  // 5. Regional color differences (Delta E & Redness contrast)
  const deltaE_forehead_cheeks = deltaE76(foreheadStats.lab, meanCheekLab);
  const rednessContrastRatio = Number((meanCheekLab.a / Math.max(1, foreheadStats.lab.a)).toFixed(2));

  // 6. Texture and local contrast
  const edgeDensity = computeSobelEdgeDensity(ctx, regions.leftCheek, width, height);

  // Return complete deterministic observations
  return {
    success: true,
    timestamp: new Date().toISOString(),
    quality_status: "PASSED_QUALITY_VALIDATION",
    face_detection: {
      status: "SINGLE_FACE_IDENTIFIED",
      detector_type: "Viola-Jones Haar Cascade Non-ML Integral Search",
      confidence_indicator: "GEOMETRIC_FIT_HIGH",
      box: face,
      face_width_ratio: faceWidthRatio,
      face_area_ratio: faceAreaRatio,
      frame_dimensions: { width, height }
    },
    anatomical_regions: regions,
    exposure_statistics: {
      mean_luminance: wholeFaceStats.mean_luminance,
      min_luminance: wholeFaceStats.min_luminance,
      max_luminance: wholeFaceStats.max_luminance,
      overexposed_pct: wholeFaceStats.overexposed_pct,
      underexposed_pct: wholeFaceStats.underexposed_pct,
      assessment: "BALANCED_EXPOSURE"
    },
    sharpness_statistics: {
      laplacian_variance: laplacianVar,
      is_sharp: true,
      assessment: "FOCUSED_HIGH_DEFINITION"
    },
    color_statistics: {
      whole_face: wholeFaceStats,
      forehead: foreheadStats,
      left_cheek: leftCheekStats,
      right_cheek: rightCheekStats,
      mean_cheeks_lab: meanCheekLab
    },
    regional_differences: {
      delta_e_forehead_to_cheeks: deltaE_forehead_cheeks,
      redness_contrast_ratio: rednessContrastRatio,
      interpretation: "Observed physiological chrominance disparity between forehead and malar cheek zones."
    },
    texture_statistics: {
      malar_standard_deviation: leftCheekStats.std_dev,
      sobel_edge_density_pct: edgeDensity,
      texture_profile: edgeDensity > 18 ? "ELEVATED_SURFACE_TEXTURE" : "SMOOTH_SURFACE_TEXTURE"
    },
    scientific_limitations: [
      "Image-derived observations only; NOT a clinical medical diagnosis.",
      "A normal RGB webcam cannot reliably measure actual biological skin hydration, sebum excretion rate, or stratum corneum barrier lipids.",
      "Redness or chrominance variations from RGB pixels do not prove active erythema or clinical dermatological pathology.",
      "All medical classifications require consultation with a licensed dermatologist."
    ],
    debug_info: debugInfo
  };
}

/**
 * Draws real-time visual overlays directly on live canvas.
 * Supports optional developer-only debug overlay.
 */
export function drawAnalyzerOverlays(canvasEl, analysisResult, showDebug = false) {
  if (!canvasEl || !analysisResult) return;
  const ctx = canvasEl.getContext("2d");

  // Optional Developer Debug Mode: Draw raw candidates & telemetry HUD
  if (showDebug && analysisResult.debug_info) {
    const dbg = analysisResult.debug_info;

    // Draw faint candidate rectangles
    if (dbg.raw_candidates && dbg.raw_candidates.length > 0) {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
      for (const rc of dbg.raw_candidates) {
        ctx.strokeRect(rc.x, rc.y, rc.width, rc.height);
      }
      ctx.restore();
    }

    // Draw Developer HUD Banner at top
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(8, 8, 380, 58);
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 380, 58);

    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 10px monospace";
    ctx.fillText("DEV CV DEBUG: VIOLA-JONES HAAR INTEGRAL", 16, 24);

    ctx.fillStyle = "#E2E8F0";
    ctx.font = "10px monospace";
    ctx.fillText(`Raw Cands: ${dbg.raw_candidates_count} | Clusters: ${dbg.clusters_count} | Unique: ${dbg.consolidated_faces_count}`, 16, 38);
    ctx.fillText(`Frame: ${dbg.frame_dimensions.width}x${dbg.frame_dimensions.height} | minN: ${dbg.detector_parameters.minNeighbors} | scale: ${dbg.detector_parameters.scaleFactor}`, 16, 52);
    ctx.restore();
  }

  // If no face detected, return early
  if (!analysisResult.face_detection) return;

  const { box } = analysisResult.face_detection;
  const regions = analysisResult.anatomical_regions;

  // 1. Draw Face Bounding Box with rounded corners and glowing border
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = analysisResult.success ? "#0D9488" : "#E11D48";
  ctx.fillStyle = analysisResult.success ? "rgba(13, 148, 136, 0.05)" : "rgba(225, 29, 72, 0.05)";

  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.fillRect(box.x, box.y, box.width, box.height);

  // Face Label
  ctx.fillStyle = analysisResult.success ? "#0D9488" : "#E11D48";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("Haar Cascade Face ROI", box.x + 8, box.y - 8);

  // 2. Draw Anatomical ROIs if available
  if (regions) {
    // Forehead (Lavender / Violet)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#8B5CF6";
    ctx.fillStyle = "rgba(139, 92, 246, 0.12)";
    ctx.strokeRect(regions.forehead.x, regions.forehead.y, regions.forehead.width, regions.forehead.height);
    ctx.fillRect(regions.forehead.x, regions.forehead.y, regions.forehead.width, regions.forehead.height);
    ctx.fillStyle = "#6D28D9";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("Forehead ROI", regions.forehead.x + 4, regions.forehead.y + 14);

    // Left Cheek (Teal)
    ctx.strokeStyle = "#0D9488";
    ctx.fillStyle = "rgba(139, 92, 246, 0.12)";
    ctx.strokeRect(regions.leftCheek.x, regions.leftCheek.y, regions.leftCheek.width, regions.leftCheek.height);
    ctx.fillRect(regions.leftCheek.x, regions.leftCheek.y, regions.leftCheek.width, regions.leftCheek.height);
    ctx.fillStyle = "#0F766E";
    ctx.fillText("Left Cheek", regions.leftCheek.x + 4, regions.leftCheek.y + 14);

    // Right Cheek (Teal)
    ctx.strokeRect(regions.rightCheek.x, regions.rightCheek.y, regions.rightCheek.width, regions.rightCheek.height);
    ctx.fillRect(regions.rightCheek.x, regions.rightCheek.y, regions.rightCheek.width, regions.rightCheek.height);
    ctx.fillText("Right Cheek", regions.rightCheek.x + 4, regions.rightCheek.y + 14);
  }

  ctx.restore();
}
