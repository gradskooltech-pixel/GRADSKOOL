from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tools', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tool',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='tool',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
    ]
