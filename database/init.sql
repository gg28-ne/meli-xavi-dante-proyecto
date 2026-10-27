-- PROPORCIONADO: una mesa; varias canceladas pero solo una activa por fecha/hora.
-- active_slot es NULL al cancelar: UNIQUE permite varios NULL.
-- Este archivo se aplica automáticamente SOLO a un volumen vacío.
CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  diners TINYINT UNSIGNED NOT NULL,
  status ENUM('active','cancelled') NOT NULL DEFAULT 'active',
  source ENUM('form','chat','test') NOT NULL DEFAULT 'form',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP NULL,
  active_slot VARCHAR(32) GENERATED ALWAYS AS (
    CASE WHEN status = 'active' THEN CONCAT(reservation_date, ' ', reservation_time) ELSE NULL END
  ) STORED,
  CONSTRAINT chk_diners CHECK (diners BETWEEN 1 AND 8),
  UNIQUE KEY uq_active_slot (active_slot),
  INDEX idx_reservation_date (reservation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos ficticios futuros para comprobar la inicialización.
INSERT IGNORE INTO reservations (id, customer_name, reservation_date, reservation_time, diners, source)
VALUES
  (1, 'Cliente de prueba', '2030-06-15', '13:30:00', 2, 'test'),
  (2, 'Familia Demo', '2030-06-15', '20:30:00', 4, 'test');

