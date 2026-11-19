# Onboard

School bus app for Malaysia with three parties: **parents**, **bus drivers** and **bus operators**.

| Page | Who | What they do |
|---|---|---|
| `index.html` | Parents and drivers | Parents follow each trip live, report absences and report incidents (e.g. a faulty seat belt, with a photo). Drivers run each trip stop by stop and tick every child on and off. Parents and drivers talk in the **Message** tab: two group chats per driver, with photo attachments and one-tap quick messages (traffic jam, flooding, running late…): **Pickup from home** (morning route) and **Pickup from school** (afternoon route). |
| `admin.html` | Bus operators | Dashboard, live trips, incidents reported by parents (status and replies), announcements, notifications, students (enrolled with the parent's email), routes (named driver · Morning/Afternoon · school), drivers and buses. |

Both pages are **self-contained**: each one has its styles, code and logo built in, so it works on GitHub Pages, double-clicked from a folder, or opened on its own.

### Editing

Edit the source files in `src/` (`src/index.html`, `src/admin.html`, and the shared `src/assets/onboard.js` and `src/assets/onboard.css`), then rebuild the published pages:

```
python3 build.py
```

Logos and app icons are in `icons/`.

## Demo logins

On the landing page, tap **Parent demo**, **Driver demo** or **Operator demo**. Or log in with any password:

- Operator (`admin.html`): `ahmad@demo.my`
- Parent (`index.html`): `parent@demo.my`
- Driver (`index.html`): `driver@demo.my` (second driver: `kumar@demo.my`)

Open the operator portal, the parent app and the driver app in separate tabs. When the driver ticks a child on the bus, the parent and operator tabs update straight away.

## Prototype limits

All data is stored in the browser (localStorage), logins are not real and bus position comes from the driver's stop-by-stop progress, not GPS. A production version needs a backend (accounts, database), live GPS from the driver's phone, and push/WhatsApp notifications.
