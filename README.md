# Onboard

School bus app for Malaysia with three parties: **parents**, **bus drivers** and **bus operators**.

| Page | Who | What they do |
|---|---|---|
| `index.html` | Parents and drivers | Parents follow each trip live, report absences and report incidents (e.g. a faulty seat belt, with a photo). Drivers run each trip stop by stop and tick every child on and off. Parents and drivers talk in the **Message** tab: two group chats per driver, with photo attachments and one-tap quick messages (traffic jam, flooding, running late…): **Pickup from home** (morning route) and **Pickup from school** (afternoon route). |
| `admin.html` | Bus operators | Dashboard, live trips, **Import bus list**, incidents reported by parents (status and replies), announcements, notifications, students, routes (named driver · Morning/Afternoon · school), drivers and buses. |

Both pages are **self-contained**: each one has its styles, code and logo built in, so it works on GitHub Pages, double-clicked from a folder, or opened on its own.

### Editing

Edit the source files in `src/` (`src/index.html`, `src/admin.html`, the shared `src/assets/onboard.js` and `src/assets/onboard.css`, and the list importer `src/assets/listparser.js`), then rebuild the published pages:

```
python3 build.py
```

Logos and app icons are in `icons/`.

## Import bus list

Operators can upload the list they already use for a bus (PDF, Word .docx, Excel .xlsx or CSV) from **Students → Import bus list**. Onboard reads the heading (driver name, van number, driver contact) and each table (student name, year, student contact, address, parent contacts, remarks, pick-up time), including merged cells such as siblings sharing one address or time. The operator checks and edits everything before importing. Each table becomes a morning or afternoon route; students stay editable afterwards.

Files are read in the browser and never uploaded. Scanned or photographed lists can't be read. The reading code is `src/assets/listparser.js`; the PDF/Word/Excel libraries are in `vendor/` (see `vendor/README.md`).

Parents and drivers added this way have phone numbers but no email, so both can log in with their **mobile number**. A parent who signs up with any number on the list sees their child; Mum and Dad can both sign up.

## Demo logins

On the landing page, tap **Parent demo**, **Driver demo** or **Operator demo**. Or log in with any password:

- Operator (`admin.html`): `ahmad@demo.my`
- Parent (`index.html`): `parent@demo.my`
- Driver (`index.html`): `driver@demo.my` (second driver: `kumar@demo.my`)

Open the operator portal, the parent app and the driver app in separate tabs. When the driver ticks a child on the bus, the parent and operator tabs update straight away.

## Prototype limits

All data is stored in the browser (localStorage), logins are not real and bus position comes from the driver's stop-by-stop progress, not GPS. A production version needs a backend (accounts, database), live GPS from the driver's phone, and push/WhatsApp notifications.
