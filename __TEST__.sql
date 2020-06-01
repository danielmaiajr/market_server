
SELECT p.product_id, p.product_name, p.image_url, o.price, o.quantity FROM order_item o 
	INNER JOIN product p ON o.product_id = p.product_id 
	WHERE order_id = 20;

-- Seleciona os itens que estão na order do cliente
select p.product_id, p.product_name, p.image_url, oi.price, oi.quantity, (oi.price*oi.quantity) as total 
from product p inner join order_item oi on p.product_id=oi.product_id and oi.order_id=23 
where p.product_id in (
	select product_id 
	from order_item 
	where order_id =(
		select order_id 
		from `order` 
		where order_id = 23 and customer_id = 4));

