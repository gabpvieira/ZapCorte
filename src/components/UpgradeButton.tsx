import { Button } from "@/components/ui/button";
import { useCaktoCheckout } from "@/hooks/useCaktoCheckout";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes } from "react";

interface UpgradeButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  planType?: 'starter' | 'pro';
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  showLoadingText?: boolean;
}

/**
 * Componente de botão para upgrade de plano
 * 
 * Características:
 * - Redirecionamento direto para checkout sem necessidade de novo login
 * - Pré-preenchimento automático dos dados do usuário logado
 * - Estado de loading visual durante o processo
 * - Validação automática de autenticação
 * 
 * @example
 * // Botão simples para upgrade ao plano Starter
 * <UpgradeButton planType="starter">
 *   Fazer Upgrade
 * </UpgradeButton>
 * 
 * @example
 * // Botão customizado com variante e tamanho
 * <UpgradeButton 
 *   planType="pro" 
 *   variant="outline" 
 *   size="lg"
 * >
 *   Assinar Plano Pro
 * </UpgradeButton>
 */
export const UpgradeButton = ({
  planType = 'starter',
  variant = 'default',
  size = 'default',
  children = 'Fazer Upgrade',
  showLoadingText = true,
  disabled,
  className,
  ...props
}: UpgradeButtonProps) => {
  const { handleUpgrade, isLoading } = useCaktoCheckout();

  const handleClick = () => {
    handleUpgrade(planType);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {showLoadingText && 'Carregando...'}
        </>
      ) : (
        children
      )}
    </Button>
  );
};
