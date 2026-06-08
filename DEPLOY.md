# Deploying the Draft Board

This is a static site. You can host the project root on Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any ordinary static host.

## Account Login And Sync

Public hosting alone does not sync rankings between Chrome and Safari. To support email/password accounts and per-user rankings, configure Supabase:

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase-schema.sql`.
3. In Authentication > Providers, keep Email enabled. Decide whether you want email confirmation required.
4. In Authentication > URL Configuration:
   - Set Site URL to your deployed rankings URL.
   - Add your deployed rankings URL to Redirect URLs.
   - Add local dev URLs only when you are actively running that local server.
5. Go to Project Settings > API and copy:
   - Project URL
   - anon public key
6. Edit `sync-config.js`:

```js
window.SYNC_CONFIG = {
    provider: "supabase",
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_PUBLIC_KEY",
    boardId: "main",
    tableName: "draft_board_states",
};
```

7. Deploy the folder.

Signed-in users save their ranking order and tier rows to their own Supabase Auth account. The configured `boardId` is still used as a legacy seed: if a signed-in user has no personal rankings yet, the app can load the old shared board once and then save it to that user's account.

## Local Chrome Extension

The unpacked extension lives in `extension/`.

1. Open `chrome://extensions`.
2. Turn on Developer Mode.
3. Click Load unpacked.
4. Select the `extension/` folder.
5. Open a supported draft room on Sleeper, Underdog, Yahoo, or ESPN.

The extension adds a small Draft Board button on supported draft pages. The popup can open the rankings board and copy visible draft-room text, which can be pasted into the site's draft input for manual availability tracking.

## Refreshing ADP

Run this before deploying if you want fresh FantasyPros Underdog ADP:

```sh
python3 update_adp.py
```
