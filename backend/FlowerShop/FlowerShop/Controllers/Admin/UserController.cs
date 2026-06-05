using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using FlowerShop.Common;
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
        public async Task<IActionResult> GetAll([FromQuery] UserSearchParams f)
        {
            var q = _context.Users.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(f.Search))
                q = q.Where(u =>
                    u.FullName.Contains(f.Search)
                    || u.Email.Contains(f.Search)
                    || (u.Phone ?? "").Contains(f.Search));
            if (!string.IsNullOrEmpty(f.Role))
                q = q.Where(u => u.Role == f.Role);
            if (f.IsActive.HasValue)
                q = q.Where(u => u.IsActive == f.IsActive);

            var items = q.OrderByDescending(u => u.CreatedDate)
                .Select(u => new {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Role,
                    u.IsActive,
                    u.CreatedDate
                });

            return Ok(await PagingHelper.PageAsync(items, f.Page, f.Limit));
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var u = await _context.Users.FindAsync(id);
            if (u == null) return NotFound();
            u.IsActive = !u.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { id = u.UserId, isActive = u.IsActive });
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
