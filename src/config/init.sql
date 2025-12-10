-- src/config/init.sql (REVISADO)

-- 1. Eliminar tipos y tablas existentes para limpieza en desarrollo
DROP TABLE IF EXISTS "Usuarios"
CASCADE;
DROP TYPE IF EXISTS ROL_USUARIO;


-- 2. Crear el tipo ENUM para el rol
CREATE TYPE ROL_USUARIO AS ENUM
('ADMINISTRADOR', 'CAJERO');


-- 3. Crear la tabla Usuarios
CREATE TABLE "Usuarios"
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(255) NOT NULL,
    usuario_login VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ROL_USUARIO NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP
    WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


    -- 4. Crear índice para búsquedas rápidas por login
    CREATE INDEX idx_usuario_login ON "Usuarios" (usuario_login);


    -- 5. Inserción del Administrador Inicial (Contraseña: admin)
    -- ¡REEMPLAZAR ESTE HASH!
    INSERT INTO "Usuarios"
        (nombre_completo, usuario_login, password_hash, rol)
    VALUES
        (
            'Administrador Principal',
            'admin',
            'TU_HASH_GENERADO_AQUI',
            'ADMINISTRADOR'
);


    -- 6. Crear la tabla Clientes
    CREATE TABLE "Clientes"
    (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero_celular VARCHAR(20) UNIQUE NOT NULL,
        nombre_completo VARCHAR(255) NOT NULL,
        edad INTEGER,
        sexo VARCHAR(20),
        saldo_puntos DECIMAL(10, 2) DEFAULT 0.00,
        fecha_registro TIMESTAMP
        WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


        -- 7. Crear índice para búsquedas rápidas por celular
        CREATE INDEX idx_numero_celular ON "Clientes" (numero_celular);