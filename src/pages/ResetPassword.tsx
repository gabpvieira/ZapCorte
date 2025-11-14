import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import logotipo from '@/assets/zapcorte-icon.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const token = searchParams.get('token');
      
      if (!token) {
        toast({
          title: 'Token inválido',
          description: 'Link de redefinição de senha inválido ou expirado.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Verificar se há uma sessão válida (token válido)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsValidToken(true);
      } else {
        // Tentar trocar o token por uma sessão
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(token);
          
          if (data?.session) {
            setIsValidToken(true);
          } else {
            throw new Error(exchangeError?.message || 'Token inválido');
          }
        } catch (e: any) {
          toast({
            title: 'Token inválido',
            description: 'Link de redefinição de senha inválido ou expirado.',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    } catch (error: any) {
      console.error('Erro ao verificar token:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar o token.',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/login'), 2000);
    } finally {
      setIsCheckingToken(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'As senhas digitadas não são iguais.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Atualizar senha do usuário
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: 'Senha redefinida!',
          description: 'Sua senha foi alterada com sucesso.',
        });

        // Fazer logout para forçar novo login com a nova senha
        await supabase.auth.signOut();

        setTimeout(() => {
          navigate('/login?reset=success');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: 'Erro ao redefinir senha',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      }
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img
                src={logotipo}
                alt="ZapCorte"
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Lock className="h-6 w-6" />
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-center">
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Indicador de força da senha */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {password.length >= 6 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className={password.length >= 6 ? 'text-green-600' : 'text-yellow-600'}>
                      {password.length >= 6 ? 'Senha válida' : 'Mínimo 6 caracteres'}
                    </span>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center gap-2 text-sm">
                      {password === confirmPassword ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={password === confirmPassword ? 'text-green-600' : 'text-red-600'}>
                        {password === confirmPassword ? 'Senhas coincidem' : 'Senhas não coincidem'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || password.length < 6 || password !== confirmPassword}
              >
                {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:underline"
              >
                Voltar para o login
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
