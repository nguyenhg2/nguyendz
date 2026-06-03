# FlowerShop

## Chay thu cong

Yeu cau:

- .NET SDK 10
- Node.js va npm
- SQL Server local, mac dinh dung `localhost\SQLEXPRESS`

Connection string nam trong `backend/FlowerShop/FlowerShop/appsettings.json`:

```json
"DefaultConnection": "Data Source=localhost\\SQLEXPRESS;Initial Catalog=FlowerShop;Integrated Security=True;Encrypt=True;Trust Server Certificate=True"
```

Neu may dung SQL Server instance khac, sua connection string tren cho dung moi truong local.

### 1. Chay backend

```powershell
cd backend\FlowerShop\FlowerShop
dotnet restore
dotnet run
```

Backend mac dinh chay tai:

- HTTPS: https://localhost:7242
- HTTP: http://localhost:5120
- API: http://localhost:5120/api

### 2. Chay user site

Mo terminal khac:

```powershell
cd frontend\flowershop-user
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

User site: http://localhost:3000

### 3. Chay admin site

Mo terminal khac:

```powershell
cd frontend\flowershop-admin
npm install
npm run dev -- --host 0.0.0.0 --port 3001
```

Admin site: http://localhost:3001

Ca hai frontend dang mac dinh goi API tai `http://localhost:5120/api`. Neu muon doi API URL, tao file `.env.local` trong tung frontend va khai bao:

```env
VITE_API_URL=http://localhost:5120/api
```

Huong dan sua va mo rong admin cho beginner: `docs/ADMIN_BEGINNER_GUIDE.md`.
