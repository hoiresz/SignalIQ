"""Remove conversation dependency from lead tables

Revision ID: remove_conv_dep
Revises: 
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'remove_conv_dep'
down_revision = None  # This will be set to the latest migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make conversation_id nullable in lead_tables
    op.alter_column('lead_tables', 'conversation_id',
                    existing_type=postgresql.UUID(),
                    nullable=True)
    
    # Drop and recreate foreign key constraint to allow SET NULL
    op.drop_constraint('lead_tables_conversation_id_fkey', 'lead_tables', type_='foreignkey')
    op.create_foreign_key('lead_tables_conversation_id_fkey', 'lead_tables', 'conversations', 
                         ['conversation_id'], ['id'], ondelete='SET NULL')
    
    # Make lead_table_id nullable in conversations
    op.alter_column('conversations', 'lead_table_id',
                    existing_type=postgresql.UUID(),
                    nullable=True)


def downgrade() -> None:
    # Revert conversation_id to NOT NULL in lead_tables
    op.alter_column('lead_tables', 'conversation_id',
                    existing_type=postgresql.UUID(),
                    nullable=False)
    
    # Restore original foreign key constraint
    op.drop_constraint('lead_tables_conversation_id_fkey', 'lead_tables', type_='foreignkey')
    op.create_foreign_key('lead_tables_conversation_id_fkey', 'lead_tables', 'conversations', 
                         ['conversation_id'], ['id'], ondelete='CASCADE')
    
    # Revert lead_table_id to NOT NULL in conversations
    op.alter_column('conversations', 'lead_table_id',
                    existing_type=postgresql.UUID(),
                    nullable=False)