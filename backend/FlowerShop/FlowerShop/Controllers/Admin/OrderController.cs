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
        public async Task<IActionResult> GetAll([FromQuery] OrderSearchParams filter)
        {
            var query = _context.Orders
                .Include(o => o.User) 
                .AsQueryable();

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(o => o.Status == filter.Status);

            if (!string.IsNullOrEmpty(filter.Search))
                query = query.Where(o => o.ReceiverName.Contains(filter.Search) || o.ReceiverPhone.Contains(filter.Search));

            if (filter.FromDate.HasValue)
                query = query.Where(o => o.OrderDate >= filter.FromDate);
            if (filter.ToDate.HasValue)
                query = query.Where(o => o.OrderDate <= filter.ToDate);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((filter.Page - 1) * filter.Limit)
                .Take(filter.Limit)
                .ToListAsync();

            return Ok(new { total, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails) 
                    .ThenInclude(od => od.Product) 
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng" });
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
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            order.Status = "Đã hủy"; 
            order.Note = string.IsNullOrEmpty(order.Note)
                ? $"Lý do hủy: {data.Reason}"
                : $"{order.Note} | Lý do hủy: {data.Reason}"; 

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Đã hủy đơn hàng" });
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
    }

    public class StatusUpdateDto
    {
        public string Status { get; set; }
    }

    public class CancelRequestDto
    {
        public string Reason { get; set; }
    }
}