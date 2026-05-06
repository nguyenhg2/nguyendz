using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using FlowerShop.Common;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Api
{
    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
    public class CreateOrderDto
    {
        public string? ReceiverName { get; set; }
        public string? ReceiverPhone { get; set; }
        public string? ReceiverAddress { get; set; }
        public string? Note { get; set; }
        public string? PaymentMethod { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
    }

    [Route("api/orders")] 
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly FlowerContext _context;

        public OrderController(FlowerContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            var userId = UserClaimsHelper.GetUserId(User);
            if (userId == null) return Unauthorized();

            if (dto.Items.Count == 0)
                return BadRequest(new { message = "Đơn hàng phải có sản phẩm" });

            if (dto.Items.Any(x => x.Quantity <= 0))
                return BadRequest(new { message = "Số lượng sản phẩm không hợp lệ" });

            var productIds = dto.Items.Select(x => x.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.ProductId) && p.IsActive == true)
                .ToListAsync();

            if (products.Count != productIds.Count)
                return BadRequest(new { message = "Sản phẩm không tồn tại hoặc đã ngừng bán" });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var orderDetails = new List<OrderDetail>();
                decimal totalAmount = 0;

                foreach (var item in dto.Items)
                {
                    var product = products.First(p => p.ProductId == item.ProductId);
                    var unitPrice = product.DiscountPrice ?? product.Price;

                    if (product.StockQuantity.HasValue && product.StockQuantity < item.Quantity)
                        return BadRequest(new { message = $"Sản phẩm {product.ProductName} không đủ hàng" });

                    orderDetails.Add(new OrderDetail
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = unitPrice,
                        Subtotal = unitPrice * item.Quantity
                    });

                    totalAmount += unitPrice * item.Quantity;
                    product.StockQuantity = product.StockQuantity.HasValue ? product.StockQuantity - item.Quantity : null;
                    product.SoldQuantity = (product.SoldQuantity ?? 0) + item.Quantity;
                }

                var order = new Order
                {
                    UserId = userId.Value,
                    OrderDate = DateTime.Now,
                    ReceiverName = dto.ReceiverName?.Trim(),
                    ReceiverPhone = dto.ReceiverPhone?.Trim(),
                    ReceiverAddress = dto.ReceiverAddress?.Trim(),
                    Note = dto.Note?.Trim(),
                    PaymentMethod = dto.PaymentMethod?.Trim(),
                    Status = "Chờ xử lý", 
                    TotalAmount = totalAmount
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                foreach (var detail in orderDetails)
                {
                    detail.OrderId = order.OrderId;
                }

                _context.OrderDetails.AddRange(orderDetails);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, orderId = order.OrderId });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi khi tạo đơn hàng", detail = ex.Message });
            }
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = UserClaimsHelper.GetUserId(User);
            if (userId == null) return Unauthorized();

            var myOrders = await _context.Orders
                .AsNoTracking()
                .Where(o => o.UserId == userId.Value)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalAmount,
                    o.Status,
                    o.ReceiverAddress,
                    ItemsCount = o.OrderDetails.Count
                })
                .ToListAsync();

            return Ok(myOrders);
        }
    }
}
