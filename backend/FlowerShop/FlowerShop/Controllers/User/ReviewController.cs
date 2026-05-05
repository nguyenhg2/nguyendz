using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using System.Security.Claims;

namespace FlowerShop.Controllers.User
{
    [Route("api/reviews")] 
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly FlowerContext _context;

        public ReviewController(FlowerContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Vui lòng đăng nhập để đánh giá" });
            }

            if (request.ProductId == null || request.Rating == null)
            {
                return BadRequest(new { message = "Thiếu thông tin sản phẩm hoặc số sao" });
            }

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null)
            {
                return NotFound(new { message = "Sản phẩm không tồn tại" });
            }

            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.ProductId == request.ProductId && r.UserId == userId);

            if (existingReview != null)
            {
                existingReview.Rating = request.Rating;
                existingReview.Comment = request.Comment;
                existingReview.CreatedDate = DateTime.UtcNow;
            }
            else
            {
                var review = new Review
                {
                    ProductId = request.ProductId,
                    UserId = userId,
                    Rating = request.Rating,
                    Comment = request.Comment,
                    CreatedDate = DateTime.UtcNow
                };
                _context.Reviews.Add(review);
            }

            await _context.SaveChangesAsync();

            var updatedProduct = await _context.Products
                .Include(p => p.Reviews)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(p => p.ProductId == request.ProductId);

            var avgRating = updatedProduct.Reviews.Any() 
                ? updatedProduct.Reviews.Average(r => r.Rating) 
                : 0;

            product.Rating = (decimal?)avgRating ?? 0;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đánh giá thành công" });
        }
    }

    public class SubmitReviewRequest
    {
        public int? ProductId { get; set; }
        public int? Rating { get; set; }
        public string? Comment { get; set; }
    }
}
