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
        public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
        {
            var query = _context.Categories.AsQueryable();

            if (!includeInactive)
            {
                query = query.Where(c => c.IsActive == true);
            }

            var categories = await query
                .OrderBy(c => c.SortOrder) 
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound(new { message = "Không tìm thấy danh mục" });
            return Ok(category);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Category category)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            category.CreatedDate = DateTime.Now; 
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = category.CategoryId }, category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Category categoryData)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            category.CategoryName = categoryData.CategoryName;
            category.Description = categoryData.Description;
            category.ImageUrl = categoryData.ImageUrl;
            category.SortOrder = categoryData.SortOrder;
            category.IsActive = categoryData.IsActive;

            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            category.IsActive = !category.IsActive; 
            await _context.SaveChangesAsync();

            return Ok(new { id = category.CategoryId, isActive = category.IsActive });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();
            category.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã ẩn danh mục thành công" });
        }
    }
}