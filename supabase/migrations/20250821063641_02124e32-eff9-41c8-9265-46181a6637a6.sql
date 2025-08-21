-- Update restaurant info for A Família
UPDATE restaurants 
SET 
  description = 'O sabor da pizza artesanal brasileira em Portugal 🇧🇷🇵🇹',
  address = 'Rua Poeta Pardal 15, Quarteira, Faro, Portugal 8125-248',
  phone = '+351 937 750 540',
  whatsapp = '351937750540',
  instagram = '@afamiliaquarteira'
WHERE slug = 'a-familia';

-- Insert sample categories if they don't exist
INSERT INTO categories (restaurant_id, name, description, display_order) 
SELECT r.id, 'Entradas / Snacks', 'Porções e salgadinhos brasileiros', 1
FROM restaurants r 
WHERE r.slug = 'a-familia'
ON CONFLICT DO NOTHING;

INSERT INTO categories (restaurant_id, name, description, display_order) 
SELECT r.id, 'Hambúrgueres', 'Hambúrgueres artesanais com toque brasileiro', 2
FROM restaurants r 
WHERE r.slug = 'a-familia'
ON CONFLICT DO NOTHING;

INSERT INTO categories (restaurant_id, name, description, display_order) 
SELECT r.id, 'Pizzas', 'Pizzas artesanais com sabores únicos', 3
FROM restaurants r 
WHERE r.slug = 'a-familia'
ON CONFLICT DO NOTHING;

INSERT INTO categories (restaurant_id, name, description, display_order) 
SELECT r.id, 'Bebidas', 'Bebidas geladas e refrescantes', 4
FROM restaurants r 
WHERE r.slug = 'a-familia'
ON CONFLICT DO NOTHING;

-- Insert sample products for Entradas category
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT c.id, 'Enrolado de Fiambre e Queijo (12 un)', 'Rolinho recheado com fiambre e queijo.', 10.50, true, 1
FROM categories c 
JOIN restaurants r ON r.id = c.restaurant_id
WHERE r.slug = 'a-familia' AND c.name = 'Entradas / Snacks'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT c.id, 'Coxinha de Frango (10 un)', 'Tradicional salgadinho de frango desfiado.', 14.30, true, 2
FROM categories c 
JOIN restaurants r ON r.id = c.restaurant_id
WHERE r.slug = 'a-familia' AND c.name = 'Entradas / Snacks'
ON CONFLICT DO NOTHING;

-- Insert sample products for Hambúrgueres category
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT c.id, 'Hambúrguer Brasil', 'Hambúrguer de vaca, queijo, fiambre, alface, ovo frito, bacon, milho, cebola, calabresa, tomate + batata frita.', 18.00, true, 1
FROM categories c 
JOIN restaurants r ON r.id = c.restaurant_id
WHERE r.slug = 'a-familia' AND c.name = 'Hambúrgueres'
ON CONFLICT DO NOTHING;

-- Insert sample products for Pizzas category
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT c.id, 'Frango com Catupiry', 'Molho de tomate, mozzarella, frango desfiado, catupiry e orégãos.', 14.00, true, 1
FROM categories c 
JOIN restaurants r ON r.id = c.restaurant_id
WHERE r.slug = 'a-familia' AND c.name = 'Pizzas'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT c.id, 'Portuguesa', 'Molho de tomate, mozzarella, fiambre, ovo cozido, tomate, ervilha, milho, azeitonas pretas, cebola e orégãos.', 14.00, true, 2
FROM categories c 
JOIN restaurants r ON r.id = c.restaurant_id
WHERE r.slug = 'a-familia' AND c.name = 'Pizzas'
ON CONFLICT DO NOTHING;

-- Insert sample products for Bebidas category
INSERT INTO products (category_id, name, description, price, is_available, display_order)
SELECT c.id, 'Coca-Cola lata', 'Refrigerante Coca-Cola 33cl', 2.50, true, 1
FROM categories c 
JOIN restaurants r ON r.id = c.restaurant_id
WHERE r.slug = 'a-familia' AND c.name = 'Bebidas'
ON CONFLICT DO NOTHING;