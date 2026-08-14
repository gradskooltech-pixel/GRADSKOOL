from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('foundations', '0005_foundationsection_foundationclass_instructor_name_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='foundationclass',
            name='instructor_name',
            field=models.CharField(
                max_length=100, blank=True,
                help_text='Who taught this class. Leave blank to show "ALP Sir" (the default).'
            ),
        ),
    ]