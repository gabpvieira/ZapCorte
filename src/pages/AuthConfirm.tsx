import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando...');
  const [attempts, setAttempts] = useState<string[]>([]);

  useEffect(() => {
    handleConfirmation();
  }, []);

  const addLog = (log: string) => {
    console.log(`[AuthConfirm] ${log}`);
    setAttempts(prev => [...prev, log]);
  };

  const handleConfirmation = async () => {
    try {
      // Extrair parâmetros da URL
      const token_hash = searchParams.get('token_hash');
      const token = searchParams.get('token');
      const code = searchParams.get('code');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');

      addLog(`Parâmetros: token_hash=${!!token_hash}, token=${!!token}, code=${!!code}, type=${type}`);

      // Verificar se há erro na URL
      if (error) {
        addLog(`Erro na URL: ${error} - ${error_description}`);
        
        if (error === 'access_denied' && error_description?.includes('already confirmed')) {
          setStatus('success');
          setMessage('Email já confirmado anteriormente!');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        throw new Error(error_description || error);
      }

      // Se type=recovery, verificar o token e criar sessão para redefinir senha
      if (type === 'recovery') {
        addLog('Tipo: recovery - processando token de recuperação');
        const tokenParam = token_hash || token || code;
        
        if (!tokenParam) {
          throw new Error('Token de recuperação não encontrado');
        }

        // Tentar verificar o token de recovery com verifyOtp
        addLog('Tentando verifyOtp com tipo recovery');
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenParam,
            type: 'recovery',
          });

          if (!error && data.session) {
            addLog('✅ Token de recovery validado com sucesso');
            // Redirecionar para página de redefinir senha com sessão ativa
            navigate('/auth/reset-password');
            return;
          }
          
          addLog(`❌ Erro ao verificar token: ${error?.message}`);
          throw new Error(error?.message || 'Token de recuperação inválido ou expirado');
        } catch (e: any) {
          addLog(`❌ Exceção: ${e.message}`);
          throw new Error('Token de recuperação inválido ou expirado');
        }
      }

      // Caso contrário, confirmar email
      setMessage('Confirmando seu email...');

      // Método 1: Verificar com token_hash usando verifyOtp
      if (token_hash) {
        addLog('Tentativa 1: verifyOtp com token_hash');
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email',
          });

          if (!error && data.user) {
            addLog('✅ Sucesso com verifyOtp + token_hash');
            setStatus('success');
            setMessage('Email confirmado com sucesso!');
            setTimeout(() => navigate('/login?confirmed=true'), 1500);
            return;
          }
          addLog(`❌ Falha: ${error?.message || 'Sem dados'}`);
        } catch (e: any) {
          addLog(`❌ Exceção: ${e.message}`);
        }
      }

      // Método 2: Verificar com token_hash usando exchangeCodeForSession
      if (token_hash) {
        addLog('Tentativa 2: exchangeCodeForSession com token_hash');
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(token_hash);

          if (!error && data.session) {
            addLog('✅ Sucesso com exchangeCodeForSession + token_hash');
            setStatus('success');
            setMessage('Email confirmado com sucesso!');
            setTimeout(() => navigate('/login?confirmed=true'), 1500);
            return;
          }
          addLog(`❌ Falha: ${error?.message || 'Sem sessão'}`);
        } catch (e: any) {
          addLog(`❌ Exceção: ${e.message}`);
        }
      }

      // Método 3: Verificar com token usando verifyOtp
      if (token) {
        addLog('Tentativa 3: verifyOtp com token');
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email',
          });

          if (!error && data.user) {
            addLog('✅ Sucesso com verifyOtp + token');
            setStatus('success');
            setMessage('Email confirmado com sucesso!');
            setTimeout(() => navigate('/login?confirmed=true'), 1500);
            return;
          }
          addLog(`❌ Falha: ${error?.message || 'Sem dados'}`);
        } catch (e: any) {
          addLog(`❌ Exceção: ${e.message}`);
        }
      }

      // Método 4: Verificar com code usando exchangeCodeForSession
      if (code) {
        addLog('Tentativa 4: exchangeCodeForSession com code');
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (!error && data.session) {
            addLog('✅ Sucesso com exchangeCodeForSession + code');
            setStatus('success');
            setMessage('Email confirmado com sucesso!');
            setTimeout(() => navigate('/login?confirmed=true'), 1500);
            return;
          }
          addLog(`❌ Falha: ${error?.message || 'Sem sessão'}`);
        } catch (e: any) {
          addLog(`❌ Exceção: ${e.message}`);
        }
      }

      // Método 5: Verificar sessão atual
      addLog('Tentativa 5: Verificar sessão atual');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session?.user && !sessionError) {
        addLog('✅ Usuário já autenticado');
        setStatus('success');
        setMessage('Email confirmado com sucesso!');
        setTimeout(() => navigate('/login?confirmed=true'), 1500);
        return;
      }

      // Se chegou aqui, nenhum método funcionou
      addLog('❌ Todos os métodos falharam');
      throw new Error('Não foi possível confirmar o email. Token pode estar expirado.');

    } catch (error: any) {
      console.error('Erro ao confirmar:', error);
      addLog(`💥 Erro final: ${error.message}`);
      setStatus('error');
      setMessage(error.message || 'Erro ao processar confirmação');
    }
  };

  const handleResendEmail = () => {
    navigate('/confirmar-email');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2818] via-[#1a4d2e] to-[#0d2818] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
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
        <h1 className={`text-2xl font-bold text-center mb-4 ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          'text-gray-900'
        }`}>
          {status === 'loading' && 'Confirmando email...'}
          {status === 'success' && 'Sucesso!'}
          {status === 'error' && 'Erro na confirmação'}
        </h1>

        <p className="text-center text-gray-600 mb-6">
          {message}
        </p>

        {/* Botões de ação */}
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              className="w-full bg-[#22c55e] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#16a34a] transition-all active:scale-95"
            >
              Reenviar email de confirmação
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Voltar para o login
            </button>
          </div>
        )}

        {/* Logs de debug (apenas em desenvolvimento) */}
        {import.meta.env.DEV && attempts.length > 0 && (
          <details className="mt-6">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Ver logs de debug ({attempts.length})
            </summary>
            <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
              {attempts.map((attempt, index) => (
                <p key={index} className="text-xs text-gray-600 font-mono mb-1">
                  {attempt}
                </p>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
