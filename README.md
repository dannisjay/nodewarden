# NodeWarden
中文文档：[`README_ZH.md`](./README_ZH.md)

A **Bitwarden-compatible** server that runs on **Cloudflare Workers**, designed for personal use.

- Simple deploy (no VPS)
- Focused feature set
- Low maintenance


> Disclaimer
> - This project is **not affiliated** with Bitwarden.
> - Use at your own risk. Keep regular backups of your vault.

---

## Features

- ✅ **Free to use. No server to manage.**
- ✅ Full support for logins, notes, cards, and identities
- ✅ Folders and favorites
- ✅ Attachments (Cloudflare R2)
- ✅ Import / export
- ✅ Website icons
- ✅ End-to-end encryption (the server can’t see plaintext)
- ✅ Compatible with common Bitwarden official clients

## Tested clients / platforms

- ✅ Windows desktop client
- ✅ Mobile app (Android / iOS)
- ✅ Browser extension
- ⬜ macOS desktop client (not tested)
- ⬜ Linux desktop client (not tested)

---

# Quick start

### One-click deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shuaiplus/nodewarden)

**Deploy steps:**

1. Sign in with GitHub and authorize
2. Sign in to Cloudflare
3. **Important**: set `JWT_SECRET` to a strong random string (recommended: `openssl rand -hex 32`)
4. KV namespace and R2 bucket will be created automatically
5. Click **Deploy** and wait for it to finish
6. After deploy, open the Cloudflare-provided Workers URL (your service URL), and register on the web page

> ⚠️ **Reminder**: always use a strong random `JWT_SECRET`. Weak secrets may put your account at risk.

### Configure your client

In any Bitwarden client:

1. Open **Settings**
2. Choose **Self-hosted environment**
3. Set **Server URL** to your Worker URL (for example: `https://your-project.your-subdomain.workers.dev`)
4. Save, then go back to the login screen

## 🧑‍💻 Local development

This repo is a Cloudflare Workers TypeScript project (Wrangler).

```bash
npm install
npm run dev
```

---

## Tech stack

- **Runtime**: Cloudflare Workers
- **Data storage**: Cloudflare KV
- **File storage**: Cloudflare R2
- **Language**: TypeScript
- **Crypto**: Client-side AES-256-CBC, JWT uses HS256

---

## FAQ

**Q: How do I back up my data?**  
A: Use **Export vault** in your client and save the JSON file.

**Q: What if I forget the master password?**  
A: It can’t be recovered (end-to-end encryption). Keep it safe.

**Q: Can multiple people use it?**  
A: Not recommended. This project is designed for single-user usage.

---

## License

LGPL-3.0 License

---

## Credits

- [Bitwarden](https://bitwarden.com/) - original design and clients
- [Vaultwarden](https://github.com/dani-garcia/vaultwarden) - server implementation reference
- [Cloudflare Workers](https://workers.cloudflare.com/) - serverless platform
