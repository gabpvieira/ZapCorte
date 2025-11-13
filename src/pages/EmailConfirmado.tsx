import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

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
          navigate('/login');
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

      // Recuperar dados pendentes do localStorage
      const pendingData = localStorage.getItem('pendingUserData');
      if (!pendingData) {
        console.log('⚠️ Nenhum dado pendente encontrado');
        setIsCreatingProfile(false);
        return;
      }

      const userData = JSON.parse(pendingData);
      console.log('📋 Dados do usuário:', userData);

      // Sistema de retry (3 tentativas)
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          console.log(`🔄 Tentativa ${retryCount + 1} de ${maxRetries}`);

          // Verificar se barbeiro já existe
          const { data: existingBarbeiro } = await supabase
            .from('barbeiros')
            .select('*')
            .eq('auth_id', user.id)
            .single();

          if (existingBarbeiro) {
            console.log('✅ Barbeiro já existe no banco de dados');
            localStorage.removeItem('pendingUserData');
            success = true;
            break;
          }

          // Criar barbeiro
          const { data: newBarbeiro, error: barbeiroError } = await supabase
            .from('barbeiros')
            .insert({
              auth_id: user.id,
              nome: userData.nome || user.user_metadata?.nome || user.email?.split('@')[0],
              email: user.email,
              telefone: userData.telefone || user.user_metadata?.telefone || '',
              status: 'ativo',
              plano: 'freemium'
            })
            .select()
            .single();

          if (barbeiroError) {
            // Verificar se é erro de duplicata
            if (barbeiroError.code === '23505' || barbeiroError.message?.includes('duplicate')) {
              console.log('✅ Barbeiro já existe (erro de duplicata ignorado)');
              localStorage.removeItem('pendingUserData');
              success = true;
              break;
            }

            throw barbeiroError;
          }

          console.log('✅ Barbeiro criado com sucesso:', newBarbeiro);
          localStorage.removeItem('pendingUserData');
          success = true;

        } catch (error: any) {
          console.error(`❌ Erro na tentativa ${retryCount + 1}:`, error);
          
          // Verificar se é erro de duplicata
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            console.log('✅ Barbeiro já existe (erro de duplicata ignorado)');
            localStorage.removeItem('pendingUserData');
            success = true;
            break;
          }

          retryCount++;
          
          if (retryCount < maxRetries) {
            console.log(`⏳ Aguardando 2s antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      if (!success) {
        console.error('❌ Falha ao criar barbeiro após todas as tentativas');
      }

    } catch (error) {
      console.error('💥 Erro geral ao criar barbeiro:', error);
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
          onClick={() => navigate('/login')}
          className="w-full bg-[#22c55e] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#16a34a] transition-all active:scale-95"
        >
          Ir para Login agora
        </button>
      </div>
    </div>
  );
}
