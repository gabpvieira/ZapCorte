import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AUTH_CONFIG } from '@/lib/auth-config';

export default function EmailConfirmado() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [isCreatingProfile, setIsCreatingProfile] = useState(true);

  useEffect(() => {
    // Criar perfil do barbeiro
    createBarbeiroFromAuth();

    // Countdown para redirecionamento
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirecionar para o dashboard em produção
          window.location.href = AUTH_CONFIG.redirectUrls.afterEmailConfirmed;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const createBarbeiroFromAuth = async () => {
    try {
      // Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        setIsCreatingProfile(false);
        return;
      }

      console.log('✅ Usuário autenticado:', user.email);
      console.log('ℹ️ A barbearia foi criada automaticamente pelo trigger do banco de dados');

      // Limpar dados pendentes
      localStorage.removeItem('pendingUserData');

    } catch (error) {
      console.error('💥 Erro geral:', error);
    } finally {
      setIsCreatingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2818] via-[#1a4d2e] to-[#0d2818] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="https://www.zapcorte.com.br/assets/zapcorte-icon-DS8CtXCp.png" 
            alt="ZapCorte" 
            className="h-16 w-16"
          />
        </div>

        {/* Ícone de Sucesso */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4 animate-bounce">
            <CheckCircle className="h-16 w-16 text-[#22c55e]" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Email confirmado!
        </h1>

        {/* Descrição */}
        <p className="text-gray-600 mb-8">
          Sua conta foi ativada com sucesso. Bem-vindo ao ZapCorte!
        </p>

        {/* Status de criação do perfil */}
        {isCreatingProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-800">
              Configurando sua conta...
            </p>
          </div>
        )}

        {/* Countdown */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            Redirecionando para o login em{' '}
            <span className="font-bold text-[#22c55e] text-lg">{countdown}</span>{' '}
            segundos...
          </p>
        </div>

        {/* Botão manual */}
        <button
          onClick={() => window.location.href = AUTH_CONFIG.redirectUrls.afterEmailConfirmed}
          className="w-full bg-[#22c55e] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#16a34a] transition-all active:scale-95"
        >
          Ir para Dashboard agora
        </button>
      </div>
    </div>
  );
}
