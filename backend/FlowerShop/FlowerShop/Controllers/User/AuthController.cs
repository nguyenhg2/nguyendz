using Microsoft.AspNetCore.Mvc;
using FlowerShop.Data;
using FlowerShop.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FlowerShop.Controllers.User
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly FlowerContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(FlowerContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst("nameid")
                ?? User.FindFirst("sub");
            if (claim == null) return Unauthorized();
            if (!int.TryParse(claim.Value, out int userId)) return Unauthorized();

            var u = await _context.Users.FindAsync(userId);
            if (u == null || u.IsActive != true) return Unauthorized();

            return Ok(new
            {
                userId = u.UserId,
                fullName = u.FullName,
                email = u.Email,
                role = u.Role,
                phone = u.Phone,
                avatar = u.Avatar
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return Unauthorized(new { message = "Email hoac mat khau khong dung" });
            if (user.IsActive != true)
                return Unauthorized(new { message = "Tai khoan da bi khoa" });

            var parts = user.PasswordHash.Split('.');
            if (parts.Length != 2)
                return Unauthorized(new { message = "Loi du lieu" });

            byte[] salt = Convert.FromBase64String(parts[0]);
            if (!TokenHelper.IsValidPassword(request.Password, salt, parts[1]))
                return Unauthorized(new { message = "Email hoac mat khau khong dung" });

            string secretKey = _configuration["Jwt:Key"] ?? "Chuoi_Secret_Key_Mac_Dinh_Sieu_Bao_Mat_123";
            string token = TokenHelper.GenerateToken(secretKey, 480, user.UserId.ToString(), user.FullName, user.Role ?? "Customer");

            return Ok(new
            {
                token,
                user = new { userId = user.UserId, fullName = user.FullName, email = user.Email, role = user.Role }
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email da ton tai" });

            string hash = TokenHelper.HashPassword(request.Password, out byte[] salt);
            var newUser = new FlowerShop.Data.User
            {
                Email = request.Email,
                FullName = request.FullName,
                PasswordHash = Convert.ToBase64String(salt) + "." + hash,
                Phone = request.Phone,
                Role = "Customer",
                CreatedDate = DateTime.Now,
                IsActive = true
            };
            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            string secretKey = _configuration["Jwt:Key"] ?? "Chuoi_Secret_Key_Mac_Dinh_Sieu_Bao_Mat_123";
            string token = TokenHelper.GenerateToken(secretKey, 480, newUser.UserId.ToString(), newUser.FullName, newUser.Role ?? "Customer");

            return Ok(new
            {
                success = true,
                token,
                user = new { userId = newUser.UserId, fullName = newUser.FullName, email = newUser.Email, role = newUser.Role, phone = newUser.Phone }
            });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string FullName { get; set; } = "";
        public string Phone { get; set; } = "";
    }
}
