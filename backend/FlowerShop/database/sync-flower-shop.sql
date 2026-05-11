UPDATE Orders
SET Status = CASE
    WHEN Status IN ('Pending', 'Cho xu ly', N'Chờ xử lý') THEN N'Chờ xử lý'
    WHEN Status IN ('Confirmed', N'Đã xác nhận') THEN N'Đã xác nhận'
    WHEN Status IN ('Shipping', N'Đang giao') THEN N'Đang giao'
    WHEN Status IN ('Completed', N'Hoàn thành') THEN N'Hoàn thành'
    WHEN Status IN ('Cancelled', N'Đã hủy') THEN N'Đã hủy'
    ELSE N'Chờ xử lý'
END;

UPDATE Orders
SET PaymentMethod = CASE
    WHEN LOWER(LTRIM(RTRIM(PaymentMethod))) = 'cod' THEN 'cod'
    ELSE 'transfer'
END
WHERE PaymentMethod IS NOT NULL;

UPDATE Products
SET Price = 0
WHERE Price < 0;

UPDATE Products
SET DiscountPrice = NULL
WHERE DiscountPrice IS NOT NULL AND (DiscountPrice < 0 OR DiscountPrice > Price);

UPDATE Products
SET StockQuantity = 0
WHERE StockQuantity IS NOT NULL AND StockQuantity < 0;

UPDATE Products
SET SoldQuantity = 0
WHERE SoldQuantity IS NOT NULL AND SoldQuantity < 0;

UPDATE Reviews
SET Rating = CASE
    WHEN Rating < 1 THEN 1
    WHEN Rating > 5 THEN 5
    ELSE Rating
END
WHERE Rating IS NOT NULL AND (Rating < 1 OR Rating > 5);

UPDATE OrderDetails
SET Quantity = 1
WHERE Quantity <= 0;

UPDATE OrderDetails
SET UnitPrice = 0
WHERE UnitPrice < 0;

UPDATE OrderDetails
SET Subtotal = UnitPrice * Quantity
WHERE Subtotal IS NULL OR Subtotal < 0;

DECLARE @defaultName sysname;

SELECT @defaultName = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.default_object_id = dc.object_id
JOIN sys.tables t ON t.object_id = c.object_id
WHERE t.name = 'Orders' AND c.name = 'Status';

IF @defaultName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Orders DROP CONSTRAINT ' + QUOTENAME(@defaultName));
END;

ALTER TABLE Orders
ADD CONSTRAINT DF_Orders_Status DEFAULT N'Chờ xử lý' FOR Status;

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_Orders_Status'
)
BEGIN
    ALTER TABLE Orders
    ADD CONSTRAINT CK_Orders_Status
    CHECK (Status IN (N'Chờ xử lý', N'Đã xác nhận', N'Đang giao', N'Hoàn thành', N'Đã hủy'));
END;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Products_Price')
BEGIN
    ALTER TABLE Products
    ADD CONSTRAINT CK_Products_Price
    CHECK (Price >= 0 AND (DiscountPrice IS NULL OR DiscountPrice >= 0 AND DiscountPrice <= Price));
END;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Products_Stock')
BEGIN
    ALTER TABLE Products
    ADD CONSTRAINT CK_Products_Stock
    CHECK ((StockQuantity IS NULL OR StockQuantity >= 0) AND (SoldQuantity IS NULL OR SoldQuantity >= 0));
END;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Reviews_Rating')
BEGIN
    ALTER TABLE Reviews
    ADD CONSTRAINT CK_Reviews_Rating
    CHECK (Rating BETWEEN 1 AND 5);
END;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_OrderDetails_Quantity')
BEGIN
    ALTER TABLE OrderDetails
    ADD CONSTRAINT CK_OrderDetails_Quantity
    CHECK (Quantity > 0 AND UnitPrice >= 0 AND (Subtotal IS NULL OR Subtotal >= 0));
END;
