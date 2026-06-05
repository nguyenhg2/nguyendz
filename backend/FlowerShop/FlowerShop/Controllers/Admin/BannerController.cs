using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using FlowerShop.Common;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/banners")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class BannerController : ControllerBase
    {
        private readonly FlowerContext _context;
        private readonly IWebHostEnvironment _env;

        public BannerController(FlowerContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] bool? isActive,
            [FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            var q = _context.Banners.AsNoTracking().AsQueryable();
            if (!string.IsNullOrEmpty(search))
                q = q.Where(b => (b.Title ?? "").Contains(search));
            if (isActive.HasValue)
                q = q.Where(b => b.IsActive == isActive);

            return Ok(await PagingHelper.PageAsync(q.OrderBy(b => b.SortOrder), page, limit, defaultLimit: 20));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Banner banner)
        {
            var error = ValidateBanner(banner);
            if (error != null) return BadRequest(new { message = error });

            banner.Title = banner.Title?.Trim();
            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();
            return Ok(banner);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Banner data)
        {
            var b = await _context.Banners.FindAsync(id);
            if (b == null) return NotFound();

            var error = ValidateBanner(data);
            if (error != null) return BadRequest(new { message = error });

            b.Title = data.Title?.Trim();
            b.ImageUrl = data.ImageUrl;
            b.LinkUrl = data.LinkUrl;
            b.IsActive = data.IsActive;
            b.SortOrder = data.SortOrder;
            await _context.SaveChangesAsync();
            return Ok(b);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var b = await _context.Banners.FindAsync(id);
            if (b == null) return NotFound();
            _context.Banners.Remove(b);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa thành công" });
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var b = await _context.Banners.FindAsync(id);
            if (b == null) return NotFound();
            b.IsActive = !b.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { id = b.BannerId, isActive = b.IsActive });
        }

        [HttpPost("{id}/image")]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            var b = await _context.Banners.FindAsync(id);
            if (b == null) return NotFound();

            try
            {
                b.ImageUrl = await UploadHelper.SaveImageAsync(_env, file, "banners");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            await _context.SaveChangesAsync();
            return Ok(new { imageUrl = b.ImageUrl });
        }

        private static string? ValidateBanner(Banner banner)
        {
            if (string.IsNullOrWhiteSpace(banner.Title))
                return "Tiêu đề banner không được để trống";

            return null;
        }
    }
}
