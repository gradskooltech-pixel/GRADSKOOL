import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0003_blogpost_related_posts'),
    ]

    operations = [
        migrations.CreateModel(
            name='BlogPostView',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='view_records', to='blog.blogpost')),
            ],
            options={
                'db_table': 'blog_post_views',
            },
        ),
        migrations.AddConstraint(
            model_name='blogpostview',
            constraint=models.UniqueConstraint(fields=('post', 'ip_address'), name='unique_view_per_post_per_ip'),
        ),
    ]
