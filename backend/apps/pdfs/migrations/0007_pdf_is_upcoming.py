from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pdfs', '0006_pdfbundlepurchase_pdfbundleitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='pdf',
            name='is_upcoming',
            field=models.BooleanField(default=False),
        ),
    ]