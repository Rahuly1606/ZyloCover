"""Add admin_credential column to users table

Revision ID: 001
Revises: 
Create Date: 2026-04-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if column exists before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'admin_credential' not in columns:
        op.add_column('users', 
            sa.Column('admin_credential', sa.String(255), nullable=True)
        )
        print("✅ Added admin_credential column")
    else:
        print("✅ Column admin_credential already exists")


def downgrade() -> None:
    op.drop_column('users', 'admin_credential')
