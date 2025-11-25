#!/bin/sh

PGUSER="test"
PGDATABASE="hello-world"
PGPASSWORD="test"   # or use environment variable externally


nohup kubectl port-forward svc/postgres 5432:5432

SQL1="UPDATE public.\"Message\" SET \"Message\" = 'Hello World' WHERE \"MessageId\" = 3;"
SQL2="UPDATE public.\"Message\" SET \"Message\" = 'I am Spartacus' WHERE \"MessageId\" = 3;"


while true; do
    echo "Running UPDATE at $(date)..."

    psql \
      --username="$PGUSER" \
      --dbname="$PGDATABASE" \
      --command="$SQL1"

    sleep 25

    echo "Running UPDATE at $(date)..."

    psql \
      --username="$PGUSER" \
      --dbname="$PGDATABASE" \
      --command="$SQL2"

    sleep 25
done