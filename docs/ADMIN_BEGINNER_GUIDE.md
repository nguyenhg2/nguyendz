# Admin beginner guide

Tai lieu nay mo ta nhanh luong admin de nguoi moi de sua va mo rong.

## Frontend admin

Thu muc chinh: `frontend/flowershop-admin/src`

- `pages/`: moi file la mot man hinh lon nhu `ProductsPage.jsx`, `OrdersPage.jsx`.
- `components/`: component dung lai nhieu noi, vi du `Pagination`, `ConfirmModal`, `Sidebar`.
- `services/api.js`: gom tat ca API admin. Khi backend co endpoint moi, them ham goi API tai day.
- `utils/format.js`: format tien, ngay, va chuyen duong dan anh `/uploads/...` thanh URL day du.

### Them mot trang admin moi

1. Tao file moi trong `src/pages`, vi du `CouponsPage.jsx`.
2. Them API vao `src/services/api.js`, vi du:

   ```js
   export const couponAPI = {
     getAll: (params) => api.get('/admin/coupons', { params }),
     create: (data) => api.post('/admin/coupons', data),
   };
   ```

3. Them page vao `PAGE_MAP` trong `src/App.jsx`.
4. Them menu vao `src/constants/navigation.js`.
5. Neu la trang danh sach, tao ham `load()` trong page: set `loading`, goi API, doc `{ total, items }`, roi render `Pagination`.

## Backend admin

Thu muc chinh: `backend/FlowerShop/FlowerShop`

- `Controllers/Admin/`: cac API quan tri, moi controller quan ly mot nhom du lieu.
- `Data/`: cac model Entity Framework map voi bang SQL Server.
- `Common/PagingHelper.cs`: chuan hoa `page` va `limit`.
- `Common/UploadHelper.cs`: luu va xoa anh local trong `wwwroot/uploads`.

### Them mot endpoint admin moi

1. Tao controller trong `Controllers/Admin`.
2. Dat route theo mau:

   ```csharp
   [Route("api/admin/coupons")]
   [ApiController]
   [Authorize(Roles = "Admin")]
   public class CouponController : ControllerBase
   {
   }
   ```

3. Dung `PagingHelper.Normalize(page, limit)` cho API danh sach.
4. Tra ve danh sach theo mau `{ total, items }` de frontend doc bang `readPagedResponse`.
5. Neu upload anh, dung:

   ```csharp
   var imageUrl = await UploadHelper.SaveImageAsync(_env, file, "products");
   ```

## Nguyen tac de code de hoc

- Moi page chi nen quan ly mot nghiep vu.
- Logic goi API nam trong `services/api.js`, khong viet URL truc tiep trong page.
- Logic lap lai dua vao `components`, `hooks`, hoac `Common`.
- Backend nen validate dau vao ro rang va tra `{ message = "..." }` khi loi.
- Anh public luu trong `wwwroot/uploads/...`, database chi luu URL bat dau bang `/uploads/...`.
