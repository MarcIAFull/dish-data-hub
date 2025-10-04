-- =====================================================
-- AUTO-ADMIN: ATRIBUIR ROLE ADMIN AUTOMATICAMENTE
-- =====================================================

-- Criar função para atribuir role admin automaticamente para emails específicos
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['pedromagnago0@gmail.com'];
  user_email TEXT;
BEGIN
  -- Pegar o email do usuário que acabou de ser criado
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Verificar se o email está na lista de admins
  IF user_email = ANY(admin_emails) THEN
    -- Inserir role de admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Role admin atribuída automaticamente para %', user_email;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger que executa após inserir um novo perfil
DROP TRIGGER IF EXISTS trigger_auto_assign_admin ON public.profiles;

CREATE TRIGGER trigger_auto_assign_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_admin_role();

-- Comentário
COMMENT ON FUNCTION public.auto_assign_admin_role IS 'Atribui automaticamente role de admin para emails pré-definidos quando um novo usuário faz signup';

-- Se o usuário já existir, tentar atribuir role agora
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'pedromagnago0@gmail.com'
  LIMIT 1;

  IF user_uuid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_uuid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role atribuída para usuário existente: %', user_uuid;
  ELSE
    RAISE NOTICE 'Usuário pedromagnago0@gmail.com ainda não existe. A role será atribuída automaticamente no signup.';
  END IF;
END $$;