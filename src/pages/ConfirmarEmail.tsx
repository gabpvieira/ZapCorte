import { useState, useEffect } from 'react';
import { Mail, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function ConfirmarEmail() {
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Recuperar email do localStorage
    const pendingData = localStorage.getItem('pendingUserData');
    if (pendingData) {
      try {
        const userData = JSON.parse(pendingData);
        setEmail(userData.email || '');
      } catch (error) {
        console.error('Erro ao recuperar dados pendentes:', error);
      }
    }

    // Verificar cooldown do reenvio
    const lastResend = localStorage.getItem('lastEmailResend');
    if (lastResend) {
      const timePassed = Date.now() - parseInt(lastResend);
      const remainingCooldown = Math.max(0, 60 - Math.floor(timePassed / 1000));
      setCooldown(remainingCooldown);
    }
  }, []);

  useEffect(() => {
    // Timer de cooldown
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || !email) return;

    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast({
        title: 'Email reenviado!',
        description: 'Verifique sua caixa de entrada e spam.',
      });

      // Iniciar cooldown de 60 segundos
      localStorage.setItem('lastEmailResend', Date.now().toString());
      setCooldown(60);
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast({
        title: 'Erro ao reenviar',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
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

        {/* Ícone de Email */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <Mail className="h-12 w-12 text-[#22c55e]" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Confirme seu email
        </h1>

        {/* Descrição */}
        <p className="text-center text-gray-600 mb-6">
          Enviamos um email de confirmação para:
        </p>

        {/* Email */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <p className="font-semibold text-gray-900 break-all">
            {email || 'seu-email@exemplo.com'}
          </p>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Próximos passos:</strong>
          </p>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Abra seu email</li>
            <li>Clique no link de confirmação</li>
            <li>Você será redirecionado automaticamente</li>
          </ol>
        </div>

        {/* Aviso sobre spam */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Não recebeu o email?</strong> Verifique sua pasta de spam ou lixo eletrônico.
          </p>
        </div>

        {/* Botão de reenviar */}
        <button
          onClick={handleResendEmail}
          disabled={isResending || cooldown > 0}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            cooldown > 0 || isResending
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#22c55e] text-white hover:bg-[#16a34a] active:scale-95'
          }`}
        >
          {isResending ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Reenviando...
            </>
          ) : cooldown > 0 ? (
            <>
              <Clock className="h-5 w-5" />
              Aguarde {cooldown}s
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5" />
              Reenviar email
            </>
          )}
        </button>

        {/* Link para login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já confirmou seu email?{' '}
            <a 
              href="/login" 
              className="text-[#22c55e] hover:text-[#16a34a] font-semibold"
            >
              Fazer login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
