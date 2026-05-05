using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/users")] 
    [ApiController]
    [Authorize(Roles = "Admin")] 
    public class UserController : ControllerBase
    {
        private readonly FlowerContext _context;

        public UserController(FlowerContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] UserSearchParams filter)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(u => u.FullName.Contains(filter.Search) ||
                                       u.Email.Contains(filter.Search) ||
                                       u.Phone.Contains(filter.Search));
            }

            if (!string.IsNullOrEmpty(filter.Role))
            {
                query = query.Where(u => u.Role == filter.Role);
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == filter.IsActive);
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(u => u.CreatedDate)
                .Skip((filter.Page - 1) * filter.Limit)
                .Take(filter.Limit)
                .ToListAsync();

            return Ok(new { total, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _context.Users
                .Include(u => u.Orders) 
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            user.PasswordHash = null;

            return Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] FlowerShop.Data.User updateData)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.FullName = updateData.FullName;
            user.Phone = updateData.Phone;
            user.Address = updateData.Address;
            user.Role = updateData.Role;
            user.IsActive = updateData.IsActive;

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { id = user.UserId, isActive = user.IsActive });
        }
    }

    public class UserSearchParams
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public string? Search { get; set; }
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
    }
}