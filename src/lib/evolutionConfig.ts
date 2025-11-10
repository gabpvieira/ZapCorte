// Configuração da Evolution API
export const EVOLUTION_CONFIG = {
  // URL base da Evolution API
  baseUrl: 'https://evolution.chatifyz.com',
  
  // API Key
  apiKey: '9DSS6ZkHk9oIM6q0iYjHqekmMWX6Gllp',
  
  // Endpoints alternativos para diferentes versões da Evolution API
  endpoints: {
    // Criar instância
    createInstance: [
      '/instance/create',
      '/manager/create', 
      '/create',
      '/sessions/add'
    ],
    
    // Status da instância
    instanceStatus: [
      '/instance/connectionState',
      '/status',
      '/sessions/status'
    ],
    
    // QR Code
    qrCode: [
      '/instance/connect',
      '/qrcode',
      '/qr',
      '/sessions/qrcode'
    ],
    
    // Enviar mensagem
    sendMessage: [
      '/message/sendText',
      '/messages/send',
      '/send'
    ],
    
    // Desconectar
    disconnect: [
      '/instance/logout',
      '/sessions/disconnect',
      '/disconnect'
    ],
    
    // Deletar instância
    deleteInstance: [
      '/instance/delete',
      '/sessions/delete',
      '/delete'
    ]
  },
  
  // Estados da sessão mapeados
  stateMapping: {
    // Estados da Evolution API -> Estados padronizados
    'open': 'open',
    'close': 'close', 
    'connecting': 'connecting',
    'qr': 'qr',
    'starting': 'starting',
    'CONNECTED': 'open',
    'DISCONNECTED': 'close',
    'CONNECTING': 'connecting',
    'TIMEOUT': 'close'
  }
};

// Função para mapear estados
export function mapState(apiState: string): 'close' | 'connecting' | 'open' | 'qr' | 'starting' {
  return EVOLUTION_CONFIG.stateMapping[apiState] || 'close';
}