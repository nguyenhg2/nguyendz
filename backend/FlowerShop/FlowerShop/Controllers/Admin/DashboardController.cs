using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/dashboard")]
    [ApiController]
    [Authorize(Roles = "Admin")] 
    public class DashboardController : ControllerBase
    {
        private readonly FlowerContext _context;

        public DashboardController(FlowerContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.Today;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            var totalOrders = await _context.Orders.CountAsync();
            var todayOrders = await _context.Orders.CountAsync(o => o.OrderDate >= today);
            var totalProducts = await _context.Products.CountAsync();
            var totalCustomers = await _context.Users.CountAsync(u => u.Role == "Customer");

            var todayRevenue = await _context.Orders
                .Where(o => o.Status == AdminOrderStatus.Completed && o.OrderDate >= today)
                .SumAsync(o => o.TotalAmount ?? 0);

            var monthRevenue = await _context.Orders
                .Where(o => o.Status == AdminOrderStatus.Completed && o.OrderDate >= startOfMonth)
                .SumAsync(o => o.TotalAmount ?? 0);

            return Ok(new
            {
                totalOrders,
                todayOrders,
                monthRevenue,
                todayRevenue,
                totalProducts,
                totalCustomers
            });
        }

        [HttpGet("recent-orders")]
        public async Task<IActionResult> GetRecentOrders()
        {
            var orders = await _context.Orders
                .AsNoTracking()
                .OrderByDescending(o => o.OrderDate)
                .Take(10)
                .Select(o => new {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalAmount,
                    o.Status,
                    o.ReceiverName,
                    o.ReceiverPhone,
                    o.ReceiverAddress,
                    o.PaymentMethod
                })
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("revenue-chart")]
        public async Task<IActionResult> GetRevenueChart()
        {
            var months = Enumerable.Range(0, 6)
                .Select(i => DateTime.Today.AddMonths(-i))
                .Select(d => new { d.Year, d.Month })
                .Reverse()
                .ToList();
            var startMonth = new DateTime(months[0].Year, months[0].Month, 1);

            var revenueByMonth = await _context.Orders
                .AsNoTracking()
                .Where(o => o.Status == AdminOrderStatus.Completed
                            && o.OrderDate.HasValue
                            && o.OrderDate.Value >= startMonth)
                .GroupBy(o => new { o.OrderDate!.Value.Year, o.OrderDate!.Value.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    Revenue = g.Sum(o => o.TotalAmount ?? 0)
                })
                .ToListAsync();

            var data = months.Select(m => new
            {
                month = $"{m.Month}/{m.Year}",
                revenue = revenueByMonth
                    .FirstOrDefault(x => x.Year == m.Year && x.Month == m.Month)
                    ?.Revenue ?? 0
            });

            return Ok(data);
        }

        [HttpGet("top-products")]
        public async Task<IActionResult> GetTopProducts()
        {
            var topProducts = await _context.Products
                .AsNoTracking()
                .OrderByDescending(p => p.SoldQuantity) 
                .Take(10)
                .Select(p => new {
                    p.ProductId,
                    p.ProductName,
                    p.SoldQuantity
                })
                .ToListAsync();

            return Ok(topProducts);
        }
    }
}
