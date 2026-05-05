using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/banners")] 
    [ApiController]
    [Authorize(Roles = "Admin")] 
    public class BannerController : ControllerBase
    {
        private readonly FlowerContext _context;

        public BannerController(FlowerContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous] 
        public async Task<IActionResult> GetAll()
        {
            var banners = await _context.Banners
                .OrderBy(b => b.SortOrder) 
                .ToListAsync();
            return Ok(banners);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return NotFound(new { message = "Không tìm thấy banner" });
            return Ok(banner);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Banner banner)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = banner.BannerId }, banner);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Banner data)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return NotFound();

            banner.Title = data.Title; 
            banner.ImageUrl = data.ImageUrl; 
            banner.LinkUrl = data.LinkUrl; 
            banner.IsActive = data.IsActive; 
            banner.SortOrder = data.SortOrder; 

            await _context.SaveChangesAsync();
            return Ok(banner);
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return NotFound();

            banner.IsActive = !banner.IsActive; 
            await _context.SaveChangesAsync();
            return Ok(new { id = banner.BannerId, isActive = banner.IsActive });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return NotFound();

            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa banner thành công" });
        }

        [HttpPost("{id}/image")]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("File không hợp lệ");

            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return NotFound();

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads/banners");

            if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

            var filePath = Path.Combine(folderPath, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            banner.ImageUrl = "/uploads/banners/" + fileName;
            await _context.SaveChangesAsync();

            return Ok(new { imageUrl = banner.ImageUrl });
        }
    }
}