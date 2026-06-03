namespace FlowerShop.Controllers.Admin
{
    public static class AdminOrderStatus
    {
        public const string Pending = "Chờ xử lý";
        public const string Confirmed = "Đã xác nhận";
        public const string Shipping = "Đang giao";
        public const string Completed = "Hoàn thành";
        public const string Cancelled = "Đã hủy";

        private static readonly HashSet<string> ValidStatuses = new()
        {
            Pending,
            Confirmed,
            Shipping,
            Completed,
            Cancelled
        };

        private static readonly Dictionary<string, string> StatusAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Pending"] = Pending,
            ["Confirmed"] = Confirmed,
            ["Shipping"] = Shipping,
            ["Completed"] = Completed,
            ["Cancelled"] = Cancelled,
            [Pending] = Pending,
            [Confirmed] = Confirmed,
            [Shipping] = Shipping,
            [Completed] = Completed,
            [Cancelled] = Cancelled
        };

        public static string Normalize(string? status)
        {
            if (string.IsNullOrWhiteSpace(status)) return "";

            var value = status.Trim();
            return StatusAliases.TryGetValue(value, out var normalized) ? normalized : value;
        }

        public static bool IsValid(string? status)
        {
            return ValidStatuses.Contains(Normalize(status));
        }
    }
}
