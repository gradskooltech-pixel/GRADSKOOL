from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pdfs', '0008_pdf_status_upcoming_choice'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='pdfpurchase',
            constraint=models.UniqueConstraint(
                fields=['user', 'pdf'],
                condition=models.Q(status='paid'),
                name='unique_paid_pdf_purchase_per_user',
            ),
        ),
    ]