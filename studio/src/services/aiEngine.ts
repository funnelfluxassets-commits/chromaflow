/**
 * ChromaFlow AI Engine Service
 * Real AI generation integration for:
 * 1. Kling 2.6 (image-to-video / text-to-video via Kie.ai)
 * 2. NanoBanana Pro (2K photorealistic frame generation via Kie.ai)
 * 3. Pollinations Flux (instant free AI frame generation)
 * 4. Google Colab GPU (private Wan 2.1 / LTX-Video Gradio tunnel)
 */

export const DEFAULT_KIE_KEY: string = (import.meta as any).env?.VITE_KIE_API_KEY || '';
const KIE_API_BASE = 'https://api.kie.ai/api/v1/jobs';
const KIE_UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-stream-upload';

export interface ProgressCallback {
  (stage: string, percent: number, elapsedSec: number): void;
}

/**
 * Upload local image/video to Kie.ai public CDN for AI model ingestion
 */
export async function uploadMediaToKie(file: File, apiKey: string = DEFAULT_KIE_KEY): Promise<string> {
  const key = apiKey.trim() || DEFAULT_KIE_KEY;
  if (!key) {
    throw new Error('Please enter your Kie.ai API key in Settings (stored privately in your browser).');
  }
  const formData = new FormData();
  formData.append('uploadPath', 'chromaflow');
  formData.append('file', file);

  const res = await fetch(KIE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`File upload failed with status ${res.status}`);
  }

  const json = await res.json();
  const downloadUrl = json.data?.downloadUrl || json.data?.fileUrl;
  if (!downloadUrl) {
    throw new Error(json.msg || 'Failed to extract uploaded file URL');
  }

  return downloadUrl;
}

/**
 * Generate 2K AI Starting Frame using NanoBanana Pro (Kie.ai)
 */
export async function generateFrameNanoBanana(
  prompt: string,
  aspectRatio: string = '9:16',
  apiKey: string = DEFAULT_KIE_KEY,
  onProgress?: ProgressCallback
): Promise<string> {
  const key = apiKey.trim() || DEFAULT_KIE_KEY;
  onProgress?.('Dispatching NanoBanana Pro 2K frame generator...', 10, 1);

  const createRes = await fetch(`${KIE_API_BASE}/createTask`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nano-banana-pro',
      input: {
        prompt: `${prompt.trim()}, cinematic lighting, master composition, 8k photography, crisp detail`,
        aspect_ratio: aspectRatio,
        resolution: '2K',
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`NanoBanana task creation failed (${createRes.status})`);
  }

  const createData = await createRes.json();
  const taskId = createData.data?.taskId;
  if (!taskId) {
    throw new Error(createData.msg || 'No taskId returned from NanoBanana');
  }

  // Poll for completion (up to 3 minutes)
  const startTime = Date.now();
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const percent = Math.min(90, 15 + i * 4);
    onProgress?.(`NanoBanana Pro rendering 2K frame (${elapsed}s)...`, percent, elapsed);

    try {
      const pollRes = await fetch(`${KIE_API_BASE}/recordInfo?taskId=${taskId}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      const state = pollData.data?.state;

      if (state === 'success') {
        const d = pollData.data;
        let imgUrl: string | undefined;

        if (d.resultJson) {
          try {
            const parsed = JSON.parse(d.resultJson);
            if (Array.isArray(parsed?.resultUrls) && parsed.resultUrls[0]) {
              imgUrl = parsed.resultUrls[0];
            } else if (Array.isArray(parsed) && parsed[0]) {
              imgUrl = parsed[0];
            }
          } catch (e) {
            // ignore
          }
        }
        if (!imgUrl && d.response?.resultUrls?.[0]) {
          imgUrl = d.response.resultUrls[0];
        }
        if (!imgUrl && d.resultUrl) {
          imgUrl = d.resultUrl;
        }

        if (imgUrl) {
          onProgress?.('2K AI Frame Render Complete', 100, elapsed);
          return imgUrl;
        }
      } else if (state === 'fail') {
        throw new Error(pollData.data?.failMsg || 'NanoBanana generation failed');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('NanoBanana generation failed')) {
        throw err;
      }
    }
  }

  throw new Error('NanoBanana generation timed out');
}

/**
 * Generate Instant Starting Frame with Pollinations Flux (Free Fallback)
 */
export function generateFramePollinations(
  prompt: string,
  aspectRatio: string = '9:16'
): string {
  const [w, h] = aspectRatio === '9:16' ? [720, 1280] : aspectRatio === '16:9' ? [1280, 720] : [1024, 1024];
  const cleanPrompt = encodeURIComponent(`${prompt}, cinematic lighting, photorealistic 8k, highly detailed`);
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${w}&height=${h}&model=flux&nologo=true&seed=${Math.floor(Math.random() * 9999999)}`;
}

/**
 * Generate Hollywood-Grade Video with Kling 2.6 (Image-to-Video via Kie.ai)
 */
export async function generateVideoKling(
  prompt: string,
  imageUrl: string,
  durationSec: number = 5,
  apiKey: string = DEFAULT_KIE_KEY,
  onProgress?: ProgressCallback
): Promise<string> {
  const key = apiKey.trim() || DEFAULT_KIE_KEY;

  onProgress?.('Phase 1/3: Dispatching Kling 2.6 Neural Motion Engine...', 20, 1);

  const payload = {
    model: 'kling-2.6/image-to-video',
    input: {
      prompt: `${prompt.trim()}, smooth cinematic camera motion, photorealistic motion blur, high definition`,
      image_urls: [imageUrl],
      duration: String(durationSec),
      sound: false,
    },
  };

  const createRes = await fetch(`${KIE_API_BASE}/createTask`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    throw new Error(`Kling 2.6 task creation failed (${createRes.status})`);
  }

  const createData = await createRes.json();
  const taskId = createData.data?.taskId;
  if (!taskId) {
    throw new Error(createData.msg || 'No taskId returned from Kling 2.6');
  }

  onProgress?.('Phase 2/3: Task queued on Kling GPU cluster...', 35, 3);

  // Poll for completion (up to 5 minutes)
  const startTime = Date.now();
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    // Smooth progress from 35% up to 96%
    const percent = Math.min(96, 35 + Math.round((elapsed / 80) * 60));
    onProgress?.(`Phase 3/3: Kling 2.6 rendering motion frames (${elapsed}s elapsed)...`, percent, elapsed);

    try {
      const pollRes = await fetch(`${KIE_API_BASE}/recordInfo?taskId=${taskId}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      const state = pollData.data?.state;

      if (state === 'success') {
        const d = pollData.data;
        let videoUrl: string | undefined;

        if (d.resultJson) {
          try {
            const parsed = JSON.parse(d.resultJson);
            if (Array.isArray(parsed?.resultUrls) && parsed.resultUrls[0]) {
              videoUrl = parsed.resultUrls[0];
            } else if (Array.isArray(parsed) && parsed[0]) {
              videoUrl = parsed[0];
            } else if (parsed?.videos?.[0]?.url) {
              videoUrl = parsed.videos[0].url;
            }
          } catch (e) {
            // ignore
          }
        }
        if (!videoUrl && d.response?.resultUrls?.[0]) {
          videoUrl = d.response.resultUrls[0];
        }
        if (!videoUrl && d.resultUrl) {
          videoUrl = d.resultUrl;
        }

        if (videoUrl) {
          onProgress?.('Kling 2.6 Video Render Complete!', 100, elapsed);
          return videoUrl;
        }
      } else if (state === 'fail') {
        throw new Error(pollData.data?.failMsg || 'Kling 2.6 video generation failed');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Kling 2.6 video generation failed')) {
        throw err;
      }
    }
  }

  throw new Error('Kling 2.6 video generation timed out (exceeded 5 minutes)');
}

export const COLAB_NOTEBOOK_URL =
  'https://colab.research.google.com/github/funnelfluxassets-commits/chromaflow/blob/main/backend/colab/ChromaFlow_GPU_Backend.ipynb';

/**
 * Generate Video using Google Colab GPU (Wan 2.1 / LTX-Video via Gradio Tunnel)
 */
export async function generateVideoColab(
  prompt: string,
  colabUrl: string,
  startImageUrl?: string,
  endImageUrl?: string,
  aspectRatio: string = '9:16',
  durationSec: number = 5,
  onProgress?: ProgressCallback
): Promise<string> {
  const cleanUrl = colabUrl.trim().replace(/\/$/, '');
  if (!cleanUrl) {
    throw new Error('Please configure your Google Colab Gradio Tunnel URL in Settings');
  }

  // Resolve relative asset URLs to fully qualified HTTP URLs so Colab can fetch them
  const resolvedStartImage = startImageUrl?.startsWith('/')
    ? `${window.location.origin}${startImageUrl}`
    : startImageUrl;
  const resolvedEndImage = endImageUrl?.startsWith('/')
    ? `${window.location.origin}${endImageUrl}`
    : endImageUrl;

  onProgress?.('Connecting to private Colab GPU instance...', 15, 1);

  // Detect whether the running Colab server expects Image FileData objects or plain URL strings
  let expectsImageFileData = false;
  try {
    const infoRes = await fetch(`${cleanUrl}/gradio_api/info`);
    if (infoRes.ok) {
      const infoText = await infoRes.text();
      if (infoText.includes('No interface is running')) {
        throw new Error(
          'Your Google Colab server has stopped. Please click Play on Step 3 in Colab and paste the new .gradio.live link.'
        );
      }
      const infoJson = JSON.parse(infoText);
      const params = infoJson?.named_endpoints?.['/generate_video']?.parameters || [];
      const startParam = params.find((p: any) => p.parameter_name === 'start_image');
      if (startParam && startParam.component === 'Image') {
        expectsImageFileData = true;
      }
    }
  } catch (e: any) {
    if (e.message && e.message.includes('Google Colab server has stopped')) {
      throw e;
    }
  }

  const formatImgArg = (url?: string) => {
    if (!url) return expectsImageFileData ? null : '';
    if (expectsImageFileData) {
      return { path: url, url, meta: { _type: 'gradio.FileData' } };
    }
    return url;
  };

  const payload = {
    data: [
      prompt,
      'watermark, text, logo, signature, low quality, blurry',
      formatImgArg(resolvedStartImage),
      formatImgArg(resolvedEndImage),
      aspectRatio,
      durationSec,
      -1,
      'LTX-Video (Fastest 24fps)',
    ],
  };

  onProgress?.('Sending scene to Colab GPU...', 20, 1);

  const postRes = await fetch(`${cleanUrl}/gradio_api/call/generate_video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!postRes.ok) {
    const errText = await postRes.text();
    if (errText.includes('No interface is running')) {
      throw new Error(
        'Your Google Colab server has stopped. Please click Play on Step 3 in Colab and paste the new .gradio.live link.'
      );
    }
    throw new Error(`Colab GPU connection error (${postRes.status}): ${errText.slice(0, 180)}`);
  }

  const postJson = await postRes.json();
  const eventId = postJson.event_id;
  if (!eventId) {
    throw new Error('No task event_id returned by Google Colab');
  }

  return streamGradioResult(
    cleanUrl,
    'generate_video',
    eventId,
    (elapsed) => {
      // Progress creeps toward 95% over ~3 minutes; timer always keeps ticking
      const percent = Math.min(95, 25 + Math.round((elapsed / 180) * 70));
      const msg =
        elapsed < 120
          ? `Colab GPU rendering motion frames (${elapsed}s elapsed)...`
          : `Still rendering on Colab GPU (${elapsed}s) — first run may be loading the model...`;
      onProgress?.(msg, percent, elapsed);
    },
    15 * 60 // 15 minute ceiling (first run may download the model)
  ).then((url) => {
    onProgress?.('Colab GPU Video Render Complete!', 100, 0);
    return url;
  });
}

/**
 * Reads a Gradio 5/6 SSE result stream incrementally.
 * The stream stays open until the job finishes, so we must read chunks as they
 * arrive (not await .text(), which blocks until the end and freezes the UI).
 */
async function streamGradioResult(
  cleanUrl: string,
  apiName: string,
  eventId: string,
  onTick: (elapsedSec: number) => void,
  timeoutSec: number
): Promise<string> {
  const startTime = Date.now();
  const controller = new AbortController();
  const ticker = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    onTick(elapsed);
    if (elapsed > timeoutSec) controller.abort();
  }, 1000);

  const extractUrl = (data: string): string | undefined => {
    try {
      const parsed = JSON.parse(data);
      const item = Array.isArray(parsed) ? parsed[0] : parsed;
      if (typeof item === 'string' && item.startsWith('http')) return item;
      if (item?.video) return extractUrl(JSON.stringify(item.video));
      if (item?.url) return item.url;
      if (item?.path) return `${cleanUrl}/gradio_api/file=${item.path}`;
    } catch {
      /* ignore */
    }
    return undefined;
  };

  try {
    const res = await fetch(`${cleanUrl}/gradio_api/call/${apiName}/${eventId}`, {
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(
        `Colab GPU tunnel disconnected (${res.status}). Please check that Step 3 in Google Colab is still running.`
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (currentEvent === 'complete') {
            const url = extractUrl(data);
            if (url) return url;
            throw new Error('Colab finished but returned no video file.');
          }
          if (currentEvent === 'error') {
            let msg = data;
            try {
              const parsed = JSON.parse(data);
              msg = typeof parsed === 'string' ? parsed : parsed?.message || parsed?.error || data;
            } catch {
              /* keep raw */
            }
            if (!msg || msg === 'null') {
              msg = 'Colab reported an error. Please check the Step 3 output in your Colab tab.';
            }
            throw new Error(`Colab GPU error: ${msg}`);
          }
        }
      }
    }

    throw new Error(
      'Connection to Colab closed before the video finished. Check that Step 3 in Colab is still running, then retry.'
    );
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error(`Colab GPU timed out after ${Math.round(timeoutSec / 60)} minutes.`);
    }
    throw e;
  } finally {
    clearInterval(ticker);
  }
}

/**
 * Upscale Video using Google Colab GPU (4K Super-Resolution)
 */
export async function upscaleVideoColab(
  videoUrl: string,
  colabUrl: string,
  scale: number = 4,
  onProgress?: ProgressCallback
): Promise<string> {
  const cleanUrl = colabUrl.trim().replace(/\/$/, '');
  if (!cleanUrl) {
    throw new Error('Please configure your Google Colab Gradio Tunnel URL in Settings');
  }

  onProgress?.('Connecting to Colab True 4K UHD Super-Resolution Engine...', 20, 1);

  const payload = {
    data: [videoUrl, scale],
  };

  onProgress?.('Synthesizing True 4K UHD (2160p/3840p) frames on GPU...', 35, 2);

  let postRes: Response;
  try {
    postRes = await fetch(`${cleanUrl}/gradio_api/call/upscale_video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      'Could not reach your Google Colab GPU server. Please make sure Step 3 in Colab is running and paste the active .gradio.live link.'
    );
  }

  if (!postRes.ok) {
    const errText = await postRes.text().catch(() => '');
    if (errText.includes('No interface is running')) {
      throw new Error(
        'Your Google Colab server has stopped. Please click Play on Step 3 in Colab and paste the new .gradio.live link.'
      );
    }
    throw new Error(`Colab 4K upscaler returned error status ${postRes.status}`);
  }

  const postJson = await postRes.json();
  const eventId = postJson.event_id;
  if (!eventId) {
    throw new Error('No task event_id returned by Colab upscaler');
  }

  return streamGradioResult(
    cleanUrl,
    'upscale_video',
    eventId,
    (elapsed) => {
      const percent = Math.min(95, 25 + Math.round((elapsed / 35) * 70));
      onProgress?.(`Colab GPU upscaling frames to True 4K UHD (${elapsed}s elapsed)...`, percent, elapsed);
    },
    10 * 60
  ).then((url) => {
    onProgress?.('True 4K UHD Super-Resolution Complete!', 100, 0);
    return url;
  });
}
