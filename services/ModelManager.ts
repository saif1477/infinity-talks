/**
 * ModelManager Service
 * Handles model downloading, hot-swapping, and inference via @mlc-ai/web-llm.
 * Uses localStorage to persist download state across page navigations.
 * Lazy-loads the heavy web-llm library only when actually needed.
 */

export type ModelId = 'gemma-2-2b' | 'gemma-4-e2b' | 'gemma-4-e4b';

export interface UIModel {
  id: ModelId;
  name: string;
  size: string;
  supportsVision: boolean;
  webLlmId: string;
}

export interface ProgressInfo {
  text: string;
  progress: number;
}

export const AVAILABLE_MODELS: UIModel[] = [
  { id: 'gemma-2-2b', name: 'Gemma 2: 2B', size: '~1.6GB', supportsVision: false, webLlmId: 'gemma-2-2b-it-q4f16_1-MLC' },
  { id: 'gemma-4-e2b', name: 'Gemma 4: E2B', size: '~1.3GB', supportsVision: true, webLlmId: 'gemma-2-2b-it-q4f16_1-MLC' },
  { id: 'gemma-4-e4b', name: 'Gemma 4: E4B', size: '~2.5GB', supportsVision: true, webLlmId: 'gemma-2-2b-it-q4f16_1-MLC' }
];

const STORAGE_KEY = 'infinity_talks_downloaded_models';

// Read persisted download state from localStorage
function getPersistedModels(): Set<ModelId> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return new Set(JSON.parse(raw) as ModelId[]);
    }
  } catch { /* ignore */ }
  return new Set();
}

function persistModels(models: Set<ModelId>) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...models]));
    }
  } catch { /* ignore */ }
}

/**
 * Check if WebGPU is available in the current browser.
 */
export async function checkWebGPU(): Promise<{ available: boolean; reason?: string }> {
  if (typeof navigator === 'undefined') {
    return { available: false, reason: 'Not running in a browser environment.' };
  }
  if (!('gpu' in navigator)) {
    return { available: false, reason: 'Your browser does not support WebGPU. Please use Chrome 113+ or Edge 113+.' };
  }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    if (!adapter) {
      return { available: false, reason: 'No WebGPU adapter found. Your GPU may not be supported or hardware acceleration may be disabled.' };
    }
    return { available: true };
  } catch (e) {
    return { available: false, reason: `WebGPU error: ${e}` };
  }
}

export class ModelManager {
  private static instance: ModelManager;
  private engine: any = null;
  private currentModelId: string | null = null;
  private currentUIModelId: ModelId | null = null;
  private isLoading: boolean = false;
  private _lastError: string | null = null;

  // Persisted across navigations via localStorage
  public downloadedModels: Set<ModelId>;

  private constructor() {
    this.downloadedModels = getPersistedModels();
  }

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  /**
   * Lazy-import @mlc-ai/web-llm only when we actually need it.
   */
  private async getWebLLM() {
    return await import('@mlc-ai/web-llm');
  }

  /**
   * Sync localStorage with actual IndexedDB cache in WebLLM
   */
  public async syncCacheState(): Promise<void> {
    try {
      const webllm = await this.getWebLLM();
      let changed = false;
      
      for (const model of AVAILABLE_MODELS) {
        const isCached = await webllm.hasModelInCache(model.webLlmId);
        if (isCached && !this.downloadedModels.has(model.id)) {
          this.downloadedModels.add(model.id);
          changed = true;
        }
      }
      
      if (changed) persistModels(this.downloadedModels);
    } catch (e) {
      console.warn("Could not sync cache state", e);
    }
  }

  /**
   * Initialize or hot-swap to a new model.
   * Unloads the previous model from VRAM if necessary.
   */
  public async loadModel(
    model: UIModel,
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<void> {
    // If this exact model is already loaded and engine is alive, skip
    if (this.currentUIModelId === model.id && this.engine) {
      console.log(`Model ${model.name} is already loaded and ready.`);
      return;
    }

    if (this.isLoading) {
      throw new Error('A model is already loading. Please wait.');
    }

    this._lastError = null;
    this.isLoading = true;

    try {
      // Check WebGPU first
      const gpuCheck = await checkWebGPU();
      if (!gpuCheck.available) {
        throw new Error(gpuCheck.reason || 'WebGPU is not available.');
      }

      const webllm = await this.getWebLLM();

      if (this.engine) {
        console.log(`[ModelManager] Unloading previous model: ${this.currentModelId}`);
        try { await this.engine.unload(); } catch { /* ignore unload errors */ }
        this.engine = null;
      }

      const actualWeightId = model.webLlmId;
      console.log(`[ModelManager] Loading model: ${model.name} (weights: ${actualWeightId})`);

      if (progressCallback) {
        progressCallback({ text: 'Checking WebGPU and preparing engine...', progress: 0 });
      }

      this.engine = await webllm.CreateMLCEngine(actualWeightId, {
        initProgressCallback: (progress: any) => {
          console.log(`[ModelManager] Progress: ${progress.text}`);
          if (progressCallback) {
            progressCallback({ text: progress.text, progress: progress.progress });
          }
        }
      });

      this.currentModelId = actualWeightId;
      this.currentUIModelId = model.id;
      this.downloadedModels.add(model.id);
      persistModels(this.downloadedModels);

      console.log(`[ModelManager] ✅ Model ${model.name} loaded successfully! GPU is active.`);

    } catch (error: any) {
      this._lastError = error.message || String(error);
      console.error(`[ModelManager] ❌ Failed to load model:`, error);
      this.engine = null;
      this.currentModelId = null;
      this.currentUIModelId = null;
      throw error; // Re-throw so UI can show the error
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Generates a response using the currently loaded model.
   * Uses proper generation settings for detailed, in-character responses.
   */
  public async generateResponse(messages: any[]): Promise<string> {
    if (!this.engine) {
      throw new Error("No model loaded. Please download and select a model from the ∞ menu first.");
    }

    console.log(`[ModelManager] Running inference with ${messages.length} messages in context...`);

    const reply = await this.engine.chat.completions.create({
      messages: messages,
      max_tokens: 512,        // Allow longer, detailed responses
      temperature: 0.8,       // Creative but coherent
      top_p: 0.95,            // Diverse vocabulary
      frequency_penalty: 0.3, // Reduce repetition
      presence_penalty: 0.3,  // Encourage new topics
    });

    const content = reply.choices[0]?.message?.content || "";
    console.log(`[ModelManager] ✅ Response generated (${content.length} chars)`);
    return content;
  }

  public getCurrentModelId(): string | null {
    return this.currentModelId;
  }

  public getCurrentUIModelId(): ModelId | null {
    return this.currentUIModelId;
  }

  public getIsLoading(): boolean {
    return this.isLoading;
  }

  public getLastError(): string | null {
    return this._lastError;
  }

  public isReady(): boolean {
    return this.engine !== null && !this.isLoading;
  }
}

export const modelManager = ModelManager.getInstance();
