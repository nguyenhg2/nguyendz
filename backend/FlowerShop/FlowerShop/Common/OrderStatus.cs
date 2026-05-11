namespace FlowerShop.Common;

public static class OrderStatus
{
    public const string Pending = "Chờ xử lý";
    public const string Confirmed = "Đã xác nhận";
    public const string Shipping = "Đang giao";
    public const string Completed = "Hoàn thành";
    public const string Cancelled = "Đã hủy";

    public static readonly string[] CompletedValues = ["Completed", Completed];

    public static string Normalize(string? status)
    {
        return status?.Trim() switch
        {
            "Pending" or "Cho xu ly" or "Chờ xử lý" => Pending,
            "Confirmed" or "Đã xác nhận" => Confirmed,
            "Shipping" or "Đang giao" => Shipping,
            "Completed" or "Hoàn thành" => Completed,
            "Cancelled" or "Đã hủy" => Cancelled,
            _ => Pending
        };
    }

    public static bool IsCancelled(string? status)
    {
        return Normalize(status) == Cancelled;
    }

    public static bool IsCompleted(string? status)
    {
        return Normalize(status) == Completed;
    }
}
