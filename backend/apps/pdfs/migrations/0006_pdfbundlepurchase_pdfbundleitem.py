import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('pdfs', '0005_pdf_fyq_category'),
    ]

    operations = [
        migrations.CreateModel(
            name='PdfBundlePurchase',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tier_count', models.PositiveIntegerField()),
                ('price_per_pdf', models.DecimalField(decimal_places=2, max_digits=8)),
                ('amount_inr', models.DecimalField(decimal_places=2, max_digits=10)),
                ('razorpay_order_id', models.CharField(blank=True, max_length=100, null=True, unique=True)),
                ('razorpay_payment_id', models.CharField(blank=True, db_index=True, max_length=100)),
                ('razorpay_signature', models.CharField(blank=True, max_length=256)),
                ('status', models.CharField(choices=[('created', 'Created'), ('paid', 'Paid'), ('failed', 'Failed'), ('refunded', 'Refunded')], default='created', max_length=20)),
                ('phone_captured', models.CharField(blank=True, max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('idempotency_key', models.CharField(blank=True, max_length=100, unique=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pdf_bundle_purchases', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'pdf_bundle_purchases',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='pdfbundlepurchase',
            index=models.Index(fields=['user'], name='pdf_bundle__user_id_5f3a1e_idx'),
        ),
        migrations.AddIndex(
            model_name='pdfbundlepurchase',
            index=models.Index(fields=['razorpay_order_id'], name='pdf_bundle__razorpa_9c2b7f_idx'),
        ),
        migrations.CreateModel(
            name='PdfBundleItem',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bundle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='pdfs.pdfbundlepurchase')),
                ('pdf', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bundle_items', to='pdfs.pdf')),
            ],
            options={
                'db_table': 'pdf_bundle_items',
            },
        ),
        migrations.AddConstraint(
            model_name='pdfbundleitem',
            constraint=models.UniqueConstraint(fields=('bundle', 'pdf'), name='unique_pdf_per_bundle'),
        ),
    ]
