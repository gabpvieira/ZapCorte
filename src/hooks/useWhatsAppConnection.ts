import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { evolutionApi, EvolutionSession } from '@/lib/evolutionApi';
import { useAuth } from '@/contexts/AuthContext';

interface WhatsAppConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  sessionId: string | null;
  phone: string | null;
  error: string | null;
}

export const useWhatsAppConnection = () => {
  const { user } = useAuth();
  const [state, setState] = useState<WhatsAppConnectionState>({
    isConnected: false,
    isConnecting: false,
    qrCode: null,
    sessionId: null,
    phone: null,
    error: null,
  });

  // Buscar dados da barbearia
  const fetchBarbershopData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: barbershop, error } = await supabase
        .from('barbershops')
        .select('id, whatsapp_session_id, whatsapp_connected, whatsapp_qrcode, whatsapp_phone')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (barbershop) {
        setState(prev => ({
          ...prev,
          isConnected: barbershop.whatsapp_connected || false,
          sessionId: barbershop.whatsapp_session_id,
          qrCode: barbershop.whatsapp_qrcode,
          phone: barbershop.whatsapp_phone,
        }));

        // Se tem sessão mas não está conectado, verificar status
        if (barbershop.whatsapp_session_id && !barbershop.whatsapp_connected) {
          checkConnectionStatus(barbershop.whatsapp_session_id, barbershop.id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados da barbearia:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao carregar dados da conexão WhatsApp',
      }));
    }
  }, [user?.id]);

  // Verificar status da conexão
  const checkConnectionStatus = useCallback(async (sessionId: string, barbershopId: string) => {
    try {
      const session = await evolutionApi.getSessionStatus(sessionId);
      
      if (session.state === 'open') {
        // Atualizar no banco
        await supabase
          .from('barbershops')
          .update({
            whatsapp_connected: true,
            whatsapp_phone: session.phone,
            whatsapp_qrcode: null, // Limpar QR code quando conectado
          })
          .eq('id', barbershopId);

        setState(prev => ({
          ...prev,
          isConnected: true,
          phone: session.phone || null,
          qrCode: null,
        }));
      } else if (session.state === 'qr' || session.state === 'connecting') {
        // Ainda conectando, buscar QR code atualizado
        const qrCode = await evolutionApi.getQRCode(sessionId);
        if (qrCode) {
          await supabase
            .from('barbershops')
            .update({ whatsapp_qrcode: qrCode })
            .eq('id', barbershopId);

          setState(prev => ({
            ...prev,
            qrCode,
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  }, []);

  // Iniciar conexão WhatsApp
  const startConnection = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      // Buscar dados da barbearia
      const { data: barbershop, error: barbershopError } = await supabase
        .from('barbershops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (barbershopError) throw barbershopError;

      // Criar sessão na Evolution API
      const session = await evolutionApi.createSession(barbershop.id);

      // Salvar no banco
      await supabase
        .from('barbershops')
        .update({
          whatsapp_session_id: session.id,
          whatsapp_qrcode: session.qrcode,
          whatsapp_connected: false,
        })
        .eq('id', barbershop.id);

      setState(prev => ({
        ...prev,
        sessionId: session.id,
        qrCode: session.qrcode || null,
        isConnecting: false,
      }));

      // Se não obteve QR code na criação, tentar obter separadamente
      if (!session.qrcode) {
        console.log('QR Code não retornado na criação, tentando obter separadamente...');
        setTimeout(async () => {
          try {
            const qrCode = await evolutionApi.getQRCode(session.id);
            if (qrCode) {
              console.log('QR Code obtido separadamente:', qrCode.substring(0, 50));
              
              // Atualizar no banco
              await supabase
                .from('barbershops')
                .update({ whatsapp_qrcode: qrCode })
                .eq('id', barbershop.id);

              setState(prev => ({
                ...prev,
                qrCode,
              }));
            }
          } catch (error) {
            console.error('Erro ao obter QR Code separadamente:', error);
          }
        }, 2000); // Aguardar 2 segundos antes de tentar
      }

      // Iniciar polling para verificar conexão
      startPolling(session.id, barbershop.id);

    } catch (error) {
      console.error('Erro ao iniciar conexão:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Erro ao iniciar conexão WhatsApp. Tente novamente.',
      }));
    }
  }, [user?.id]);

  // Desconectar WhatsApp
  const disconnect = useCallback(async () => {
    if (!state.sessionId || !user?.id) return;

    try {
      // Desconectar na Evolution API
      await evolutionApi.disconnectSession(state.sessionId);

      // Buscar dados da barbearia
      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (barbershop) {
        // Atualizar no banco
        await supabase
          .from('barbershops')
          .update({
            whatsapp_connected: false,
            whatsapp_qrcode: null,
            whatsapp_phone: null,
          })
          .eq('id', barbershop.id);
      }

      setState(prev => ({
        ...prev,
        isConnected: false,
        qrCode: null,
        phone: null,
      }));

    } catch (error) {
      console.error('Erro ao desconectar:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao desconectar WhatsApp',
      }));
    }
  }, [state.sessionId, user?.id]);

  // Polling para verificar conexão
  const startPolling = useCallback((sessionId: string, barbershopId: string) => {
    const interval = setInterval(async () => {
      try {
        const session = await evolutionApi.getSessionStatus(sessionId);
        
        if (session.state === 'open') {
          clearInterval(interval);
          
          // Atualizar no banco
          await supabase
            .from('barbershops')
            .update({
              whatsapp_connected: true,
              whatsapp_phone: session.phone,
              whatsapp_qrcode: null,
            })
            .eq('id', barbershopId);

          setState(prev => ({
            ...prev,
            isConnected: true,
            phone: session.phone || null,
            qrCode: null,
          }));
        } else if (session.state === 'close') {
          clearInterval(interval);
          
          setState(prev => ({
            ...prev,
            error: 'Conexão perdida. Tente novamente.',
            qrCode: null,
          }));
        }
      } catch (error) {
        console.error('Erro no polling:', error);
        clearInterval(interval);
      }
    }, 3000); // Verificar a cada 3 segundos

    // Limpar polling após 2 minutos
    setTimeout(() => {
      clearInterval(interval);
    }, 120000);
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    fetchBarbershopData();
  }, [fetchBarbershopData]);

  // Forçar atualização do QR Code
  const forceQRCodeRefresh = useCallback(async () => {
    if (!state.sessionId || !user?.id) return;

    try {
      console.log('Forçando atualização do QR Code...');
      
      // Buscar dados da barbearia
      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (barbershop) {
        const qrCode = await evolutionApi.getQRCode(state.sessionId);
        if (qrCode) {
          console.log('QR Code atualizado:', qrCode.substring(0, 50));
          
          // Atualizar no banco
          await supabase
            .from('barbershops')
            .update({ whatsapp_qrcode: qrCode })
            .eq('id', barbershop.id);

          setState(prev => ({
            ...prev,
            qrCode,
            error: null,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: 'Não foi possível obter o QR Code. Tente reconectar.',
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao forçar atualização do QR Code:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao atualizar QR Code',
      }));
    }
  }, [state.sessionId, user?.id]);

  return {
    ...state,
    startConnection,
    disconnect,
    refreshStatus: fetchBarbershopData,
    forceQRCodeRefresh,
  };
};