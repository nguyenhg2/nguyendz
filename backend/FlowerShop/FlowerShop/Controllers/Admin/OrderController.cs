using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
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
            var q = _context.Orders.Include(o => o.User).AsQueryable();

            if (!string.IsNullOrEmpty(f.Status))
                q = q.Where(o => o.Status == f.Status);
            if (!string.IsNullOrEmpty(f.Search))
                q = q.Where(o => o.ReceiverName.Contains(f.Search) || o.ReceiverPhone.Contains(f.Search));
            if (f.FromDate.HasValue)
                q = q.Where(o => o.OrderDate >= f.FromDate);
            if (f.ToDate.HasValue)
                q = q.Where(o => o.OrderDate <= f.ToDate);
            if (!string.IsNullOrEmpty(f.PaymentMethod))
                q = q.Where(o => o.PaymentMethod == f.PaymentMethod);

            var total = await q.CountAsync();
            var items = await q.OrderByDescending(o => o.OrderDate)
                .Skip((f.Page - 1) * f.Limit).Take(f.Limit).ToListAsync();

            return Ok(new { total, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails).ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(o => o.OrderId == id);
            if (order == null) return NotFound();
            return Ok(order);
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

            order.Status = "Da huy";
            order.Note = string.IsNullOrEmpty(order.Note)
                ? "Ly do huy: " + data.Reason
                : order.Note + " | Ly do huy: " + data.Reason;

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
    }

    public class OrderSearchParams
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public string? Status { get; set; }
        public string? Search { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? PaymentMethod { get; set; }
    }

    public class StatusUpdateDto { public string Status { get; set; } = ""; }
    public class CancelRequestDto { public string Reason { get; set; } = ""; }
}
