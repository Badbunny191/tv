# 🔴 Digital TV Live - Setup Guide

## การตั้งค่า CI/CD สำหรับ Auto Deploy

### 1. สร้าง Cloudflare API Token

1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. กด **"Create Token"**
3. เลือก **"Edit Cloudflare Workers"** template
4. ตั้งค่า Account Resources = Your account
5. ตั้งค่า Zone Resources = All zones (หรือเลือกเฉพาะ domain ที่ต้องการ)
6. กด **"Create Token"**
7. คัดลอก Token ที่ได้

### 2. สร้าง GitHub Secrets

1. ไปที่ Repository Settings → Secrets and variables → Actions
2. กด **"New repository secret"** เพิ่มแต่ละ secret:

| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token ที่สร้างในขั้นตอน 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID จาก Cloudflare Dashboard (มุมขวาล่าง) |

### 3. สร้าง Cloudflare Pages Project

1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
2. กด **"Create a project"**
3. เลือก **"Direct upload"** (ไม่ต้องเชื่อม Git provider)
4. ตั้งชื่อ project: `tv-app`
5. Build command: เว้นว่าง (ไม่ต้อง build)
6. Build output directory: `/public`
7. กด **"Save and Deploy"**

### 4. ทดสอบ Deploy

```bash
# Commit และ push code
git add .
git commit -m "Add CI/CD setup"
git push origin main
```

---

## การใช้งาน Command Line

### Deploy Worker (ทดสอบ locally)

```bash
# ติดตั้ง Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler deploy
```

### Preview Worker

```bash
wrangler dev
```

---

## สถาปัตยกรรมการ Deploy

```
Git Push
    │
    ▼
┌─────────────────┐
│  GitHub Actions │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│Workers │ │ Pages    │
│Proxy   │ │ Frontend │
└────────┘ └──────────┘
```

---

## การ Custom Domain (ถ้าต้องการ)

### Cloudflare Pages
1. ไปที่ Pages Project → Settings → Custom Domains
2. เพิ่ม domain (เช่น `tv.yoursite.com`)
3. ตั้งค่า DNS ใน Cloudflare

### Cloudflare Worker
```toml
# แก้ไข wrangler.toml
name = "tv-proxy"
main = "functions/proxy.js"

routes = [
  { pattern = "proxy.yoursite.com", zone_name = "yoursite.com" }
]
```
