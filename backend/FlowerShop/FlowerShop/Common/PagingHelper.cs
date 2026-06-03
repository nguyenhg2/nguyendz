namespace FlowerShop.Common
{
    public static class PagingHelper
    {
        public static (int Page, int Limit) Normalize(int page, int limit, int defaultLimit = 10, int maxLimit = 100)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = defaultLimit;
            if (limit > maxLimit) limit = maxLimit;

            return (page, limit);
        }

        public static int Skip(int page, int limit)
        {
            return (page - 1) * limit;
        }

        public static object Result<T>(int total, IEnumerable<T> items, int page, int limit)
        {
            return new
            {
                total,
                totalPages = (int)Math.Ceiling((double)total / limit),
                items
            };
        }
    }
}
