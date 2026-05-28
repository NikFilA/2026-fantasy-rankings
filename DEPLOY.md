# Deploying the Draft Board

This is a static site. You can host the project root on Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any ordinary static host.

## Cross-Browser Sync

Public hosting alone does not sync rankings between Chrome and Safari. To sync rankings, configure Supabase:

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase-schema.sql`.
3. Go to Project Settings > API and copy:
   - Project URL
   - anon public key
4. Edit `sync-config.js`:

```js
window.SYNC_CONFIG = {
    provider: "supabase",
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_PUBLIC_KEY",
    boardId: "main",
    tableName: "draft_board_states",
};
```

5. Deploy the folder.

Every browser using the same hosted URL and `boardId` will share the same ranking order and tier rows.

## Refreshing ADP

Run this before deploying if you want fresh FantasyPros Underdog ADP:

```sh
python3 update_adp.py
```
