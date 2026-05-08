# Openclaw Job Dashboard

輕量且具備高擴展性的「Openclaw 任務排程與監控 Dashboard」，實作了動態新增 Prompt 任務的功能，並且包含一個 Node.js 背景 Worker 不斷向後端 API 提取任務並將進度與日誌即時回報給前端顯示。

## 🚀 Tech Stack 架構
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS (運用 Glassmorphism 毛玻璃與深色科技感設計)
- **Database**: SQLite (透過 Prisma ORM v5)
- **State & Fetching**: SWR (實作 5 秒定期 Polling 自動更新畫面)
- **Security & Route Guard**: Next.js 16 `proxy.ts` (阻擋未授權存取) + `jose` (JWT)
- **Task Worker**: Node.js `child_process.spawn` + 獨立輪詢腳本 (`worker/index.js`)
- **Process Management**: `concurrently` (開發環境) / PM2 (生產環境)

## 🔒 驗證機制 (Security)
本系統主要依賴環境變數 (`.env`) 的金鑰進行認證，無須建立額外的 User 表：
1. **Web Dashboard 介面 (`/login`)**: 透過比對 `.env` 中的 `ADMIN_PASSWORD` 登入。成功後由 `jose` 簽發 HTTP-Only JWT Cookie (`openclaw_session`)。`proxy.ts` 會攔截並保護所有除了 `/login` 和 Worker API 之外的路由。
2. **Worker API (`/api/worker/*`)**: 此 API 提供給 Node.js 背景程式使用，不需要 Cookie。而是透過 Request Header 傳送 `Authorization: Bearer <WORKER_SECRET>`，經由 `proxy.ts` 驗證。

---

## 💻 啟動教學 (Getting Started)

### 1. 環境設定
複製 `.env.example` 並建立 `.env` 檔案，確保內容設定正確：

```env
# Database 位址
DATABASE_URL="file:./dev.db"

# Web 管理員介面的登入密碼
ADMIN_PASSWORD="admin"

# 用來加密及簽發 JWT Session 的金鑰
JWT_SECRET="local_dev_secret_so_not_so_secret_123"

# 給 Node.js Worker 呼叫 API 用的安全金鑰
WORKER_SECRET="super_secret_worker_token"
```

### 2. 安裝套件與資料庫初始化
在專案根目錄下依序執行以下指令：

```bash
# 安裝所有必要依賴
npm install

# 初始化並推播 Prisma Schema 到 SQLite DB
npx prisma db push

# 產生 Prisma Client
npx prisma generate
```

### 3. 一鍵啟動 (開發環境)
專案內建 `concurrently` 可以一次同時啟動 Next.js Web 伺服器與 Node.js Worker。

```bash
npm run dev
```

成功啟動後，你可以前往 `http://localhost:3000` 登入並測試。
- 同時 Node.js Worker (`worker/index.js`) 也會在背景開始每 60 秒輪詢 (`Polling`) 最新任務。
- 新增任務後，Worker 會立即啟動 `openclaw` 並每 5 秒回傳一次 stdout 日誌顯示於前端 Terminal UI。

### 4. 拆分啟動 (生產/自訂環境)
如果你想要分開啟動系統與 Worker：

啟動 Dashboard 網站：
```bash
npm run dev:web
# 或執行 npm run build & npm start
```

啟用後端自動排程 Worker：
```bash
npm run dev:worker
```

使用 PM2 在背景架設：
```bash
pm2 start ecosystem.config.js
pm2 save
```
