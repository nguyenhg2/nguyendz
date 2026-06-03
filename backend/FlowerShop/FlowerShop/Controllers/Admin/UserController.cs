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
            var paging = PagingHelper.Normalize(f.Page, f.Limit);
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

            var total = await q.CountAsync();
            var users = await q.OrderByDescending(u => u.CreatedDate)
                .Skip(PagingHelper.Skip(paging.Page, paging.Limit))
                .Take(paging.Limit)
                .ToListAsync();
            var items = users.Select(ToListDto).ToList();

            return Ok(PagingHelper.Result(total, items, paging.Page, paging.Limit));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var u = await _context.Users.AsNoTracking().Include(x => x.Orders).FirstOrDefaultAsync(x => x.UserId == id);
            if (u == null) return NotFound();
            return Ok(ToDetailDto(u));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] FlowerShop.Data.User data)
        {
            var u = await _context.Users.FindAsync(id);
            if (u == null) return NotFound();

            if (string.IsNullOrWhiteSpace(data.FullName))
                return BadRequest(new { message = "Họ tên không được để trống" });

            if (data.Role != "Admin" && data.Role != "Customer")
                return BadRequest(new { message = "Vai trò không hợp lệ" });

            u.FullName = data.FullName.Trim();
            u.Phone = data.Phone?.Trim();
            u.Address = data.Address?.Trim();
            u.Role = data.Role;
            u.IsActive = data.IsActive;
            await _context.SaveChangesAsync();
            return Ok(u);
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

        private static object ToListDto(FlowerShop.Data.User user)
        {
            return new
            {
                user.UserId,
                user.FullName,
                user.Email,
                user.Phone,
                user.Role,
                user.IsActive,
                user.CreatedDate
            };
        }

        private static object ToDetailDto(FlowerShop.Data.User user)
        {
            return new
            {
                user.UserId,
                user.FullName,
                user.Email,
                user.Phone,
                user.Address,
                user.Avatar,
                user.Role,
                user.IsActive,
                user.CreatedDate,
                totalOrders = user.Orders.Count
            };
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
