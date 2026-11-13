// Official Anakin.ai API Integration Service
// Platform for custom AI Chatbots & Quick Apps workflows

export const ANAKIN_API_KEY = "ask_d26134c504dab47a1daf9aedc15019042d0d75f8379bd624ada8d0b871d8fdab";
export const ANAKIN_BASE_URL = "https://api.anakin.ai/v1";

export interface AnakinMessageResponse {
  success: boolean;
  reply?: string;
  error?: string;
}

export const DEFAULT_ANAKIN_APP_ID = "stackwa-interviewer-app";

/**
 * Send prompt to a custom Anakin.ai Chatbot App
 * Endpoint: POST https://api.anakin.ai/v1/chatbots/{appId}/messages
 */
export async function sendAnakinChatMessage(content: string, appId: string = DEFAULT_ANAKIN_APP_ID): Promise<AnakinMessageResponse> {
  if (!appId || !appId.trim()) {
    return {
      success: false,
      error: "Anakin.ai App ID is required. Create a Chatbot App on anakin.ai and enter the App ID in settings."
    };
  }

  try {
    const res = await fetch(`${ANAKIN_BASE_URL}/chatbots/${appId.trim()}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANAKIN_API_KEY}`,
        'X-Anakin-Api-Version': '2024-05-06',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        stream: false
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.error?.message || `Anakin.ai API Error HTTP ${res.status}`
      };
    }

    const data = await res.json();
    return {
      success: true,
      reply: data.content || data.message?.content || JSON.stringify(data)
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to reach Anakin.ai API"
    };
  }
}

/**
 * Trigger an Anakin.ai Quick App workflow
 * Endpoint: POST https://api.anakin.ai/v1/quickapps/{appId}/runs
 */
export async function runAnakinQuickApp(appId: string, inputs: Record<string, any>): Promise<AnakinMessageResponse> {
  if (!appId || !appId.trim()) {
    return {
      success: false,
      error: "Anakin.ai App ID is required. Create a Quick App on anakin.ai and enter the App ID in settings."
    };
  }

  try {
    const res = await fetch(`${ANAKIN_BASE_URL}/quickapps/${appId.trim()}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANAKIN_API_KEY}`,
        'X-Anakin-Api-Version': '2024-05-06',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs,
        stream: false
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.error?.message || `Anakin.ai API Error HTTP ${res.status}`
      };
    }

    const data = await res.json();
    return {
      success: true,
      reply: data.output || data.result || JSON.stringify(data)
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to reach Anakin.ai API"
    };
  }
}
