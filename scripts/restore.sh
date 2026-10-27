#!/bin/sh
# PROPORCIONADO F6: parar escrituras y copias ANTES de ejecutar este script.
set -eu
: "${DB_HOST:?}" "${DB_NAME:?}" "${DB_USER:?}" "${DB_PASSWORD:?}"
if [ "$#" -ne 1 ] || [ ! -s "$1" ]; then
  echo "Uso: sh /scripts/restore.sh /backups/copia.sql (existente y no vacía)" >&2
  exit 1
fi
export MYSQL_PWD="$DB_PASSWORD"
mariadb --host="$DB_HOST" --user="$DB_USER" "$DB_NAME" < "$1"
echo "Restauración finalizada: $1"
