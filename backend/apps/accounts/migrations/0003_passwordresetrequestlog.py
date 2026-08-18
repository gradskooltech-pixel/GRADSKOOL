import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('accounts', '0002_loginauditlog_failure_reason'),
    ]

    operations = [
        migrations.CreateModel(
            name='PasswordResetRequestLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email_attempted', models.EmailField(max_length=254)),
                ('account_found', models.BooleanField(help_text='Did this email match a real, active account?')),
                ('ip_address', models.GenericIPAddressField(null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='password_reset_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'password_reset_request_logs',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='passwordresetrequestlog',
            index=models.Index(fields=['email_attempted', '-created_at'], name='password_re_email_a_5f1c8a_idx'),
        ),
        migrations.AddIndex(
            model_name='passwordresetrequestlog',
            index=models.Index(fields=['ip_address', '-created_at'], name='password_re_ip_addr_9d3e2f_idx'),
        ),
    ]