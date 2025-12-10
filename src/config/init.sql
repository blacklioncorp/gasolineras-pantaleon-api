-- src/config/init.sql (ARCHIVO COMPLETO Y ACTUALIZADO)

-- 1. Eliminar tipos y tablas existentes para limpieza en desarrollo
DROP TABLE IF EXISTS "Transacciones"
CASCADE;
DROP TABLE IF EXISTS "Clientes"
CASCADE;
DROP TABLE IF EXISTS "ReglasDelNegocio"
CASCADE;
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


    -- 4. Inserción del Administrador Inicial (Contraseña: admin)
    INSERT INTO "Usuarios"
        (nombre_completo, usuario_login, password_hash, rol)
    VALUES
        (
            'Administrador Principal',
            'admin',
            '$2a$10$qHlH2qSo97IEJXq0pvXcIevWo1eKegSCX7Xt67UuAbB
/v/3McdIsC', -- <<< ¡IMPORTANTE! REEMPLAZAR
            'ADMINISTRADOR'
);

    -- (Se puede añadir aquí un usuario 'cajero' para pruebas)
    INSERT INTO "Usuarios"
        (nombre_completo, usuario_login, password_hash, rol)
    VALUES
        (
            'Juan Pérez (Cajero)',
            'cajero',
            '$2a$10$qHlH2qSo97IEJXq0pvXcIevWo1eKegSCX7Xt67UuAbB
/v/3McdIsC', -- <<< ¡IMPORTANTE! REEMPLAZAR
            'CAJERO'
);


    -- 5. Crear la tabla Clientes
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

        -- 6. Crear la tabla ReglasDelNegocio (Configuración de Puntos)
        CREATE TABLE "ReglasDelNegocio"
        (
            id SERIAL PRIMARY KEY,
            -- Usamos SERIAL ya que solo habrá 1 registro para el porcentaje
            porcentaje_recompensa DECIMAL(5, 2) NOT NULL,
            ultima_modificacion_por_id UUID REFERENCES "Usuarios"(id),
            fecha_ultima_modificacion TIMESTAMP
            WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

            -- 7. Insertar el valor inicial de la regla (3% de recompensa)
            INSERT INTO "ReglasDelNegocio"
                (porcentaje_recompensa)
            VALUES
                (3.00);


            -- 8. Crear la tabla Transacciones (Historial de Abonos)
            CREATE TABLE "Transacciones"
            (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                cliente_id UUID REFERENCES "Clientes"(id) NOT NULL,
                cajero_id UUID REFERENCES "Usuarios"(id) NOT NULL,
                monto_venta DECIMAL(10, 2) NOT NULL,
                porcentaje_recompensa DECIMAL(5, 2) NOT NULL,
                puntos_abonados DECIMAL(10, 2) NOT NULL,
                fecha_transaccion TIMESTAMP
                WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


                -- 9. Crear índices para búsquedas rápidas
                CREATE INDEX idx_usuario_login ON "Usuarios" (usuario_login);
                CREATE INDEX idx_numero_celular ON "Clientes" (numero_celular);
                CREATE INDEX idx_transaccion_cliente ON "Transacciones" (cliente_id, fecha_transaccion DESC);