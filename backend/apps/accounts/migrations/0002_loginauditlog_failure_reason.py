from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='loginauditlog',
            name='failure_reason',
            field=models.CharField(
                blank=True, max_length=20,
                choices=[('no_account', 'No account with this email'), ('wrong_password', 'Wrong password')],
            ),
        ),
    ]