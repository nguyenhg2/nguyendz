using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using FlowerShop.Common;

namespace FlowerShop.Controllers.User
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly FlowerContext _context;
        public ProductController(FlowerContext context) 
        { 
            _context = context; 
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] int? cat, [FromQuery] string? sort,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 12,
            [FromQuery] string? q=null, [FromQuery] string? priceRange=null)
        {
            (page, pageSize) = PagingHelper.Normalize(page, pageSize, defaultLimit: 12);

            var query = _context.Products
                .AsNoTracking()
                .Include(p => p.Images)
                .Where(p => p.IsActive == true)
                .AsQueryable();

            if (!string.IsNullOrEmpty(q))
                query = query.Where(p => p.ProductName.Contains(q));

            if (!string.IsNullOrEmpty(priceRange))
            {
                var parts = priceRange.Split('-');
                if (parts.Length == 2)
                {
                    if (!string.IsNullOrEmpty(parts[0]) && decimal.TryParse(parts[0], out var minPrice))
                        query = query.Where(p => p.Price >= minPrice);
                    if (!string.IsNullOrEmpty(parts[1]) && decimal.TryParse(parts[1], out var maxPrice))
                        query = query.Where(p => p.Price <= maxPrice);
                }
            }

            if (cat.HasValue)
                query = query.Where(p => p.CategoryId == cat);

            query = sort switch
            {
                "price_asc" => query.OrderBy(p => p.Price),
                "price_desc" => query.OrderByDescending(p => p.Price),
                "sold" => query.OrderByDescending(p => p.SoldQuantity),
                _ => query.OrderByDescending(p => p.CreatedDate)
            };

            var totalItems = await query.CountAsync();
            var products = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                items = products.Select(p => new
                {
                    productId = p.ProductId,
                    id = p.ProductId,
                    name = p.ProductName,
                    price = p.Price,
                    sale = p.DiscountPrice,
                    imageUrl = GetMainImage(p),
                    images = GetImages(p),
                    categoryId = p.CategoryId,
                    rating = p.Rating ?? 0,
                    soldQuantity = p.SoldQuantity,
                    isFeatured = p.IsFeatured,       
                    createdDate = p.CreatedDate,     
                    isNew = p.CreatedDate.HasValue && p.CreatedDate.Value.AddDays(7) >= DateTime.Now
                })
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProductDetail(int id)
        {
            var product = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Include(p => p.Reviews).ThenInclude(r => r.User)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null) return NotFound(new { message = "Không tìm thấy sản phẩm" });

            return Ok(new
            {
                productId = product.ProductId,
                id = product.ProductId,            
                name = product.ProductName,
                desc = product.Description,          
                price = product.Price,
                sale = product.DiscountPrice,
                imageUrl = GetMainImage(product),
                images = GetImages(product),
                cat = product.CategoryId,
                categoryName = product.Category?.CategoryName,
                rating = product.Rating ?? 0,
                soldQuantity = product.SoldQuantity,
                stockQuantity = product.StockQuantity,
                isFeatured = product.IsFeatured,
                isNew = product.CreatedDate.HasValue && product.CreatedDate.Value.AddDays(7) >= DateTime.Now,
                reviews = product.Reviews.Select(r => new
                {
                    id = r.ReviewId,                 
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedDate,
                    userName = r.User?.FullName ?? "Ẩn danh"
                }).OrderByDescending(r => r.createdAt).ToList()
            });
        }

        private static string? GetMainImage(Product product)
        {
            return product.Images
                .OrderByDescending(i => i.IsMain)
                .ThenBy(i => i.Id)
                .Select(i => i.ImageUrl)
                .FirstOrDefault() ?? product.ImageUrl;
        }

        private static List<ProductImageDto> GetImages(Product product)
        {
            return product.Images
                .OrderByDescending(i => i.IsMain)
                .ThenBy(i => i.Id)
                .Select(i => new
                ProductImageDto
                {
                    Id = i.Id,
                    ImageUrl = i.ImageUrl,
                    IsMain = i.IsMain
                })
                .ToList();
        }
    }

    public class ProductImageDto
    {
        public int Id { get; set; }
        public string? ImageUrl { get; set; }
        public bool? IsMain { get; set; }
    }
}
