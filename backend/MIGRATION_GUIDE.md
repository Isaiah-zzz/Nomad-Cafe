# Database Migration Guide

## Initial Setup

1. Make sure PostgreSQL is running and you have created the database:
```bash
createdb tavern_db
```

2. Update your `.env` file with the correct `DATABASE_URL`:
```
DATABASE_URL=postgresql://postgres@localhost:5432/tavern_db
```

## Running Migrations

### Create Initial Migration

After setting up the models, create the initial migration:
```bash
cd backend
alembic revision --autogenerate -m "Initial migration"
```

This will create a migration file in `alembic/versions/` that contains the SQL to create all tables.

### Apply Migrations

To apply all pending migrations:
```bash
alembic upgrade head
```

### Rollback Migration

To rollback the last migration:
```bash
alembic downgrade -1
```

### View Migration History

To see the migration history:
```bash
alembic history
```

### Check Current Revision

To see the current database revision:
```bash
alembic current
```

## Creating New Migrations

When you modify models:

1. Make changes to `app/db/models.py`
2. Generate a new migration:
   ```bash
   alembic revision --autogenerate -m "Description of changes"
   ```
3. Review the generated migration file in `alembic/versions/`
4. Apply the migration:
   ```bash
   alembic upgrade head
   ```

