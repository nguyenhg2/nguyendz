using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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
          
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdStr == null) return Unauthorized();
            int userId = int.Parse(userIdStr);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = new Order
                {
                    UserId = userId,
                    OrderDate = DateTime.Now,
                    ReceiverName = dto.ReceiverName,
                    ReceiverPhone = dto.ReceiverPhone,
                    ReceiverAddress = dto.ReceiverAddress,
                    Note = dto.Note,
                    PaymentMethod = dto.PaymentMethod,
                    Status = "Chờ xử lý", 
                    TotalAmount = dto.Items.Sum(x => x.Price * x.Quantity)
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                foreach (var item in dto.Items)
                {
                    var detail = new OrderDetail
                    {
                        OrderId = order.OrderId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.Price,
                        Subtotal = item.Price * item.Quantity
                    };
                    _context.OrderDetails.Add(detail);
                }

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
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdStr == null) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var myOrders = await _context.Orders
                .Where(o => o.UserId == userId)
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