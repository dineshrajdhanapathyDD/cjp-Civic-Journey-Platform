"""CockroachDB connection management."""

import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from src.config import get_settings

# Register UUID adapter
psycopg2.extras.register_uuid()


def get_connection():
    """Create a new database connection."""
    settings = get_settings()
    return psycopg2.connect(settings.cockroachdb_url)


@contextmanager
def get_db():
    """Context manager for database connections with auto-commit."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def get_cursor():
    """Context manager for database cursor with dict results."""
    with get_db() as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            yield cursor
        finally:
            cursor.close()


def init_db():
    """Initialize database schema by running migrations."""
    import os

    migrations_dir = os.path.join(os.path.dirname(__file__), "..", "..", "migrations")
    migrations_dir = os.path.abspath(migrations_dir)

    with get_db() as conn:
        cursor = conn.cursor()
        # Run migrations in order
        for filename in sorted(os.listdir(migrations_dir)):
            if filename.endswith(".sql"):
                filepath = os.path.join(migrations_dir, filename)
                with open(filepath, "r") as f:
                    sql = f.read()
                try:
                    cursor.execute(sql)
                    print(f"Migration applied: {filename}")
                except Exception as e:
                    print(f"Migration {filename} - skipped or error: {e}")
        cursor.close()
