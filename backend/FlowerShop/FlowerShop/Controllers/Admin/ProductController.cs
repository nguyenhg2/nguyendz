using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/products")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class ProductController : ControllerBase
    {
        private readonly FlowerContext _context;
        private readonly IWebHostEnvironment _env;

        public ProductController(FlowerContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ProductParams f)
        {
            var q = _context.Products.Include(p => p.Category).Include(p => p.Images).AsQueryable();

            if (!string.IsNullOrEmpty(f.Search))
                q = q.Where(p => p.ProductName.Contains(f.Search));
            if (f.CategoryId.HasValue)
                q = q.Where(p => p.CategoryId == f.CategoryId);
            if (f.IsActive.HasValue)
                q = q.Where(p => p.IsActive == f.IsActive);
            if (f.IsFeatured.HasValue)
                q = q.Where(p => p.IsFeatured == f.IsFeatured);
            if (f.MinPrice.HasValue)
                q = q.Where(p => p.Price >= f.MinPrice);
            if (f.MaxPrice.HasValue)
                q = q.Where(p => p.Price <= f.MaxPrice);

            q = f.SortBy switch
            {
                "price_asc" => q.OrderBy(p => p.Price),
                "price_desc" => q.OrderByDescending(p => p.Price),
                "sold" => q.OrderByDescending(p => p.SoldQuantity),
                _ => q.OrderByDescending(p => p.CreatedDate)
            };

            var total = await q.CountAsync();
            var items = await q.Skip((f.Page - 1) * f.Limit).Take(f.Limit).ToListAsync();
            return Ok(new { total, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var p = await _context.Products.Include(x => x.Category).Include(x => x.Images)
                .FirstOrDefaultAsync(x => x.ProductId == id);
            if (p == null) return NotFound();
            return Ok(p);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Product product)
        {
            product.CreatedDate = DateTime.Now;
            product.IsActive = product.IsActive ?? true;
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return Ok(product);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Product data)
        {
            var p = await _context.Products.FindAsync(id);
            if (p == null) return NotFound();

            p.ProductName = data.ProductName;
            p.Description = data.Description;
            p.Price = data.Price;
            p.DiscountPrice = data.DiscountPrice;
            p.StockQuantity = data.StockQuantity;
            p.CategoryId = data.CategoryId;
            p.IsActive = data.IsActive;
            p.IsFeatured = data.IsFeatured;
            p.ImageUrl = data.ImageUrl;
            p.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(p);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var p = await _context.Products.FindAsync(id);
            if (p == null) return NotFound();

            if (await _context.OrderDetails.AnyAsync(od => od.ProductId == id))
            {
                p.IsActive = false;
                await _context.SaveChangesAsync();
                return Ok(new { message = "San pham co don hang, da an." });
            }

            _context.ProductImages.RemoveRange(_context.ProductImages.Where(i => i.ProductId == id));
            _context.Products.Remove(p);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xoa thanh cong" });
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var p = await _context.Products.FindAsync(id);
            if (p == null) return NotFound();
            p.IsActive = !p.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { id = p.ProductId, isActive = p.IsActive });
        }

        [HttpPost("{id}/images")]
        public async Task<IActionResult> UploadImages(int id, [FromForm] List<IFormFile> files, [FromForm] int mainIndex)
        {
            var p = await _context.Products.FindAsync(id);
            if (p == null) return NotFound();
            if (files == null || files.Count == 0) return BadRequest("Khong co file");

            var folder = Path.Combine(_env.WebRootPath, "uploads/products");
            if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

            for (int i = 0; i < files.Count; i++)
            {
                var fileName = Guid.NewGuid() + Path.GetExtension(files[i].FileName);
                var path = Path.Combine(folder, fileName);
                using var stream = new FileStream(path, FileMode.Create);
                await files[i].CopyToAsync(stream);

                var img = new ProductImage
                {
                    ProductId = id,
                    ImageUrl = "/uploads/products/" + fileName,
                    IsMain = (i == mainIndex)
                };
                _context.ProductImages.Add(img);

                if (i == mainIndex) p.ImageUrl = img.ImageUrl;
            }

            await _context.SaveChangesAsync();
            var images = await _context.ProductImages.Where(x => x.ProductId == id).ToListAsync();
            return Ok(images);
        }

        [HttpDelete("{id}/images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int id, int imageId)
        {
            var img = await _context.ProductImages.FindAsync(imageId);
            if (img == null || img.ProductId != id) return NotFound();
            _context.ProductImages.Remove(img);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xoa anh thanh cong" });
        }

        [HttpPatch("{id}/images/{imageId}/set-main")]
        public async Task<IActionResult> SetMainImage(int id, int imageId)
        {
            var images = await _context.ProductImages.Where(x => x.ProductId == id).ToListAsync();
            foreach (var img in images) img.IsMain = (img.Id == imageId);

            var main = images.FirstOrDefault(x => x.Id == imageId);
            if (main != null)
            {
                var p = await _context.Products.FindAsync(id);
                if (p != null) p.ImageUrl = main.ImageUrl;
            }

            await _context.SaveChangesAsync();
            return Ok(images);
        }
    }

    public class ProductParams
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
        public string? Search { get; set; }
        public int? CategoryId { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsFeatured { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? SortBy { get; set; }
    }
}
