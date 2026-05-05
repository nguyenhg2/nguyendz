using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/reviews")] 
    [ApiController]
    [Authorize(Roles = "Admin")] 
    public class ReviewController : ControllerBase
    {
        private readonly FlowerContext _context;

        public ReviewController(FlowerContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ReviewSearchParams filter)
        {
            var query = _context.Reviews
                .Include(r => r.Product) 
                .Include(r => r.User)   
                .AsQueryable();

            if (filter.ProductId.HasValue)
                query = query.Where(r => r.ProductId == filter.ProductId);

            if (filter.UserId.HasValue)
                query = query.Where(r => r.UserId == filter.UserId);

            if (filter.MinRating.HasValue)
                query = query.Where(r => r.Rating >= filter.MinRating);
            if (filter.MaxRating.HasValue)
                query = query.Where(r => r.Rating <= filter.MaxRating);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreatedDate)
                .Skip((filter.Page - 1) * filter.Limit)
                .Take(filter.Limit)
                .ToListAsync();

            return Ok(new { total, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var review = await _context.Reviews
                .Include(r => r.Product)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.ReviewId == id);

            if (review == null) return NotFound(new { message = "Không tìm thấy đánh giá" });
            return Ok(review);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return NotFound();

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa đánh giá thành công" });
        }
    }

    public class ReviewSearchParams
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public int? ProductId { get; set; }
        public int? UserId { get; set; }
        public int? MinRating { get; set; }
        public int? MaxRating { get; set; }
    }
}