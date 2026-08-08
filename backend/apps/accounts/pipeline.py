"""
GRADSKOOL — Social Auth Pipeline

Custom step: save Google avatar URL after OAuth login.
"""


def save_avatar(backend, strategy, details, response, user=None, *args, **kwargs):
    """
    Runs after user is created/found via social-auth pipeline.
    Saves Google profile picture as avatar_url.
    """
    if not user:
        return

    if backend.name == 'google-oauth2':
        picture = response.get('picture', '')
        if picture and not user.avatar_url:
            user.avatar_url = picture
            user.is_google_auth = True
            user.is_verified = True
            user.save(update_fields=['avatar_url', 'is_google_auth', 'is_verified'])
