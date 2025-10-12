-- Crear base de datos (si no existe)
CREATE DATABASE proveedores;

\c proveedores;

-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    direccion TEXT
);

-- Insertar datos de ejemplo
INSERT INTO proveedores (nombre, contacto, telefono, correo, direccion) VALUES
('Distribuidora Andina', 'Carlos López', '+57 3011234567', 'contacto@andina.com', 'Cra 15 #45-23, Bogotá'),
('AgroIndustrial S.A.', 'María Torres', '+57 3109876543', 'ventas@agroindustrial.com', 'Calle 80 #12-45, Medellín'),
('TechParts Ltda.', 'Juan Pérez', '+57 3165553344', 'info@techparts.co', 'Av. Suba #99-10, Bogotá'),
('Textiles del Norte', 'Laura Gómez', '+57 3137778899', 'contacto@textilesnorte.com', 'Cl 45 #23-12, Bucaramanga');
