from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fyq', '0003_fyqquestion_meta_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='fyqquestion',
            name='instructor_name',
            field=models.CharField(
                max_length=100, blank=True, default='',
                help_text='Who solved this question. Leave blank to show "ALP Sir" (the default).'
            ),
        ),
    ]