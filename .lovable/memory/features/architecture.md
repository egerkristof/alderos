---
name: App architecture
description: Public Q&A at / and password-protected training at /coach
type: feature
---
Two-mode architecture:
- `/` = Public Explore page. Direct Q&A about Opus Dei via `explore` edge function. Clean chat-style interface.
- `/coach` = Password-protected (COACH_PASSWORD secret, verified via `verify-coach-password` edge function). Contains the full Catholic Voices training methodology (reframing, training mode, coaching).
- Session auth stored in sessionStorage (`alderos_coach_auth`).
