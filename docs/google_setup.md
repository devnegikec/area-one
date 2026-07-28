Here's a step-by-step guide to get your Gmail API credentials:

---

### Step 1: Create a Google Cloud Project

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**
2. In the top navigation bar, click the project dropdown → **New Project**
3. Name it `Area-One` (or anything), click **Create**
4. Wait a few seconds for the project to be created, then select it from the dropdown

### Step 2: Enable the Gmail API

1. From the left sidebar, go to **APIs & Services** → **Library**
2. Search for **Gmail API**
3. Click **Gmail API** → **Enable**
4. Wait for it to activate

### Step 3: Configure the OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you're on a Google Workspace domain)
3. Fill in:
   - **App name:** `Area-One`
   - **User support email:** your email
   - **Developer contact:** your email
4. Click **Save and Continue**
5. On the **Scopes** screen, click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
6. Click **Save and Continue**
7. On the **Test users** screen, add your own email, click **Save and Continue**

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Set:
   - **Name:** `Area-One Local Dev`
   - **Authorized redirect URIs** → Add:
     ```
     http://localhost:3000/api/integrations/gmail/callback
     ```
5. Click **Create**
6. You'll see a popup with your **Client ID** and **Client Secret** — copy both


### Step 5: Add to Area-One

Add these to `/Users/devnegi/Documents/www/area-one/.env.local`:

```
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-here
```

Then restart the dev server (`npm run dev`), go to `/dashboard/settings`, and click **Connect Gmail**.

---

### Important Notes

- **Testing mode:** Your app will be in "Testing" mode, meaning only test users you added in Step 3 can connect. This is fine for development.
- **Production:** When you're ready to go public, you'll need to submit your app for Google verification (can take weeks). Until then, limit is 100 test users.
- **Redirect URIs for production:** When you deploy, add your production URL as another authorized redirect URI (e.g., `https://app.area-one.com/api/integrations/gmail/callback`).Then restart the dev server (`npm run dev`), go to `/dashboard/settings`, and click **Connect Gmail**.

---

### Important Notes

- **Testing mode:** Your app will be in "Testing" mode, meaning only test users you added in Step 3 can connect. This is fine for development.
- **Production:** When you're ready to go public, you'll need to submit your app for Google verification (can take weeks). Until then, limit is 100 test users.
- **Redirect URIs for production:** When you deploy, add your production URL as another authorized redirect URI (e.g., `https://app.area-one.com/api/integrations/gmail/callback`).
