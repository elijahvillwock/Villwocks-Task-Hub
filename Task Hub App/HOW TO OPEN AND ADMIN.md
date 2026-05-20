# Villwocks Task Hub

## Start The App On This Mac

Double-click:

`Start Villwocks Task Hub.command`

If double-clicking still gives you trouble, open Terminal and paste:

```zsh
cd "/Users/mikevillwock/Documents/Codex/2026-05-12/can-you-create-me-an-app" && "/Applications/Codex.app/Contents/Resources/node" server.js
```

Keep that Terminal window open while using the app.

Then open Chrome to:

```text
http://localhost:4173
```

You can also keep this bookmark file handy:

`Open Villwocks Task Hub.webloc`

## Google Sign-In Setup

In Google Cloud, the OAuth client must be a **Web application**.

Authorized JavaScript origins:

```text
http://localhost:4173
http://127.0.0.1:4173
```

Do not use `file://.../index.html`. Google blocks that.

System admin:

```text
elijahvillwock@villwocksoutdoorliving.com
```

## Edit Users And Permissions

Sign in as Elijah, then open the **People** tab.

Admins can:

- Change a user to Team Member, Manager, or Admin.
- See each person’s active, overdue, and done task counts.
- Click **Calendar** next to a person to see that person’s task calendar.
- Invite a user from the **System Admin** panel.

Elijah’s System Admin permission is locked and cannot be changed from the app.

## Use On Your Phone

1. Start the app on the Mac.
2. Keep the Mac awake and on the same Wi-Fi as your phone.
3. In the Terminal window, look for **Phone URLs on the same Wi-Fi**.
4. Open that URL on your phone for basic network testing. It will look like:

```text
http://192.168.x.x:4173
```

Google Cloud will not accept a raw Wi-Fi IP address under **Authorized domains** because that section requires a real domain such as `.com` or `.org`.

For reliable phone sign-in, host the app on a real company domain or subdomain, for example:

```text
https://tasks.villwocksoutdoorliving.com
```

Then add this in Google Cloud:

- Authorized domain: `villwocksoutdoorliving.com`
- Authorized JavaScript origin: `https://tasks.villwocksoutdoorliving.com`

This local setup stores data in each browser. A shared cloud database is the next step if you want all users’ phones and computers to share live task data.
