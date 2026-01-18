"""create_separate_admin_table

Revision ID: 23db93521f85
Revises: 0d1a0ad6d73d
Create Date: 2026-01-01 12:13:51.289584

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '23db93521f85'
down_revision = '0d1a0ad6d73d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create admins table
    op.create_table('admins',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_admins_user_id'), 'admins', ['user_id'], unique=True)
    
    # Migrate existing admin users to admins table
    import uuid
    connection = op.get_bind()
    result = connection.execute(sa.text("SELECT id, created_at, updated_at FROM users WHERE is_admin = true"))
    for row in result:
        admin_id = uuid.uuid4()
        connection.execute(sa.text("""
            INSERT INTO admins (id, user_id, created_at, updated_at)
            VALUES (:id, :user_id, :created_at, :updated_at)
        """), {
            "id": admin_id,
            "user_id": row[0],
            "created_at": row[1],
            "updated_at": row[2]
        })
    
    # Drop is_admin column from users table
    op.drop_column('users', 'is_admin')


def downgrade() -> None:
    # Add is_admin column back to users table
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'))
    
    # Migrate admins back to is_admin flag
    op.execute("""
        UPDATE users
        SET is_admin = true
        WHERE id IN (SELECT user_id FROM admins)
    """)
    
    # Drop admins table
    op.drop_index(op.f('ix_admins_user_id'), table_name='admins')
    op.drop_table('admins')

