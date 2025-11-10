// Evolution API Integration Service
import { EVOLUTION_CONFIG, mapState } from './evolutionConfig';

export interface EvolutionSession {
  id: string;
  qrcode?: string;
  state: 'close' | 'connecting' | 'open' | 'qr' | 'starting';
  phone?: string;
}

export interface WhatsAppMessage {
  phone: string;
  message: string;
}

class EvolutionApiService {
  private baseUrl = EVOLUTION_CONFIG.baseUrl;
  private apiKey = EVOLUTION_CONFIG.apiKey;

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Testar conectividade com a API
   */
  async testConnection(): Promise<{ success: boolean; endpoint?: string; error?: string }> {
    const testEndpoints = [
      '/instance/fetchInstances',
      '/manager/fetchInstances', 
      '/instances',
      '/status'
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testando endpoint: ${this.baseUrl}${endpoint}`);
        await this.makeRequest(endpoint, { method: 'GET' });
        console.log(`✅ Endpoint funcionando: ${endpoint}`);
        return { success: true, endpoint };
      } catch (error) {
        console.warn(`❌ Endpoint falhou: ${endpoint}`, error);
        continue;
      }
    }

    return { 
      success: false, 
      error: 'Nenhum endpoint de teste funcionou. Verifique a URL e API Key.' 
    };
  }

  /**
   * Criar uma nova sessão WhatsApp para o barbeiro
   */
  async createSession(barbershopId: string): Promise<EvolutionSession> {
    const sessionId = `barbershop-${barbershopId}`;
    
    // Primeiro, verificar se a instância já existe
    console.log(`Verificando se instância ${sessionId} já existe...`);
    try {
      const existingSession = await this.getSessionStatus(sessionId);
      if (existingSession && existingSession.state !== 'close') {
        console.log('Instância já existe, tentando obter QR Code...');
        const qrcode = await this.getQRCode(sessionId);
        return {
          ...existingSession,
          qrcode: qrcode || undefined,
        };
      }
    } catch (error) {
      console.log('Instância não existe ou erro ao verificar, tentando criar...');
    }
    
    // Tentar diferentes endpoints da Evolution API
    const endpoints = [
      {
        url: `/instance/create`,
        body: { 
          instanceName: sessionId,
          token: sessionId,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        }
      },
      {
        url: `/manager/create`,
        body: { 
          instanceName: sessionId,
          token: sessionId,
          qrcode: true
        }
      },
      {
        url: `/create/${sessionId}`,
        body: { 
          qrcode: true
        }
      }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Tentando endpoint: ${endpoint.url}`);
        const result = await this.makeRequest(endpoint.url, {
          method: 'POST',
          body: JSON.stringify(endpoint.body),
        });

        // Se chegou aqui, o endpoint funcionou
        console.log('Sessão criada com sucesso:', result);
        
        // Tentar diferentes campos onde o QR code pode estar
        const qrcode = result.qrcode || result.base64 || result.code || result.qr || result.data;
        
        console.log('QR Code da sessão criada:', {
          qrcode: qrcode ? qrcode.substring(0, 50) + '...' : 'null',
          qrcodeLength: qrcode?.length,
          resultKeys: Object.keys(result)
        });
        
        return {
          id: sessionId,
          qrcode: qrcode || undefined,
          state: mapState(result.instance?.state || result.state || 'qr'),
        };
      } catch (error: any) {
        // Se o erro for que a instância já existe, tentar obter o QR Code
        if (error?.message?.includes('already in use') || error?.message?.includes('já existe')) {
          console.log('Instância já existe (erro capturado), tentando obter QR Code...');
          try {
            const qrcode = await this.getQRCode(sessionId);
            const status = await this.getSessionStatus(sessionId);
            return {
              ...status,
              qrcode: qrcode || undefined,
            };
          } catch (qrError) {
            console.error('Erro ao obter QR Code da instância existente:', qrError);
          }
        }
        console.warn(`Endpoint ${endpoint.url} falhou:`, error);
        continue;
      }
    }

    throw new Error('Falha ao criar sessão WhatsApp - nenhum endpoint funcionou');
  }

  /**
   * Verificar status da sessão
   */
  async getSessionStatus(sessionId: string): Promise<EvolutionSession> {
    const endpoints = [
      `/instance/connectionState/${sessionId}`,
      `/instance/fetchInstances?instanceName=${sessionId}`,
      `/status/${sessionId}`,
      `/${sessionId}/status`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Verificando status no endpoint: ${endpoint}`);
        const result = await this.makeRequest(endpoint, {
          method: 'GET',
        });

        console.log('Resposta do status:', result);

        // Extrair informações de diferentes formatos de resposta
        let state = 'close';
        let phone = null;

        // Formato 1: { instance: { state, owner } }
        if (result.instance) {
          state = result.instance.state || result.instance.connectionStatus;
          phone = result.instance.ownerJid || result.instance.owner || result.instance.phone || result.instance.number;
        }
        // Formato 2: { state, phone }
        else if (result.state) {
          state = result.state;
          phone = result.ownerJid || result.phone || result.number || result.owner;
        }
        // Formato 3: Array de instâncias
        else if (Array.isArray(result) && result.length > 0) {
          const instance = result[0];
          state = instance.state || instance.connectionStatus;
          phone = instance.ownerJid || instance.owner || instance.phone || instance.number;
        }

        // Tentar extrair número do owner se vier no formato completo
        if (phone && phone.includes('@')) {
          phone = phone.split('@')[0];
        }

        console.log('Estado extraído:', state, 'Telefone:', phone);

        return {
          id: sessionId,
          state: mapState(state),
          phone: phone || undefined,
        };
      } catch (error) {
        console.warn(`Endpoint ${endpoint} falhou:`, error);
        continue;
      }
    }

    console.error('Erro ao verificar status de todos os endpoints');
    return {
      id: sessionId,
      state: 'close',
    };
  }

  /**
   * Obter informações detalhadas da instância
   */
  async getInstanceInfo(sessionId: string): Promise<{ phone?: string; state?: string }> {
    const endpoints = [
      `/instance/fetchInstances?instanceName=${sessionId}`,
      `/instance/connectionState/${sessionId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Buscando info da instância: ${endpoint}`);
        const result = await this.makeRequest(endpoint, {
          method: 'GET',
        });

        console.log('Info da instância:', result);

        let phone = null;
        let state = null;

        if (Array.isArray(result) && result.length > 0) {
          const instance = result[0];
          // Tentar diferentes campos onde o número pode estar
          phone = instance.ownerJid || instance.owner || instance.phone || instance.number;
          state = instance.state || instance.connectionStatus;
        } else if (result.instance) {
          phone = result.instance.ownerJid || result.instance.owner || result.instance.phone;
          state = result.instance.state || result.instance.connectionStatus;
        }

        // Limpar formato do número (remover @s.whatsapp.net)
        if (phone && phone.includes('@')) {
          phone = phone.split('@')[0];
        }

        console.log('Número extraído:', phone);

        return { phone: phone || undefined, state: state || undefined };
      } catch (error) {
        console.warn(`Endpoint ${endpoint} falhou:`, error);
        continue;
      }
    }

    return {};
  }

  /**
   * Obter QR Code da sessão
   */
  async getQRCode(sessionId: string): Promise<string | null> {
    const endpoints = [
      `/instance/connect/${sessionId}`,
      `/qrcode/${sessionId}`,
      `/${sessionId}/qr`,
      `/instance/qrcode/${sessionId}`,
      `/${sessionId}/qrcode`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Tentando obter QR Code do endpoint: ${endpoint}`);
        const result = await this.makeRequest(endpoint, {
          method: 'GET',
        });

        console.log('Resposta do endpoint:', { endpoint, result });

        // Tentar diferentes campos onde o QR code pode estar
        const qrcode = result.qrcode || result.base64 || result.code || result.qr || result.data;
        
        if (qrcode) {
          console.log('QR Code encontrado:', {
            endpoint,
            qrcodeLength: qrcode.length,
            qrcodeStart: qrcode.substring(0, 50),
            isDataUrl: qrcode.startsWith('data:'),
            isHttpUrl: qrcode.startsWith('http')
          });
          
          // Garantir que o QR code está no formato correto
          if (qrcode.startsWith('data:image/')) {
            return qrcode;
          } else if (qrcode.startsWith('http://') || qrcode.startsWith('https://')) {
            return qrcode;
          } else {
            // Assumir que é base64 puro
            return qrcode;
          }
        }
      } catch (error) {
        console.warn(`Endpoint ${endpoint} falhou:`, error);
        continue;
      }
    }

    console.error('Erro ao obter QR Code de todos os endpoints');
    return null;
  }

  /**
   * Enviar mensagem WhatsApp
   */
  async sendMessage(sessionId: string, message: WhatsAppMessage): Promise<boolean> {
    try {
      // Formatar telefone para padrão internacional
      const formattedPhone = this.formatPhoneNumber(message.phone);
      
      await this.makeRequest(`/message/sendText/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({
          number: formattedPhone,
          text: message.message,
        }),
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }

  /**
   * Desconectar sessão
   */
  async disconnectSession(sessionId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/instance/logout/${sessionId}`, {
        method: 'DELETE',
      });

      return true;
    } catch (error) {
      console.error('Erro ao desconectar sessão:', error);
      return false;
    }
  }

  /**
   * Deletar sessão
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/instance/delete/${sessionId}`, {
        method: 'DELETE',
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
      return false;
    }
  }

  /**
   * Formatar número de telefone para padrão internacional
   */
  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se já tem código do país (55), retorna como está
    if (cleaned.startsWith('55') && cleaned.length === 13) {
      return cleaned;
    }
    
    // Se tem 11 dígitos (DDD + número), adiciona código do Brasil
    if (cleaned.length === 11) {
      return `55${cleaned}`;
    }
    
    // Se tem 10 dígitos (DDD + número sem 9), adiciona 9 e código do Brasil
    if (cleaned.length === 10) {
      return `55${cleaned.slice(0, 2)}9${cleaned.slice(2)}`;
    }
    
    return cleaned;
  }

  /**
   * Validar se o número está no formato correto
   */
  isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  }
}

export const evolutionApi = new EvolutionApiService();