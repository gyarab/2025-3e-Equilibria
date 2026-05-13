import secrets
import shutil
import os

ENV_PATH = "equilibria/.env"
EXAMPLE_PATH = "equilibria/.env.example"

if os.path.exists(ENV_PATH):
    exit()

if not os.path.exists(EXAMPLE_PATH):
    exit(1)

shutil.copy(EXAMPLE_PATH, ENV_PATH)

new_key = f"django-insecure-{secrets.token_urlsafe(40)}"

with open(ENV_PATH, "r") as file:
    content = file.read()

content = content.replace("placeholder", new_key)

with open(ENV_PATH, "w") as file:
    file.write(content)