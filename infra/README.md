# Infra

Local throwaway PostgreSQL for auth-learn.

Start:
```bash
docker compose -f infra/compose/docker-compose.postgres.yml up -d
```

Stop:
```bash
docker compose -f infra/compose/docker-compose.postgres.yml down
```

Wipe data:
```bash
docker compose -f infra/compose/docker-compose.postgres.yml down -v
```

Port: 5433 (to avoid conflicts)
