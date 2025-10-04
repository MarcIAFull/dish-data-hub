-- =====================================================
-- FASE 1: SISTEMA DE ROLES (BASE DE SEGURANÇA)
-- =====================================================

-- 1. Criar enum para roles da aplicação
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Criar tabela user_roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

-- 3. Criar índices para performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- 4. Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Criar função SECURITY DEFINER para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 6. Criar função auxiliar para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

-- 7. RLS Policies para user_roles
-- Usuários podem ver seus próprios roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins podem ver todos os roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Apenas admins podem inserir roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Apenas admins podem atualizar roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Apenas admins podem deletar roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 8. Comentários para documentação
COMMENT ON TABLE public.user_roles IS 'Armazena os roles/permissões dos usuários da aplicação';
COMMENT ON FUNCTION public.has_role IS 'Verifica se um usuário possui um role específico (SECURITY DEFINER para evitar recursão RLS)';
COMMENT ON FUNCTION public.is_admin IS 'Função auxiliar para verificar se um usuário é admin';