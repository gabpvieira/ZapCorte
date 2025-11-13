import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Bug } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DebugInfo {
  timestamp: string;
  url: string;
  searchParams: Record<string, string>;
  hashParams: Record<string, string>;
  session: any;
  user: any;
  attempts: string[];
}

export default function AuthVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    timestamp: new Date().toISOString(),
    url: window.location.href,
    searchParams: {},
    hashParams: {},
    session: null,
    user: null,
    attempts: []
  });

  useEffect(() => {
    collectDebugInfo();
  }, []);

  const addAttempt = (message: string) => {
    console.log(`[AuthVerify] ${message}`);
    setDebugInfo(prev => ({
      ...prev,
      attempts: [...prev.attempts, `${new Date().toISOString()}: ${message}`]
    }));
  };

  const collectDebugInfo = async () => {
    try {
      addAttempt('Iniciando coleta de informações de debug');

      // Coletar parâmetros da URL
      const searchParamsObj: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        searchParamsObj[key] = value;
      });

      // Coletar parâmetros do hash
      const hashParamsObj: Record<string, string> = {};
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      hashParams.forEach((value, key) => {
        hashParamsObj[key] = value;
      });

      addAttempt(`Search params: ${JSON.stringify(searchParamsObj)}`);
      addAttempt(`Hash params: ${JSON.stringify(hashParamsObj)}`);

      // Verificar sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      addAttempt(`Sessão atual: ${session ? 'Existe' : 'Não existe'}`);
      if (sessionError) {
        addAttempt(`Erro ao obter sessão: ${sessionError.message}`);
      }

      // Verificar usuário
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      addAttempt(`Usuário atual: ${user ? user.email : 'Não autenticado'}`);
      if (userError) {
        addAttempt(`Erro ao obter usuário: ${userError.message}`);
      }

      // Atualizar estado
      setDebugInfo(prev => ({
        ...prev,
        searchParams: searchParamsObj,
        hashParams: hashParamsObj,
        session: session ? {
          access_token: session.access_token?.substring(0, 20) + '...',
          refresh_token: session.refresh_token?.substring(0, 20) + '...',
          expires_at: session.expires_at,
          user: {
            id: session.user?.id,
            email: session.user?.email,
            email_confirmed_at: session.user?.email_confirmed_at
          }
        } : null,
        user: user ? {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at
        } : null
      }));

      // Tentar processar confirmação
      const token_hash = searchParamsObj.token_hash || hashParamsObj.token_hash;
      const code = searchParamsObj.code || hashParamsObj.code;

      if (token_hash || code) {
        addAttempt('Tentando processar confirmação...');
        
        if (token_hash) {
          addAttempt('Usando token_hash');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email',
          });

          if (error) {
            addAttempt(`Erro: ${error.message}`);
          } else if (data.user) {
            addAttempt('✅ Confirmação bem-sucedida!');
            setTimeout(() => navigate('/email-confirmado'), 2000);
          }
        }
      } else {
        addAttempt('Nenhum token encontrado na URL');
      }

    } catch (error: any) {
      addAttempt(`Erro geral: ${error.message}`);
      console.error('[AuthVerify] Erro:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2818] via-[#1a4d2e] to-[#0d2818] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 rounded-full p-3">
              <Bug className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Debug de Autenticação
              </h1>
              <p className="text-sm text-gray-600">
                Informações detalhadas sobre o processo de confirmação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Coletando informações...</span>
          </div>
        </div>

        {/* URL Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            📍 Informações da URL
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs break-all">
            <p className="text-gray-600 mb-2">
              <strong>URL Completa:</strong>
            </p>
            <p className="text-gray-800">{debugInfo.url}</p>
          </div>
        </div>

        {/* Search Params */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            🔍 Parâmetros de Busca (Query String)
          </h2>
          <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-xs">
            {JSON.stringify(debugInfo.searchParams, null, 2)}
          </pre>
        </div>

        {/* Hash Params */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            # Parâmetros do Hash
          </h2>
          <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-xs">
            {JSON.stringify(debugInfo.hashParams, null, 2)}
          </pre>
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            🔐 Sessão Atual
          </h2>
          <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-xs">
            {JSON.stringify(debugInfo.session, null, 2)}
          </pre>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            👤 Usuário Atual
          </h2>
          <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-xs">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </div>

        {/* Attempts Log */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            📝 Log de Tentativas ({debugInfo.attempts.length})
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {debugInfo.attempts.map((attempt, index) => (
              <p key={index} className="text-xs text-gray-700 font-mono mb-1">
                {attempt}
              </p>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            🎯 Ações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/auth/confirm' + window.location.search)}
              className="bg-[#22c55e] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#16a34a] transition-all"
            >
              Tentar /auth/confirm
            </button>
            <button
              onClick={() => navigate('/auth/callback')}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Tentar /auth/callback
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-all"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
