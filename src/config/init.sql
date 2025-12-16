-- src/config/init.sql (CÓDIGO COMPLETO CORREGIDO)

-- 1. Eliminar tablas existentes en orden inverso de dependencias
DROP TABLE IF EXISTS "Transacciones" CASCADE;
DROP TABLE IF EXISTS "ReglasDelNegocio" CASCADE;
DROP TABLE IF EXISTS "Clientes" CASCADE;
DROP TABLE IF EXISTS "Usuarios" CASCADE;

-- 2. Eliminar tipos ENUM
DROP TYPE IF EXISTS TIPO_REGISTRO CASCADE;
DROP TYPE IF EXISTS TIPO_MOVIMIENTO CASCADE;
DROP TYPE IF EXISTS ROL_USUARIO CASCADE;

-- 3. Crear tipos ENUM
CREATE TYPE ROL_USUARIO AS ENUM ('ADMINISTRADOR', 'CAJERO');
CREATE TYPE TIPO_MOVIMIENTO AS ENUM ('ABONO', 'CANJE');
CREATE TYPE TIPO_REGISTRO AS ENUM ('CAJA', 'APP');

-- 4. Crear tabla Usuarios
CREATE TABLE "Usuarios" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(255) NOT NULL,
    usuario_login VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ROL_USUARIO NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insertar usuarios iniciales
INSERT INTO "Usuarios" (nombre_completo, usuario_login, password_hash, rol) VALUES
('Administrador Principal', 'admin', '$2a$10$AkpMYsi7eQ723n3i9pQMsuinvc.hsrG76S1LvmA1WTUe2h/Fa/Exe', 'ADMINISTRADOR'),
('Juan Pérez (Cajero)', 'cajero', '$2a$10$AkpMYsi7eQ723n3i9pQMsuinvc.hsrG76S1LvmA1WTUe2h/Fa/Exe', 'CAJERO');

-- 6. Crear tabla Clientes
CREATE TABLE "Clientes" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_celular VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    edad INTEGER,
    sexo VARCHAR(20),
    saldo_puntos DECIMAL(10, 2) DEFAULT 0.00,
    fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Crear tabla ReglasDelNegocio
CREATE TABLE "ReglasDelNegocio" (
    id SERIAL PRIMARY KEY,
    porcentaje_recompensa DECIMAL(5, 2) NOT NULL,
    ultima_modificacion_por_id UUID REFERENCES "Usuarios"(id),
    fecha_ultima_modificacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Insertar regla inicial
INSERT INTO "ReglasDelNegocio" (porcentaje_recompensa) VALUES (3.00);

-- 9. Crear tabla Transacciones
CREATE TABLE "Transacciones" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES "Clientes"(id) NOT NULL,
    cajero_id UUID REFERENCES "Usuarios"(id) NOT NULL,
    monto_efectivo DECIMAL(10, 2) NOT NULL,
    tipo_movimiento TIPO_MOVIMIENTO NOT NULL,
    monto_venta_original DECIMAL(10, 2) NULL,
    porcentaje_recompensa DECIMAL(5, 2) NULL,
    fecha_transaccion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    folio_ticket VARCHAR(50) NULL,
    tipo_registro TIPO_REGISTRO NULL
);

-- 10. Crear índices
CREATE INDEX idx_usuario_login ON "Usuarios" (usuario_login);
CREATE INDEX idx_numero_celular ON "Clientes" (numero_celular);
CREATE INDEX idx_transaccion_cliente ON "Transacciones" (cliente_id, fecha_transaccion DESC);

-- 11. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos inicializada correctamente';
END $$;