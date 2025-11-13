import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('[AuthCallback] Iniciando processamento');
      
      // Extrair hash da URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const token_hash = hashParams.get('token_hash');
      const type = hashParams.get('type');
      const error = hashParams.get('error');
      const error_description = hashParams.get('error_description');

      console.log('[AuthCallback] Parâmetros:', { token_hash: !!token_hash, type, error });

      // Verificar erro
      if (error) {
        if (error === 'access_denied' && error_description?.includes('already confirmed')) {
          setStatus('success');
          setMessage('Email já confirmado!');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        throw new Error(error_description || error);
      }

      // Processar token
      if (token_hash && type === 'email') {
        console.log('[AuthCallback] Verificando token...');
        
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        });

        if (verifyError) {
          console.error('[AuthCallback] Erro na verificação:', verifyError);
          throw verifyError;
        }

        if (data.user) {
          console.log('[AuthCallback] ✅ Email confirmado:', data.user.email);
          
          // Criar barbeiro automaticamente
          await createBarbeiroFromAuth(data.user);
          
          setStatus('success');
          setMessage('Email confirmado com sucesso!');
          setTimeout(() => navigate('/email-confirmado'), 1500);
          return;
        }
      }

      // Verificar sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('[AuthCallback] ✅ Sessão válida encontrada');
        setStatus('success');
        setMessage('Autenticação confirmada!');
        setTimeout(() => navigate('/email-confirmado'), 1500);
        return;
      }

      throw new Error('Token inválido ou expirado');

    } catch (error: any) {
      console.error('[AuthCallback] Erro:', error);
      setStatus('error');
      setMessage(error.message || 'Erro ao processar autenticação');
    }
  };

  const createBarbeiroFromAuth = async (user: any) => {
    try {
      console.log('[AuthCallback] Criando barbearia para:', user.email);

      // Recuperar dados pendentes
      const pendingData = localStorage.getItem('pendingUserData');
      const userData = pendingData ? JSON.parse(pendingData) : {};

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('barbershops')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        console.log('[AuthCallback] Barbearia já existe');
        localStorage.removeItem('pendingUserData');
        return;
      }

      // Criar slug a partir do nome
      const slug = (userData.nome || user.user_metadata?.nome || user.email?.split('@')[0])
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        + '-' + Math.random().toString(36).substring(2, 7);

      // Criar barbershop
      const { error } = await supabase
        .from('barbershops')
        .insert({
          user_id: user.id,
          name: userData.nome || user.user_metadata?.nome || user.email?.split('@')[0],
          slug: slug,
          plan_type: 'freemium',
          is_active: true,
          whatsapp_number: userData.telefone || user.user_metadata?.telefone || null
        });

      if (error && !error.message?.includes('duplicate')) {
        console.error('[AuthCallback] Erro ao criar barbearia:', error);
      } else {
        console.log('[AuthCallback] ✅ Barbearia criada com sucesso');
        localStorage.removeItem('pendingUserData');
      }
    } catch (error) {
      console.error('[AuthCallback] Erro ao criar barbearia:', error);
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

        {/* Status */}
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="bg-blue-100 rounded-full p-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="bg-green-100 rounded-full p-4 animate-bounce">
              <CheckCircle className="h-12 w-12 text-[#22c55e]" />
            </div>
          )}
          {status === 'error' && (
            <div className="bg-red-100 rounded-full p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          )}
        </div>

        {/* Mensagem */}
        <h1 className={`text-2xl font-bold mb-4 ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          'text-gray-900'
        }`}>
          {status === 'loading' && 'Processando...'}
          {status === 'success' && 'Sucesso!'}
          {status === 'error' && 'Erro'}
        </h1>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Botões de ação */}
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/confirmar-email')}
              className="w-full bg-[#22c55e] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#16a34a] transition-all"
            >
              Reenviar email
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Voltar para o login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
