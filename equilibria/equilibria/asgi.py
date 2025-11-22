import os
import django

# 1️⃣ Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'equilibria.settings')

# 2️⃣ Setup Django before importing anything else
django.setup()

# 3️⃣ Now import ASGI stuff
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
import main.routing  # must come after django.setup()

# 4️⃣ ASGI application
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            main.routing.websocket_urlpatterns
        )
    ),
})