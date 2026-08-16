from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pdfs', '0004_pdf_card_label'),
    ]

    operations = [
        migrations.AddField(
            model_name='pdf',
            name='fyq_category',
            field=models.BooleanField(
                default=False,
                help_text='Counts toward the "<EXAM> FYQs" library card without attaching to any specific FYQ question. Requires Exam to be set above.',
            ),
        ),
    ]