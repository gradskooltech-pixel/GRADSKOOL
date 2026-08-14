import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('foundations', '0004_foundationclass_meta_description'),
    ]

    operations = [
        migrations.CreateModel(
            name='FoundationSection',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('exams', models.JSONField(default=list, help_text='List of exam codes this section applies to, e.g. ["xat","snap"]. Set via the admin checkboxes.')),
                ('name', models.CharField(max_length=100)),
                ('slug', models.SlugField(blank=True, max_length=120, unique=True)),
                ('description', models.TextField(blank=True)),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order when browsing sections')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'foundation_sections',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.AddField(
            model_name='foundationclass',
            name='section',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Optional topic tag (e.g. "Decision Making") — lets this class be found by browsing that topic, separate from which series it belongs to.',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='classes',
                to='foundations.foundationsection',
            ),
        ),
    ]