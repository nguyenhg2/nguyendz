using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/reports")] 
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class ReportController : ControllerBase
    {
        private readonly FlowerContext _context;

        public ReportController(FlowerContext context)
        {
            _context = context;
        }

        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenueReport([FromQuery] int year, [FromQuery] int? month)
        {
            if (year < 1) year = DateTime.Today.Year;

            var query = _context.Orders
                .AsNoTracking()
                .Where(o => o.Status == AdminOrderStatus.Completed && o.OrderDate.HasValue && o.OrderDate.Value.Year == year);

            if (month.HasValue)
            {
                if (month.Value < 1 || month.Value > 12)
                    return BadRequest(new { message = "Tháng không hợp lệ" });

                query = query.Where(o => o.OrderDate!.Value.Month == month.Value);

                var dailyData = await query
                    .GroupBy(o => o.OrderDate!.Value.Day)
                    .Select(g => new {
                        day = g.Key,
                        month = month.Value,
                        year,
                        label = $"Ngày {g.Key}",
                        revenue = g.Sum(o => o.TotalAmount ?? 0),
                        orders = g.Count(),
                        value = g.Sum(o => o.TotalAmount ?? 0)
                    })
                    .OrderBy(x => x.day)
                    .ToListAsync();

                return Ok(dailyData);
            }

            var monthlyData = await query
                .GroupBy(o => o.OrderDate!.Value.Month)
                .Select(g => new {
                    month = g.Key,
                    label = $"Tháng {g.Key}",
                    revenue = g.Sum(o => o.TotalAmount ?? 0),
                    orders = g.Count(),
                    value = g.Sum(o => o.TotalAmount ?? 0)
                })
                .OrderBy(x => x.month)
                .ToListAsync();

            return Ok(monthlyData);
        }

        [HttpGet("top-products")]
        public async Task<IActionResult> GetTopProductsReport([FromQuery] int limit = 10)
        {
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            var completedRevenue = _context.OrderDetails
                .AsNoTracking()
                .Where(od => od.ProductId.HasValue
                    && od.Order != null
                    && od.Order.Status == AdminOrderStatus.Completed)
                .GroupBy(od => od.ProductId!.Value)
                .Select(g => new
                {
                    ProductId = g.Key,
                    Revenue = g.Sum(od => od.Subtotal ?? 0)
                });

            var topProducts = await _context.Products
                .AsNoTracking()
                .GroupJoin(
                    completedRevenue,
                    product => product.ProductId,
                    revenue => revenue.ProductId,
                    (product, revenue) => new { product, revenue })
                .OrderByDescending(x => x.product.SoldQuantity)
                .Take(limit)
                .Select(x => new {
                    productId = x.product.ProductId,
                    productName = x.product.ProductName,
                    imageUrl = x.product.ImageUrl,
                    categoryName = x.product.Category != null ? x.product.Category.CategoryName : "",
                    soldQuantity = x.product.SoldQuantity ?? 0,
                    totalRevenue = x.revenue.Select(r => r.Revenue).FirstOrDefault(),
                    name = x.product.ProductName,
                    sold = x.product.SoldQuantity ?? 0,
                    revenue = x.revenue.Select(r => r.Revenue).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(topProducts);
        }

        [HttpGet("order-stats")]
        public async Task<IActionResult> GetOrderStats()
        {
            var rawStats = await _context.Orders
                .AsNoTracking()
                .GroupBy(o => o.Status)
                .Select(g => new {
                    status = g.Key,
                    count = g.Count()
                })
                .ToListAsync();

            var normalizedStats = rawStats
                .Select(x => new { status = AdminOrderStatus.Normalize(x.status), x.count })
                .ToList();

            int CountStatus(string status) => normalizedStats
                .Where(x => x.status == status)
                .Sum(x => x.count);

            var stats = new
            {
                pending = CountStatus(AdminOrderStatus.Pending),
                confirmed = CountStatus(AdminOrderStatus.Confirmed),
                shipping = CountStatus(AdminOrderStatus.Shipping),
                done = CountStatus(AdminOrderStatus.Completed),
                cancelled = CountStatus(AdminOrderStatus.Cancelled),
                other = normalizedStats
                    .Where(x => !AdminOrderStatus.IsValid(x.status))
                    .Sum(x => x.count),
                total = normalizedStats.Sum(x => x.count)
            };

            return Ok(stats);
        }
    }
}
