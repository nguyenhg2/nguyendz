using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/categories")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class CategoryController : ControllerBase
    {
        private readonly FlowerContext _context;

        public CategoryController(FlowerContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] bool? isActive,
            [FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            var q = _context.Categories.AsQueryable();

            if (!string.IsNullOrEmpty(search))
                q = q.Where(c => c.CategoryName.Contains(search));
            if (isActive.HasValue)
                q = q.Where(c => c.IsActive == isActive);

            var total = await q.CountAsync();
            var items = await q.OrderBy(c => c.SortOrder)
                .Skip((page - 1) * limit).Take(limit).ToListAsync();

            return Ok(new { total, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var c = await _context.Categories.FindAsync(id);
            if (c == null) return NotFound();
            return Ok(c);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Category category)
        {
            category.CreatedDate = DateTime.Now;
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Category data)
        {
            var c = await _context.Categories.FindAsync(id);
            if (c == null) return NotFound();

            c.CategoryName = data.CategoryName;
            c.Description = data.Description;
            c.ImageUrl = data.ImageUrl;
            c.SortOrder = data.SortOrder;
            c.IsActive = data.IsActive;

            await _context.SaveChangesAsync();
            return Ok(c);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var c = await _context.Categories.FindAsync(id);
            if (c == null) return NotFound();
            c.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Da an danh muc" });
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var c = await _context.Categories.FindAsync(id);
            if (c == null) return NotFound();
            c.IsActive = !c.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { id = c.CategoryId, isActive = c.IsActive });
        }
    }
}
