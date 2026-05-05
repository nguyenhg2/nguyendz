using Microsoft.AspNetCore.Mvc;
using FlowerShop.Data;
using FlowerShop.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FlowerShop.Controllers.User
{
    [Route("api/[controller]")]
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            var userId = int.Parse(userIdClaim.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();
            return Ok(new { user.FullName, user.Email, user.Role, user.Phone, user.Address });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email đã tồn tại!" });

            byte[] salt;
            string hashedPwd = TokenHelper.HashPassword(request.Password, out salt);
            string storedPassword = Convert.ToBase64String(salt) + "." + hashedPwd;

            var newUser = new FlowerShop.Data.User
            {
                Email = request.Email,
                FullName = request.FullName,
                PasswordHash = storedPassword,
                Phone = request.Phone,
                Role = "Customer",
                CreatedDate = DateTime.Now,
                IsActive = true
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Đăng ký thành công!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác" });

            var parts = user.PasswordHash.Split('.');
            if (parts.Length != 2) return Unauthorized(new { message = "Dữ liệu mật khẩu lỗi" });

            byte[] salt = Convert.FromBase64String(parts[0]);
            string storedHash = parts[1];

            if (!TokenHelper.IsValidPassword(request.Password, salt, storedHash))
                return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác" });

            string secretKey = _configuration["Jwt:Key"] ?? "Chuoi_Secret_Key_Sieu_Bao_Mat_Cua_Ban_123";
            string token = TokenHelper.GenerateToken(
                secretKey,
                60,
                user.UserId.ToString(),
                user.FullName,
                user.Role
            );

            return Ok(new
            {
                success = true,
                token = token,
                user = new { user.FullName, user.Email, user.Role }
            });
        }
    }

    public class RegisterRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public string Phone { get; set; }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
