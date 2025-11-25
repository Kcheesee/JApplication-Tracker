"""Add fit analysis columns to applications

Revision ID: add_fit_analysis
Revises: 
Create Date: 2024-11-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_fit_analysis'
down_revision = None  # Update this to your latest revision
branch_labels = None
depends_on = None


def upgrade():
    # Add fit analysis columns to applications table
    op.add_column('applications', sa.Column('fit_analysis_score', sa.Float(), nullable=True))
    op.add_column('applications', sa.Column('fit_analysis_label', sa.String(), nullable=True))
    op.add_column('applications', sa.Column('fit_analysis_should_apply', sa.String(10), nullable=True))
    op.add_column('applications', sa.Column('fit_analysis_recommendation', sa.Text(), nullable=True))
    op.add_column('applications', sa.Column('fit_analysis_data', sa.Text(), nullable=True))  # JSON data
    op.add_column('applications', sa.Column('fit_analysis_date', sa.DateTime(timezone=True), nullable=True))
    
    # Add tailoring plan data
    op.add_column('applications', sa.Column('tailoring_plan', sa.Text(), nullable=True))  # JSON data
    op.add_column('applications', sa.Column('tailoring_plan_date', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    # Remove fit analysis columns
    op.drop_column('applications', 'tailoring_plan_date')
    op.drop_column('applications', 'tailoring_plan')
    op.drop_column('applications', 'fit_analysis_date')
    op.drop_column('applications', 'fit_analysis_data')
    op.drop_column('applications', 'fit_analysis_recommendation')
    op.drop_column('applications', 'fit_analysis_should_apply')
    op.drop_column('applications', 'fit_analysis_label')
    op.drop_column('applications', 'fit_analysis_score')
