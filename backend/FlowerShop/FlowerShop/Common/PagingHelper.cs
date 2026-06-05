using Microsoft.EntityFrameworkCore;

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

        public static async Task<object> PageAsync<T>(IQueryable<T> query, int page, int limit,
            int defaultLimit = 10, int maxLimit = 100)
        {
            (page, limit) = Normalize(page, limit, defaultLimit, maxLimit);

            var total = await query.CountAsync();
            var items = await query
                .Skip(Skip(page, limit))
                .Take(limit)
                .ToListAsync();

            return Result(total, items, page, limit);
        }
    }
}
