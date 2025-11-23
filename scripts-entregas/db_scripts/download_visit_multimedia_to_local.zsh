#!/bin/zsh

# Define the database credentials
DB_HOST="localhost"
DB_PORT=5436
DB_USER="salesforce_user"
DB_PASSWORD="salesforce_password"
DB_NAME="salesforce_schema"

# Create the directory if it doesn't exist
mkdir -p ~/Downloads/visit_multimedia

# Download the visit multimedia
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -A -t -F $'\t' \
  -c "SELECT file_name, replace(encode(file_data, 'base64'), E'\n', '') FROM visit_multimedia;" | \
while IFS=$'\t' read -r name b64; do \
  safe_name=$(echo "$name" | tr -cd '[:alnum:]_.-')
  echo "$b64" | base64 --decode > "$HOME/Downloads/visit_multimedia/$safe_name"
  echo "✅ Saved: $safe_name"
done