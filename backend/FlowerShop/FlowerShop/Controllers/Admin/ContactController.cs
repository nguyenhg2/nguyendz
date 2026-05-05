using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowerShop.Data;
using Microsoft.AspNetCore.Authorization;

namespace FlowerShop.Controllers.Admin
{
    [Route("api/admin/contacts")] 
    [ApiController]
    [Authorize(Roles = "Admin")] 
    public class ContactController : ControllerBase
    {
        private readonly FlowerContext _context;

        public ContactController(FlowerContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? isRead)
        {
            var query = _context.Contacts.AsQueryable();

            if (isRead.HasValue)
            {
                query = query.Where(c => c.IsRead == isRead.Value);
            }

            var contacts = await query
                .OrderByDescending(c => c.CreatedDate) 
                .ToListAsync();

            return Ok(contacts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var contact = await _context.Contacts.FindAsync(id);
            if (contact == null) return NotFound(new { message = "Không tìm thấy nội dung liên hệ" });

            if (contact.IsRead == false)
            {
                contact.IsRead = true;
                await _context.SaveChangesAsync();
            }

            return Ok(contact);
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var contact = await _context.Contacts.FindAsync(id);
            if (contact == null) return NotFound();

            contact.IsRead = true; 
            await _context.SaveChangesAsync();

            return Ok(new { success = true, isRead = contact.IsRead });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            var contact = await _context.Contacts.FindAsync(id);
            if (contact == null) return NotFound();

            _context.Contacts.Remove(contact);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa liên hệ thành công" });
        }
    }
}