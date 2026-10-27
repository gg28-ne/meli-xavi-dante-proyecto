#!/bin/sh
# PROPORCIONADO F6: dump consistente. Configurar servicio y montajes es vuestra tarea.
set -eu
: "${DB_HOST:?}" "${DB_NAME:?}" "${DB_USER:?}" "${DB_PASSWORD:?}"
interval="${BACKUP_INTERVAL_SECONDS:-300}"
case "$interval" in ''|*[!0-9]*) echo "Intervalo incorrecto" >&2; exit 1;; esac
[ "$interval" -gt 0 ] || exit 1
umask 077
mkdir -p /backups
# Evita incluir la contraseña en los argumentos de los procesos.
export MYSQL_PWD="$DB_PASSWORD"
while true; do
  stamp="$(date -u +%Y%m%d_%H%M%S)"
  temporary="/backups/.reservafacil_${stamp}_$$.tmp"
  final="/backups/reservafacil_${stamp}_$$.sql"
  if mariadb-dump --host="$DB_HOST" --user="$DB_USER" --single-transaction --skip-lock-tables --no-tablespaces --triggers "$DB_NAME" > "$temporary"; then
    mv "$temporary" "$final"
    echo "[$(date -Iseconds)] Copia correcta: $final"
  else
    rm -f "$temporary"
    echo "[$(date -Iseconds)] Error en copia" >&2
  fi
  sleep "$interval"
done
