namespace FlowerShop.Common
{
    public static class UploadHelper
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
        };

        public static async Task<string> SaveImageAsync(IWebHostEnvironment env, IFormFile file, string uploadFolder)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("Không có file ảnh");

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension))
                throw new InvalidOperationException("Chỉ hỗ trợ ảnh .jpg, .jpeg, .png, .webp, .gif");

            var folder = Path.Combine(env.WebRootPath, "uploads", uploadFolder);
            Directory.CreateDirectory(folder);

            var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var path = Path.Combine(folder, fileName);

            await using var stream = new FileStream(path, FileMode.Create);
            await file.CopyToAsync(stream);

            return $"/uploads/{uploadFolder}/{fileName}";
        }

        public static void DeleteLocalFile(IWebHostEnvironment env, string? url)
        {
            if (string.IsNullOrWhiteSpace(url) || url.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                return;

            var webRoot = Path.GetFullPath(env.WebRootPath);
            var relativePath = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.GetFullPath(Path.Combine(webRoot, relativePath));

            if (!fullPath.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase))
                return;

            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
    }
}
