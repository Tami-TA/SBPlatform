# Hosting the Bible Database as a GitHub Release Asset

The SQLite Bible database (~1.5 GB) is **not stored in this repository**.
It is hosted as a GitHub Release asset and downloaded by the app at runtime.

---

## Step-by-step: Upload the DB file to a GitHub Release

### 1. Go to the Releases page

In your GitHub repository, click the **Releases** link in the right sidebar,
or navigate to:

```
https://github.com/<your-username>/<your-repo>/releases
```

---

### 2. Draft a new release

Click **"Draft a new release"** (or **"Create a new release"**).

---

### 3. Create a tag

In the **"Choose a tag"** dropdown, type a new tag name and click
**"Create new tag: ... on publish"**. Recommended tag:

```
bible-db-v1
```

Use `bible-db-v2`, `bible-db-v3`, etc. for future updates.

---

### 4. Fill in release details

| Field | Suggested value |
|---|---|
| Release title | `Bible Database v1` |
| Description | `Initial SQLite Bible database release` |

---

### 5. Upload the `.db` file as a release asset

In the **"Attach binaries by dropping them here or selecting them"** area:

- Click to browse, or drag-and-drop your `bible.db` file.
- Wait for the upload to complete (may take several minutes for 1.5 GB).

---

### 6. Publish the release

Once the file finishes uploading, click **"Publish release"**.

---

### 7. Copy the download URL

After publishing, find your file in the Assets list and copy the download URL.
It will look like:

```
https://github.com/<your-username>/<your-repo>/releases/download/bible-db-v1/bible.db
```

---

## Step-by-step: Wire the URL into the app

### 1. Set the environment variable

In your `.env.local` (local dev) or your hosting provider's environment settings
(Vercel, Railway, etc.), set:

```env
BIBLE_DB_URL=https://github.com/<your-username>/<your-repo>/releases/download/bible-db-v1/bible.db
```

### 2. Trigger the DB download

Call the status/download API to check and fetch the database:

```
GET /api/bible-db-status
```

The app will automatically download `bible.db` to `server/data/bible.db` if it
is not already present and `BIBLE_DB_URL` is set.

---

## Notes

- The `.db` file is listed in `.gitignore` — it will never be accidentally committed.
- If `BIBLE_DB_URL` is not set, the app falls back to built-in sample data.
- To update the database, upload a new file to a new release tag and update the
  `BIBLE_DB_URL` environment variable.
