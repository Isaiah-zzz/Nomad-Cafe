"""add_status_to_stories_and_is_admin_to_users

Revision ID: 0d1a0ad6d73d
Revises: 0e4762f75b37
Create Date: 2025-12-31 19:06:10.622131

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0d1a0ad6d73d'
down_revision = '0e4762f75b37'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_admin column to users table
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add status column to stories table
    op.add_column('stories', sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'))
    
    # Create index on status for faster queries
    op.create_index(op.f('ix_stories_status'), 'stories', ['status'], unique=False)
    
    # Set all existing stories to 'published' status
    op.execute("UPDATE stories SET status = 'published' WHERE status = 'pending'")


def downgrade() -> None:
    # Drop index
    op.drop_index(op.f('ix_stories_status'), table_name='stories')
    
    # Drop columns
    op.drop_column('stories', 'status')
    op.drop_column('users', 'is_admin')

