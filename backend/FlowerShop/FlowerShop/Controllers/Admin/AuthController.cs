using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/auth")] 
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly FlowerContext _context;

        public AuthController(FlowerContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        [Authorize] 
        public async Task<IActionResult> GetMe()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng trong Token" });
                }
                int userId = int.Parse(userIdClaim);
                var user = await _context.Users
                    .Where(u => u.UserId == userId && u.IsActive == true)
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName,
                        u.Email,
                        u.Phone,
                        u.Role, 
                        u.Avatar
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { message = "Người dùng không tồn tại hoặc đã bị khóa" });
                }
                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", detail = ex.Message });
            }
        }
    }
}