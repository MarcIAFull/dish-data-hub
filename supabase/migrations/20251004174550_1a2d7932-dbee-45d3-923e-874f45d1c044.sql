-- =====================================================
-- FASE 4: ATUALIZAR RLS POLICIES PARA ADMINS
-- =====================================================

-- =====================================================
-- POLICIES PARA RESTAURANTS
-- =====================================================

-- Admins podem ver todos os restaurantes
CREATE POLICY "Admins can view all restaurants"
ON public.restaurants
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins podem inserir qualquer restaurante
CREATE POLICY "Admins can insert any restaurant"
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Admins podem atualizar qualquer restaurante
CREATE POLICY "Admins can update any restaurant"
ON public.restaurants
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins podem deletar qualquer restaurante
CREATE POLICY "Admins can delete any restaurant"
ON public.restaurants
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- POLICIES PARA AGENTS
-- =====================================================

-- Admins podem ver todos os agentes
CREATE POLICY "Admins can view all agents"
ON public.agents
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins podem inserir qualquer agente
CREATE POLICY "Admins can insert any agent"
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Admins podem atualizar qualquer agente
CREATE POLICY "Admins can update any agent"
ON public.agents
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins podem deletar qualquer agente
CREATE POLICY "Admins can delete any agent"
ON public.agents
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- POLICIES PARA CATEGORIES
-- =====================================================

-- Admins podem ver todas as categorias
CREATE POLICY "Admins can view all categories"
ON public.categories
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins podem inserir qualquer categoria
CREATE POLICY "Admins can insert any category"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Admins podem atualizar qualquer categoria
CREATE POLICY "Admins can update any category"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins podem deletar qualquer categoria
CREATE POLICY "Admins can delete any category"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- POLICIES PARA PRODUCTS
-- =====================================================

-- Admins podem ver todos os produtos
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins podem inserir qualquer produto
CREATE POLICY "Admins can insert any product"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Admins podem atualizar qualquer produto
CREATE POLICY "Admins can update any product"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins podem deletar qualquer produto
CREATE POLICY "Admins can delete any product"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON POLICY "Admins can view all restaurants" ON public.restaurants IS 'Permite que administradores visualizem todos os restaurantes do sistema';
COMMENT ON POLICY "Admins can view all agents" ON public.agents IS 'Permite que administradores visualizem todos os agentes do sistema';
COMMENT ON POLICY "Admins can view all categories" ON public.categories IS 'Permite que administradores visualizem todas as categorias do sistema';
COMMENT ON POLICY "Admins can view all products" ON public.products IS 'Permite que administradores visualizem todos os produtos do sistema';