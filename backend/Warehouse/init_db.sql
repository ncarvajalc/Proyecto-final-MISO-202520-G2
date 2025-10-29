-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);

-- Insert seed data for warehouses
INSERT INTO warehouses (name, location, active) VALUES
    ('Bodega Principal', 'Bogotá - Calle 100', TRUE),
    ('Bodega Norte', 'Barranquilla - Zona Industrial', TRUE),
    ('Bodega Sur', 'Medellín - Centro', TRUE)
ON CONFLICT DO NOTHING;

-- Insert seed inventory data for products
-- Assuming products with IDs 1-10 exist in the products database
INSERT INTO inventory (product_id, warehouse_id, stock_quantity, available_quantity) VALUES
    -- Product 1
    (1, 1, 80, 75),
    (1, 2, 50, 45),
    (1, 3, 20, 20),
    -- Product 2
    (2, 1, 60, 55),
    (2, 3, 25, 20),
    -- Product 3
    (3, 1, 100, 95),
    (3, 2, 40, 35),
    -- Product 4
    (4, 2, 70, 65),
    (4, 3, 30, 25),
    -- Product 5
    (5, 1, 90, 85),
    (5, 2, 50, 45),
    (5, 3, 35, 30)
ON CONFLICT DO NOTHING;
