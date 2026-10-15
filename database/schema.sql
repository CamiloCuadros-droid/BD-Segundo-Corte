-- TasteBox - Esquema de base de datos (corte 2)
-- Ejecutar: mysql -u root -p < database/schema.sql   (o: npm run db:init)

SET NAMES utf8mb4;
DROP DATABASE IF EXISTS tastebox;
CREATE DATABASE tastebox CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tastebox;

CREATE TABLE usuarios (
  id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  correo         VARCHAR(150) NOT NULL UNIQUE,
  contrasena     VARCHAR(255) NOT NULL,            -- texto plano en este corte (se protegera en el corte 3)
  rol            ENUM('usuario','admin') NOT NULL DEFAULT 'usuario',
  estado         ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE planes (
  id_plan            INT AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(50) NOT NULL UNIQUE,
  precio_mensual     DECIMAL(10,2) NOT NULL DEFAULT 0,
  limite_recetas_mes INT NULL                       -- NULL = ilimitado
);

CREATE TABLE suscripciones (
  id_suscripcion   INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario       INT NOT NULL,
  id_plan          INT NOT NULL,
  estado           ENUM('activa','vencida','cancelada') NOT NULL DEFAULT 'activa',
  fecha_inicio     DATE NOT NULL,
  fecha_expiracion DATE NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_plan)    REFERENCES planes(id_plan)
);

CREATE TABLE tipos_cocina (
  id_tipo_cocina INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE recetas (
  id_receta      INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(150) NOT NULL,
  id_tipo_cocina INT NOT NULL,
  dificultad     ENUM('facil','media','dificil') NOT NULL,
  tiempo_min     INT NOT NULL CHECK (tiempo_min > 0),
  descripcion    TEXT NOT NULL,
  imagen_url     VARCHAR(255) NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_tipo_cocina) REFERENCES tipos_cocina(id_tipo_cocina)
);

CREATE TABLE colecciones (
  id_usuario     INT NOT NULL,
  id_receta      INT NOT NULL,
  fecha_guardado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_receta),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_receta)  REFERENCES recetas(id_receta)  ON DELETE CASCADE
);

CREATE TABLE preparaciones (
  id_preparacion    INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario        INT NOT NULL,
  id_receta         INT NOT NULL,
  fecha_preparacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_receta)  REFERENCES recetas(id_receta)  ON DELETE CASCADE
);

CREATE TABLE resenas (
  id_resena          INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario         INT NOT NULL,
  id_receta          INT NOT NULL,
  calificacion       TINYINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario         TEXT NULL,
  volveria_a_cocinar BOOLEAN NOT NULL DEFAULT TRUE,
  fecha              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_usuario, id_receta),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_receta)  REFERENCES recetas(id_receta)  ON DELETE CASCADE
);

CREATE TABLE etiquetas (
  id_etiqueta INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE resena_etiquetas (
  id_resena   INT NOT NULL,
  id_etiqueta INT NOT NULL,
  PRIMARY KEY (id_resena, id_etiqueta),
  FOREIGN KEY (id_resena)   REFERENCES resenas(id_resena)     ON DELETE CASCADE,
  FOREIGN KEY (id_etiqueta) REFERENCES etiquetas(id_etiqueta) ON DELETE CASCADE
);

CREATE TABLE cajas_semanales (
  id_caja    INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  semana     DATE NOT NULL,                         -- lunes de la semana
  UNIQUE (id_usuario, semana),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE caja_recetas (
  id_caja   INT NOT NULL,
  id_receta INT NOT NULL,
  PRIMARY KEY (id_caja, id_receta),
  FOREIGN KEY (id_caja)   REFERENCES cajas_semanales(id_caja) ON DELETE CASCADE,
  FOREIGN KEY (id_receta) REFERENCES recetas(id_receta)       ON DELETE CASCADE
);

-- ===== Datos iniciales =====
INSERT INTO planes (nombre, precio_mensual, limite_recetas_mes) VALUES
  ('Gratuito', 0, 5),
  ('Premium', 29900, NULL);

INSERT INTO tipos_cocina (nombre) VALUES ('Italiana'), ('Mexicana'), ('Colombiana'), ('Asiática');
INSERT INTO etiquetas (nombre) VALUES ('Rápida'), ('Económica'), ('Saludable'), ('Para compartir');

INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES
  ('Administrador', 'admin@tastebox.com', 'admin123', 'admin');
INSERT INTO suscripciones (id_usuario, id_plan, estado, fecha_inicio)
  VALUES (1, 2, 'activa', CURDATE());

INSERT INTO recetas (nombre, id_tipo_cocina, dificultad, tiempo_min, descripcion, imagen_url) VALUES
  ('Pasta Carbonara', 1, 'media', 30, 'Clásica pasta italiana con huevo, queso pecorino y panceta.', NULL),
  ('Tacos al Pastor', 2, 'media', 45, 'Tacos de cerdo marinado con piña y cilantro.', NULL),
  ('Ajiaco Santafereño', 3, 'dificil', 90, 'Sopa bogotana con tres tipos de papa, pollo y guascas.', NULL);
