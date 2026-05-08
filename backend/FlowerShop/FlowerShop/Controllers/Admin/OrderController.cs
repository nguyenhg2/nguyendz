using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using FlowerShop.Common;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/orders")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class OrderController : ControllerBase
    {
        private readonly FlowerContext _context;

        public OrderController(FlowerContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] OrderSearchParams f)
        {
            var paging = PagingHelper.Normalize(f.Page, f.Limit);
            var q = _context.Orders.AsNoTracking().Include(o => o.User).AsQueryable();

            if (!string.IsNullOrEmpty(f.Status))
                q = q.Where(o => o.Status == f.Status);
            if (!string.IsNullOrEmpty(f.Search))
                q = q.Where(o =>
                    (o.ReceiverName ?? "").Contains(f.Search)
                    || (o.ReceiverPhone ?? "").Contains(f.Search));
            if (f.FromDate.HasValue)
                q = q.Where(o => o.OrderDate >= f.FromDate);
            if (f.ToDate.HasValue)
                q = q.Where(o => o.OrderDate <= f.ToDate);
            if (!string.IsNullOrEmpty(f.PaymentMethod))
            {
                var payment = NormalizePaymentMethod(f.PaymentMethod);
                if (payment == "banktransfer")
                {
                    q = q.Where(o =>
                        o.PaymentMethod != null &&
                        (o.PaymentMethod == "BankTransfer"
                         || o.PaymentMethod == "bank"
                         || o.PaymentMethod == "banktransfer"
                         || o.PaymentMethod.Contains("Chuyển")
                         || o.PaymentMethod.Contains("chuyển")
                         || o.PaymentMethod.Contains("khoản")
                         || o.PaymentMethod.Contains("khoan")));
                }
                else if (payment == "cod")
                {
                    q = q.Where(o => o.PaymentMethod != null && o.PaymentMethod.ToLower() == "cod");
                }
                else
                {
                    q = q.Where(o => o.PaymentMethod == f.PaymentMethod);
                }
            }

            var total = await q.CountAsync();
            var totalPages = (int)Math.Ceiling((double)total / paging.Limit);
            var items = await q.OrderByDescending(o => o.OrderDate)
                .Skip((paging.Page - 1) * paging.Limit)
                .Take(paging.Limit)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalAmount,
                    TotalPrice = o.TotalAmount,
                    Total = o.TotalAmount,
                    o.Status,
                    CustomerName = o.User != null ? o.User.FullName : null,
                    UserName = o.User != null ? o.User.FullName : null,
                    o.ReceiverName,
                    o.ReceiverPhone,
                    o.ReceiverAddress,
                    ShippingAddress = o.ReceiverAddress,
                    Address = o.ReceiverAddress,
                    o.PaymentMethod,
                    o.Note
                })
                .ToListAsync();

            return Ok(new { total, totalItems = total, totalPages, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.User)
                .Include(o => o.OrderDetails).ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(o => o.OrderId == id);
            if (order == null) return NotFound();
            return Ok(new
            {
                order.OrderId,
                order.OrderDate,
                order.TotalAmount,
                TotalPrice = order.TotalAmount,
                Total = order.TotalAmount,
                order.Status,
                CustomerName = order.User?.FullName,
                UserName = order.User?.FullName,
                order.ReceiverName,
                order.ReceiverPhone,
                order.ReceiverAddress,
                ShippingAddress = order.ReceiverAddress,
                Address = order.ReceiverAddress,
                order.PaymentMethod,
                order.Note,
                OrderDetails = order.OrderDetails.Select(od => new
                {
                    od.OrderDetailId,
                    od.ProductId,
                    ProductName = od.Product?.ProductName,
                    ImageUrl = od.Product?.ImageUrl,
                    od.Quantity,
                    Price = od.UnitPrice,
                    od.UnitPrice,
                    od.Subtotal
                })
            });
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateDto data)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();
            order.Status = data.Status;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, status = order.Status });
        }

        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id, [FromBody] CancelRequestDto data)
        {
            var order = await _context.Orders.Include(o => o.OrderDetails).FirstOrDefaultAsync(o => o.OrderId == id);
            if (order == null) return NotFound();

            order.Status = "Đã hủy";
            order.Note = string.IsNullOrEmpty(order.Note)
                ? "Lý do hủy: " + data.Reason
                : order.Note + " | Lý do hủy: " + data.Reason;

            foreach (var detail in order.OrderDetails)
            {
                var product = await _context.Products.FindAsync(detail.ProductId);
                if (product != null)
                {
                    product.StockQuantity = (product.StockQuantity ?? 0) + detail.Quantity;
                    product.SoldQuantity = (product.SoldQuantity ?? 0) - detail.Quantity;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        private static string NormalizePaymentMethod(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return "";

            var normalized = value.Trim().ToLowerInvariant()
                .Replace(" ", "")
                .Replace("_", "")
                .Replace("-", "");

            if (normalized == "cod" || normalized.Contains("cash")) return "cod";
            if (normalized == "bank" || normalized == "banktransfer" || normalized.Contains("chuyen") || normalized.Contains("chuyển") || normalized.Contains("khoan") || normalized.Contains("khoản"))
                return "banktransfer";

            return normalized;
        }
    }

    public class OrderSearchParams
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public int PageSize
        {
            get => Limit;
            set => Limit = value;
        }
        public string? Status { get; set; }
        public string? Search { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? DateFrom
        {
            get => FromDate;
            set => FromDate = value;
        }
        public DateTime? ToDate { get; set; }
        public DateTime? DateTo
        {
            get => ToDate;
            set => ToDate = value;
        }
        public string? PaymentMethod { get; set; }
    }

    public class StatusUpdateDto { public string Status { get; set; } = ""; }
    public class CancelRequestDto { public string Reason { get; set; } = ""; }
}
