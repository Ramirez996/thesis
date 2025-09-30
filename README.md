---
title: bert-space
emoji: "🤖"
colorFrom: indigo
colorTo: blue
sdk: gradio
sdk_version: "3.49.0"
app_file: bert-space/app.py
pinned: false
---

This repository contains multiple projects. The frontmatter above instructs Hugging Face Spaces to use `bert-space/app.py` as the entrypoint for the Space so it runs the intended Flask app that uses `bert-space/requirements.txt` and `bert-space/start`.

If your app is not a Gradio app (for example you use Flask + gunicorn), the frontmatter still helps Spaces pick the correct `app_file`. If you prefer, you can edit this README in the Spaces web UI (Files) and save — that will trigger a rebuild without pushing large binary files from your local repo.
