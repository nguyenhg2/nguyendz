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
            var orders = BuildOrderQuery(f)
                .OrderByDescending(order => order.OrderDate)
                .Select(order => new AdminOrderListItemDto
                {
                    OrderId = order.OrderId,
                    OrderDate = order.OrderDate,
                    TotalAmount = order.TotalAmount,
                    Status = order.Status,
                    CustomerName = order.User != null ? order.User.FullName : null,
                    ReceiverName = order.ReceiverName,
                    ReceiverPhone = order.ReceiverPhone,
                    ReceiverAddress = order.ReceiverAddress,
                    PaymentMethod = order.PaymentMethod,
                    Note = order.Note
                });

            return Ok(await PagingHelper.PageAsync(orders, f.Page, f.Limit));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.User)
                .Include(o => o.OrderDetails).ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            return order == null ? NotFound() : Ok(ToDetailDto(order));
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateDto data)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            var nextStatus = AdminOrderStatus.Normalize(data.Status);
            if (!AdminOrderStatus.IsValid(nextStatus))
                return BadRequest(new { message = "Trạng thái đơn hàng không hợp lệ" });

            order.Status = nextStatus;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, status = order.Status });
        }

        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id, [FromBody] CancelRequestDto data)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .FirstOrDefaultAsync(o => o.OrderId == id);
            if (order == null) return NotFound();

            if (string.IsNullOrWhiteSpace(data.Reason))
                return BadRequest(new { message = "Vui lòng nhập lý do hủy" });

            var currentStatus = AdminOrderStatus.Normalize(order.Status);
            if (currentStatus == AdminOrderStatus.Completed)
                return BadRequest(new { message = "Không thể hủy đơn hàng đã hoàn thành" });
            if (currentStatus == AdminOrderStatus.Cancelled)
                return Ok(new { success = true, message = "Đơn hàng đã được hủy trước đó" });

            order.Status = AdminOrderStatus.Cancelled;
            order.Note = string.IsNullOrEmpty(order.Note)
                ? "Lý do hủy: " + data.Reason.Trim()
                : order.Note + " | Lý do hủy: " + data.Reason.Trim();

            await RestoreProductStock(order);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        private IQueryable<Order> BuildOrderQuery(OrderSearchParams f)
        {
            var query = _context.Orders.AsNoTracking().AsQueryable();

            var status = AdminOrderStatus.Normalize(f.Status);
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(order => order.Status == status);

            if (!string.IsNullOrWhiteSpace(f.Search))
            {
                var keyword = f.Search.Trim();
                query = query.Where(order =>
                    (order.ReceiverName ?? "").Contains(keyword) ||
                    (order.ReceiverPhone ?? "").Contains(keyword));
            }

            if (f.DateFrom.HasValue)
                query = query.Where(order => order.OrderDate >= f.DateFrom.Value.Date);

            if (f.DateTo.HasValue)
            {
                var nextDate = f.DateTo.Value.Date.AddDays(1);
                query = query.Where(order => order.OrderDate < nextDate);
            }

            if (!string.IsNullOrWhiteSpace(f.PaymentMethod))
            {
                var payment = f.PaymentMethod.Trim().ToLowerInvariant();
                query = payment == "cod"
                    ? query.Where(order => order.PaymentMethod != null && order.PaymentMethod.ToLower() == "cod")
                    : query.Where(order => order.PaymentMethod != null && order.PaymentMethod.ToLower() != "cod");
            }

            return query;
        }

        private async Task RestoreProductStock(Order order)
        {
            var productIds = order.OrderDetails
                .Where(detail => detail.ProductId.HasValue)
                .Select(detail => detail.ProductId!.Value)
                .Distinct()
                .ToList();

            var products = await _context.Products
                .Where(product => productIds.Contains(product.ProductId))
                .ToDictionaryAsync(product => product.ProductId);

            foreach (var detail in order.OrderDetails.Where(detail => detail.ProductId.HasValue))
            {
                if (!products.TryGetValue(detail.ProductId!.Value, out var product)) continue;

                product.StockQuantity = (product.StockQuantity ?? 0) + detail.Quantity;
                product.SoldQuantity = Math.Max(0, (product.SoldQuantity ?? 0) - detail.Quantity);
            }
        }

        private static AdminOrderDetailDto ToDetailDto(Order order)
        {
            return new AdminOrderDetailDto
            {
                OrderId = order.OrderId,
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                CustomerName = order.User?.FullName,
                ReceiverName = order.ReceiverName,
                ReceiverPhone = order.ReceiverPhone,
                ReceiverAddress = order.ReceiverAddress,
                PaymentMethod = order.PaymentMethod,
                Note = order.Note,
                OrderDetails = order.OrderDetails.Select(detail => new AdminOrderItemDto
                {
                    OrderDetailId = detail.OrderDetailId,
                    ProductId = detail.ProductId,
                    ProductName = detail.Product?.ProductName,
                    ImageUrl = detail.Product?.ImageUrl,
                    Quantity = detail.Quantity,
                    UnitPrice = detail.UnitPrice,
                    Subtotal = detail.Subtotal
                }).ToList()
            };
        }
    }

    public class OrderSearchParams
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public string? Status { get; set; }
        public string? Search { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public string? PaymentMethod { get; set; }
    }

    public class StatusUpdateDto { public string Status { get; set; } = ""; }
    public class CancelRequestDto { public string Reason { get; set; } = ""; }

    public class AdminOrderListItemDto
    {
        public int OrderId { get; set; }
        public DateTime? OrderDate { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? CustomerName { get; set; }
        public string? ReceiverName { get; set; }
        public string? ReceiverPhone { get; set; }
        public string? ReceiverAddress { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Note { get; set; }
    }

    public class AdminOrderDetailDto : AdminOrderListItemDto
    {
        public List<AdminOrderItemDto> OrderDetails { get; set; } = new();
    }

    public class AdminOrderItemDto
    {
        public int OrderDetailId { get; set; }
        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ImageUrl { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? Subtotal { get; set; }
    }
}
