namespace FlowerShop.Common;

public static class UploadHelper
{
    private static readonly string[] ImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    public static bool IsImage(IFormFile? file)
    {
        if (file == null || file.Length == 0) return false;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        return ImageExtensions.Contains(extension);
    }

    public static async Task<string> SaveImage(IFormFile file, string folder, string urlPrefix)
    {
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

        var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName).ToLowerInvariant();
        var path = Path.Combine(folder, fileName);

        using var stream = new FileStream(path, FileMode.Create);
        await file.CopyToAsync(stream);

        return urlPrefix.TrimEnd('/') + "/" + fileName;
    }

    public static void DeleteFile(string webRootPath, string? url)
    {
        if (string.IsNullOrWhiteSpace(url) || url.StartsWith("http")) return;

        var path = Path.Combine(webRootPath, url.TrimStart('/'));
        if (File.Exists(path)) File.Delete(path);
    }
}
