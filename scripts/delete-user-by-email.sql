-- ============================================
-- Script para deletar usuário completo por email
-- ============================================
-- USO: Substitua 'email@exemplo.com' pelo email do usuário
-- ============================================

DO $$
DECLARE
  target_email TEXT := 'email@exemplo.com'; -- ALTERE AQUI
  target_user_id UUID;
  barbershop_ids UUID[];
BEGIN
  -- 1. Buscar user_id pelo email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'Usuário com email % não encontrado', target_email;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Deletando usuário: % (ID: %)', target_email, target_user_id;
  
  -- 2. Buscar IDs das barbershops do usuário
  SELECT ARRAY_AGG(id) INTO barbershop_ids
  FROM barbershops
  WHERE user_id = target_user_id;
  
  -- 3. Deletar appointments relacionados
  IF barbershop_ids IS NOT NULL THEN
    DELETE FROM appointments
    WHERE barbershop_id = ANY(barbershop_ids);
    RAISE NOTICE '✓ Appointments deletados';
  END IF;
  
  -- 4. Deletar customers relacionados
  IF barbershop_ids IS NOT NULL THEN
    DELETE FROM customers
    WHERE barbershop_id = ANY(barbershop_ids);
    RAISE NOTICE '✓ Customers deletados';
  END IF;
  
  -- 5. Deletar services relacionados
  IF barbershop_ids IS NOT NULL THEN
    DELETE FROM services
    WHERE barbershop_id = ANY(barbershop_ids);
    RAISE NOTICE '✓ Services deletados';
  END IF;
  
  -- 6. Deletar availability relacionados
  IF barbershop_ids IS NOT NULL THEN
    DELETE FROM availability
    WHERE barbershop_id = ANY(barbershop_ids);
    RAISE NOTICE '✓ Availability deletados';
  END IF;
  
  -- 7. Deletar barbershops
  DELETE FROM barbershops
  WHERE user_id = target_user_id;
  RAISE NOTICE '✓ Barbershops deletados';
  
  -- 8. Deletar payment_history
  DELETE FROM payment_history
  WHERE user_id = target_user_id;
  RAISE NOTICE '✓ Payment history deletado';
  
  -- 9. Deletar profiles
  DELETE FROM profiles
  WHERE user_id = target_user_id;
  RAISE NOTICE '✓ Profile deletado';
  
  -- 10. Deletar da tabela users (public)
  DELETE FROM users
  WHERE id = target_user_id;
  RAISE NOTICE '✓ User (public) deletado';
  
  -- 11. Deletar do auth.users
  DELETE FROM auth.users
  WHERE id = target_user_id;
  RAISE NOTICE '✓ Auth user deletado';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Usuário % completamente removido!', target_email;
  RAISE NOTICE '========================================';
END $$;
