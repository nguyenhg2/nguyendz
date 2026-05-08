using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;

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
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] string? category = null,
            [FromQuery] string? search = null,
            [FromQuery] string? priceRange = null,
            [FromQuery] string? rating = null,
            [FromQuery] string? sort = null)
        {
            var query = _context.Products
                .Include(p => p.Images)
                .Include(p => p.Reviews)
                .Where(p => p.IsActive == true);

            if (!string.IsNullOrEmpty(category) && int.TryParse(category, out int catId))
            {
                query = query.Where(p => p.CategoryId == catId);
            }

            if (!string.IsNullOrEmpty(search))
            {
                var keyword = search.ToLower();
                query = query.Where(p => p.ProductName.ToLower().Contains(keyword));
            }

            if (!string.IsNullOrEmpty(priceRange))
            {
                var parts = priceRange.Split('-');
                if (parts.Length == 2 &&
                    decimal.TryParse(parts[0], out decimal minPrice) &&
                    decimal.TryParse(parts[1], out decimal maxPrice))
                {
                    query = query.Where(p => (p.DiscountPrice ?? p.Price) >= minPrice && (p.DiscountPrice ?? p.Price) <= maxPrice);
                }
            }

            if (!string.IsNullOrEmpty(rating) && int.TryParse(rating, out int minRating))
            {
                query = query.Where(p => p.Reviews.Any(r => r.Rating.HasValue) &&
                            p.Reviews.Where(r => r.Rating.HasValue).Average(r => (double)r.Rating!.Value) >= minRating);
            }

            query = sort switch
            {
                "price_asc" => query.OrderBy(p => p.DiscountPrice ?? p.Price),
                "price_desc" => query.OrderByDescending(p => p.DiscountPrice ?? p.Price),
                "sold" => query.OrderByDescending(p => p.SoldQuantity),
                _ => query.OrderByDescending(p => p.CreatedDate)
            };

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    productId = p.ProductId,
                    productName = p.ProductName,
                    price = p.Price,
                    sale = p.DiscountPrice,
                    imageUrl = p.Images.OrderByDescending(i => i.IsMain).ThenBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault() ?? p.ImageUrl,
                    categoryId = p.CategoryId,
                    rating = p.Reviews.Any(r => r.Rating.HasValue) ? Math.Round(p.Reviews.Where(r => r.Rating.HasValue).Average(r => (double)r.Rating!.Value), 1) : 0,
                    reviewCount = p.Reviews.Count,
                    soldQuantity = p.SoldQuantity,
                    stockQuantity = p.StockQuantity,
                    isFeatured = p.IsFeatured,
                    createdDate = p.CreatedDate,
                    isNew = p.CreatedDate != null && p.CreatedDate >= DateTime.Now.AddDays(-7)
                })
                .ToListAsync();

            return Ok(new { totalItems, totalPages, items });
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

            return Ok(ToProductDetail(product));
        }

        private static object ToProductDetail(Product product)
        {
            return new
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
                isNew = IsNew(product),
                reviews = product.Reviews.Select(r => new
                {
                    id = r.ReviewId,
                    rating = r.Rating,
                    comment = r.Comment,
                    createdAt = r.CreatedDate,
                    userName = r.User?.FullName ?? "Ẩn danh"
                }).OrderByDescending(r => r.createdAt).ToList()
            };
        }

        private static bool IsNew(Product product)
        {
            return product.CreatedDate.HasValue && product.CreatedDate.Value.AddDays(7) >= DateTime.Now;
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
                .Select(i => new ProductImageDto
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
