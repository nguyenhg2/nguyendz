using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;

using FlowerShop.Common;

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
            var query = _context.Orders
                .AsNoTracking()
                .Where(o => OrderStatus.CompletedValues.Contains(o.Status) && o.OrderDate.HasValue && o.OrderDate.Value.Year == year);

            if (month.HasValue)
            {
                query = query.Where(o => o.OrderDate!.Value.Month == month.Value);

                var dailyDataRaw = await query
                    .GroupBy(o => o.OrderDate!.Value.Day)
                    .Select(g => new {
                        Day = g.Key,
                        Revenue = g.Sum(o => o.TotalAmount ?? 0),
                        Orders = g.Count()
                    })
                    .OrderBy(x => x.Day)
                    .ToListAsync();
                var dailyData = dailyDataRaw.Select(x => new {
                    day = x.Day,
                    revenue = x.Revenue,
                    orders = x.Orders
                });

                return Ok(dailyData);
            }
            else
            {
                var monthlyDataRaw = await query
                    .GroupBy(o => o.OrderDate!.Value.Month)
                    .Select(g => new {
                        Month = g.Key,
                        Revenue = g.Sum(o => o.TotalAmount ?? 0),
                        Orders = g.Count()
                    })
                    .OrderBy(x => x.Month)
                    .ToListAsync();
                var monthlyData = monthlyDataRaw.Select(x => new {
                    month = x.Month,
                    revenue = x.Revenue,
                    orders = x.Orders
                });

                return Ok(monthlyData);
            }
        }

        [HttpGet("top-products")]
        public async Task<IActionResult> GetTopProductsReport([FromQuery] int limit = 10)
        {
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            var topProducts = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .OrderByDescending(p => p.SoldQuantity)
                .Take(limit)
                .Select(p => new {
                    productId = p.ProductId,
                    productName = p.ProductName,
                    categoryName = p.Category != null ? p.Category.CategoryName : "",
                    imageUrl = p.ImageUrl,
                    soldQuantity = p.SoldQuantity,
                    totalRevenue = _context.OrderDetails
                        .Where(od => od.ProductId == p.ProductId && od.Order != null && OrderStatus.CompletedValues.Contains(od.Order.Status))
                        .Sum(od => od.Subtotal ?? 0)
                })
                .ToListAsync();

            return Ok(topProducts);
        }

        [HttpGet("order-stats")]
        public async Task<IActionResult> GetOrderStats()
        {
            var stats = await _context.Orders
                .AsNoTracking()
                .GroupBy(o => o.Status)
                .Select(g => new {
                    status = g.Key ?? "Khác",
                    count = g.Count()
                })
                .ToListAsync();

            return Ok(new
            {
                pending = stats.Where(x => OrderStatus.Normalize(x.status) == OrderStatus.Pending).Sum(x => x.count),
                confirmed = stats.Where(x => OrderStatus.Normalize(x.status) == OrderStatus.Confirmed).Sum(x => x.count),
                shipping = stats.Where(x => OrderStatus.Normalize(x.status) == OrderStatus.Shipping).Sum(x => x.count),
                done = stats.Where(x => OrderStatus.Normalize(x.status) == OrderStatus.Completed).Sum(x => x.count),
                cancelled = stats.Where(x => OrderStatus.Normalize(x.status) == OrderStatus.Cancelled).Sum(x => x.count)
            });
        }
    }
}
