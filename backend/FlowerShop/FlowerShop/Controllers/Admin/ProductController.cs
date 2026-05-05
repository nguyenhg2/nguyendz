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

        public ProductController(FlowerContext context)
        {
            _context = context;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ProductParams filter)
        {
            var query = _context.Products
                .Include(p => p.Category) 
                .AsQueryable();

            if (!string.IsNullOrEmpty(filter.Search))
                query = query.Where(p => p.ProductName.Contains(filter.Search));

            if (filter.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == filter.CategoryId);

            if (filter.IsActive.HasValue)
                query = query.Where(p => p.IsActive == filter.IsActive);

            if (filter.IsFeatured.HasValue)
                query = query.Where(p => p.IsFeatured == filter.IsFeatured);

            query = filter.SortBy switch
            {
                "price_asc" => query.OrderBy(p => p.Price),
                "price_desc" => query.OrderByDescending(p => p.Price),
                "sold" => query.OrderByDescending(p => p.SoldQuantity),
                _ => query.OrderByDescending(p => p.CreatedDate)
            };

            var total = await query.CountAsync();
            var items = await query
                .Skip((filter.Page - 1) * filter.Limit)
                .Take(filter.Limit)
                .ToListAsync();

            return Ok(new { total, items });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm" });
            return Ok(product);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Product product)
        {
            product.CreatedDate = DateTime.Now; 
            product.IsActive = product.IsActive ?? true; 
            
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = product.ProductId }, product);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Product data)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            product.ProductName = data.ProductName;
            product.Description = data.Description; 
            product.Price = data.Price; 
            product.DiscountPrice = data.DiscountPrice; 
            product.StockQuantity = data.StockQuantity; 
            product.CategoryId = data.CategoryId; 
            product.IsActive = data.IsActive; 
            product.IsFeatured = data.IsFeatured; 
            product.ImageUrl = data.ImageUrl; 
            product.UpdatedDate = DateTime.Now; 

            await _context.SaveChangesAsync();
            return Ok(product);
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            product.IsActive = !product.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { id = product.ProductId, isActive = product.IsActive });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            bool hasOrders = await _context.OrderDetails.AnyAsync(od => od.ProductId == id);
            if (hasOrders)
            {
                product.IsActive = false;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Sản phẩm đã có đơn hàng nên chỉ thực hiện ẩn." });
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa sản phẩm thành công" });
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
        public string? SortBy { get; set; }
    }
}