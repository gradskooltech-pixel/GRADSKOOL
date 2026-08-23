from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pdfs', '0007_pdf_is_upcoming'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pdf',
            name='status',
            field=models.CharField(
                choices=[
                    ('draft', 'Draft'),
                    ('processing', 'Processing'),
                    ('ready', 'Ready'),
                    ('upcoming', 'Upcoming — sellable, content not yet uploaded'),
                    ('failed', 'Failed'),
                ],
                default='draft',
                max_length=20,
            ),
        ),
    ]