# Deploy to Vercel

## Option A — GitHub + Vercel (recommended)

1. Create a new GitHub repository, for example `phong-portfolio`.
2. From this folder:

```bash
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/phong-portfolio.git
git push -u origin build/static-portfolio
```

3. On Vercel, choose **Add New → Project** and import that GitHub repository.
4. Framework preset: choose **Other** if Vercel does not automatically treat it as static.
5. Leave the build command empty.
6. Leave the output directory empty / root.
7. Deploy.

The repository is already static and includes `vercel.json`.

## Option B — Vercel CLI

If you already use the Vercel CLI:

```bash
vercel
```

Follow the prompts and deploy the current directory. No build command is needed.

## Connect your custom domain

After the Vercel deployment exists:

1. Open the Vercel project.
2. Go to **Settings → Domains**.
3. Add your domain, e.g. `phongcao.dev`.
4. Vercel will show the DNS records required for your registrar/DNS provider.
5. Add those exact records at your domain provider.
6. Wait for Vercel to verify the domain and issue HTTPS automatically.

If you want both `phongcao.dev` and `www.phongcao.dev`, add both and configure one to redirect to the other.

## Before publishing

Edit `js/content.js` and fill in:

- GitHub URL
- Resume URL
- email (`mailto:` URL)
- public project/demo links

The current LinkedIn URL is already configured.

## Updating later

The site has no CMS or framework. Most content changes happen in `js/content.js`.

Typical update flow:

```bash
git add .
git commit -m "update portfolio"
git push
```

Vercel will redeploy automatically if the GitHub project is connected.
