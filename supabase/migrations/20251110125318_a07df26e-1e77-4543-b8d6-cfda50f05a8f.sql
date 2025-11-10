-- Corrigir slug do "Empório da Jô" (tem tab character inválido)
UPDATE restaurants 
SET slug = 'emporio-da-jo'
WHERE id = 'babab6a9-04c9-4c70-885d-a06a09ae7d82';

-- Criar função para sanitizar slugs automaticamente
CREATE OR REPLACE FUNCTION sanitize_restaurant_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitiza o slug antes de inserir/atualizar
  NEW.slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          unaccent(NEW.slug),  -- Remove acentos
          '[^a-z0-9\s-]', '', 'g'  -- Remove caracteres especiais
        ),
        '\s+', '-', 'g'  -- Espaços → hífens
      ),
      '-+', '-', 'g'  -- Remove hífens duplicados
    )
  );
  
  -- Remove hífens no início e fim
  NEW.slug := trim(both '-' from NEW.slug);
  
  -- Valida que o slug não está vazio
  IF NEW.slug = '' OR NEW.slug IS NULL THEN
    RAISE EXCEPTION 'Slug inválido após sanitização';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para aplicar sanitização automaticamente
DROP TRIGGER IF EXISTS sanitize_slug_trigger ON restaurants;
CREATE TRIGGER sanitize_slug_trigger
  BEFORE INSERT OR UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_restaurant_slug();

-- Adicionar comentários para documentação
COMMENT ON FUNCTION sanitize_restaurant_slug() IS 'Sanitiza automaticamente slugs de restaurantes removendo acentos, caracteres especiais e normalizando espaços';
COMMENT ON TRIGGER sanitize_slug_trigger ON restaurants IS 'Garante que slugs sejam sempre válidos e URL-friendly';
