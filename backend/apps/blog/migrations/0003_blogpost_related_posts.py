from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0002_alter_blogpost_body_help_text'),
    ]

    operations = [
        migrations.AddField(
            model_name='blogpost',
            name='related_posts',
            field=models.ManyToManyField(blank=True, related_name='featured_on', to='blog.blogpost'),
        ),
    ]