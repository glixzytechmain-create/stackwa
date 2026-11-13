// Official Scrimba API Service
// Connects to https://scrimba.com/api/v1/explainers

const SCRIMBA_API_KEY = "scr_live_n7u06s8pb252l7dfutvs4brh";
const SCRIMBA_BASE_URL = "https://scrimba.com/api/v1";

export interface ScrimbaExplainer {
  id: string;
  title?: string;
  status?: 'pending' | 'processing' | 'ready' | 'failed';
  embedUrl?: string;
  videoUrl?: string;
  createdAt?: string;
}

export interface CreateExplainerParams {
  prompt: string;
  codeSnippet?: string;
  filename?: string;
  mode?: 'landscape' | 'portrait' | 'square';
  teacher?: 'standard' | 'eli5' | 'professor' | 'lol' | 'tldr';
}

/**
 * Fetch list of generated explainers on user account
 */
export async function getScrimbaExplainers(): Promise<ScrimbaExplainer[]> {
  try {
    const res = await fetch(`${SCRIMBA_BASE_URL}/explainers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SCRIMBA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn("Scrimba API returned error:", res.status);
      return [];
    }

    const data = await res.json();
    return (data.explainers || []).map((item: any) => ({
      id: item.id,
      title: item.title || 'Codecast Explainer',
      status: item.status || 'ready',
      embedUrl: `https://scrimba.com/explain/${item.id}`,
      createdAt: item.created_at
    }));
  } catch (err) {
    console.error("Failed to query Scrimba API:", err);
    return [];
  }
}

/**
 * Create a real Scrimba Explainer using user's API credit
 */
export async function createScrimbaExplainer(params: CreateExplainerParams): Promise<{ success: boolean; explainerId?: string; embedUrl?: string; error?: string }> {
  try {
    // If code snippet is provided, use multipart/form-data
    if (params.codeSnippet) {
      const formData = new FormData();
      formData.append('prompt', params.prompt);
      formData.append('mode', params.mode || 'landscape');
      formData.append('teacher', params.teacher || 'standard');
      formData.append('cite_attachments', 'true');

      const blob = new Blob([params.codeSnippet], { type: 'text/javascript' });
      formData.append('attachments', blob, params.filename || 'solution.js');

      const res = await fetch(`${SCRIMBA_BASE_URL}/explainers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SCRIMBA_API_KEY}`,
          'Idempotency-Key': `stk-${Date.now()}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error?.message || `Scrimba API Error HTTP ${res.status}`
        };
      }

      const data = await res.json();
      const explainerId = data.id || data.explainer?.id;
      return {
        success: true,
        explainerId,
        embedUrl: `https://scrimba.com/explain/${explainerId}`
      };
    } else {
      // JSON body
      const res = await fetch(`${SCRIMBA_BASE_URL}/explainers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SCRIMBA_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `stk-${Date.now()}`
        },
        body: JSON.stringify({
          prompt: params.prompt,
          mode: params.mode || 'landscape',
          teacher: params.teacher || 'standard'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error?.message || `Scrimba API Error HTTP ${res.status}`
        };
      }

      const data = await res.json();
      const explainerId = data.id || data.explainer?.id;
      return {
        success: true,
        explainerId,
        embedUrl: `https://scrimba.com/explain/${explainerId}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error reaching Scrimba API'
    };
  }
}
