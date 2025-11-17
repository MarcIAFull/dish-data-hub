// 📤 WhatsApp Sender with Retry Logic

interface WhatsAppConfig {
  baseUrl: string;
  instance: string;
  token: string;
}

interface SendMessageParams {
  phone: string;
  message: string;
  requestId: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1s
  maxDelay: 10000  // 10s
};

/**
 * Calcula delay exponencial com jitter
 */
function calculateBackoff(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // ±30% jitter
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

/**
 * Verifica se erro é retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors, timeouts, 5xx
  if (error.name === 'AbortError') return true;
  if (error.message?.includes('timeout')) return true;
  if (error.message?.includes('ECONNREFUSED')) return true;
  
  // HTTP status codes retryable
  const status = error.status || error.response?.status;
  if (status >= 500 && status < 600) return true;
  if (status === 429) return true; // Rate limit
  
  return false;
}

/**
 * Envia mensagem WhatsApp com retry logic
 */
export async function sendWhatsAppWithRetry(
  config: WhatsAppConfig,
  params: SendMessageParams,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ success: boolean; attempts: number; error?: string }> {
  
  const { phone, message, requestId } = params;
  let lastError: any = null;
  
  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      console.log(`[${requestId}] 📤 Enviando WhatsApp (tentativa ${attempt + 1}/${retryConfig.maxRetries})...`);
      
      const response = await fetch(`${config.baseUrl}/message/sendText/${config.instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.token
        },
        body: JSON.stringify({
          number: phone,
          text: message
        }),
        signal: AbortSignal.timeout(15000) // 15s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[${requestId}] ✅ WhatsApp enviado com sucesso (tentativa ${attempt + 1})`);
      
      return {
        success: true,
        attempts: attempt + 1
      };

    } catch (error) {
      lastError = error;
      console.error(`[${requestId}] ❌ Tentativa ${attempt + 1} falhou:`, error);

      // Se não é retryable ou é última tentativa, sair
      if (!isRetryableError(error) || attempt === retryConfig.maxRetries - 1) {
        break;
      }

      // Calcular delay e aguardar
      const delay = calculateBackoff(attempt, retryConfig);
      console.log(`[${requestId}] ⏳ Aguardando ${Math.round(delay)}ms antes de retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Todas as tentativas falharam
  console.error(`[${requestId}] ❌ Todas as ${retryConfig.maxRetries} tentativas falharam`);
  return {
    success: false,
    attempts: retryConfig.maxRetries,
    error: lastError?.message || 'Erro desconhecido ao enviar WhatsApp'
  };
}

/**
 * Extrai configuração do agente
 */
export function extractWhatsAppConfig(agent: any): WhatsAppConfig | null {
  if (!agent.evolution_api_base_url || !agent.evolution_api_instance || !agent.evolution_api_token) {
    return null;
  }
  
  return {
    baseUrl: agent.evolution_api_base_url,
    instance: agent.evolution_api_instance,
    token: agent.evolution_api_token
  };
}
