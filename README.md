# Onboard

School bus app for Malaysia with three parties: **parents**, **bus drivers** and **bus operators**.

| Page | Who | What they do |
|---|---|---|
| `index.html` | Parents and drivers | Parents track the bus live, report absences, find an operator and pay fees. Drivers run each trip stop by stop and tick every child on and off. |
| `admin.html` | Bus operators | Dashboard, live trips, students and seat requests, routes, drivers, buses, billing and announcements. |

Shared code lives in `assets/` (`onboard.js` for data and logic, `onboard.css` for styles). Logos and app icons are in `icons/`.

## Demo logins

Any password works.

- Operator (`admin.html`): `ahmad@demo.my`
- Parent (`index.html`): `parent@demo.my`
- Driver (`index.html`): `driver@demo.my` (second driver: `kumar@demo.my`)

Open the operator portal, the parent app and the driver app in separate tabs. When the driver ticks a child on the bus, the parent and operator tabs update straight away.

## Prototype limits

All data is stored in the browser (localStorage), logins are not real, payments are simulated and bus position comes from the driver's stop-by-stop progress, not GPS. A production version needs a backend (accounts, database), live GPS from the driver's phone, push/WhatsApp notifications and a payment gateway.
