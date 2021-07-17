const express = require('express');
const passport = require('passport');
const router = express.Router();

/* 
RECEBER ID PELO RESQUEST (APENAS UM ITEM POR VEZ)
INICIAR A TRANSACTION
VERIFICAR SE O ITEM EXISTE NA DATABASE
SE ELE EXSTIR PARA O USUARIO - ATUALIZAR A QUANTIDADE
COMMIT
SE ELE NÃO EXISTER PARA O USUARIO - INSERIR O ITEM COM A QUANTIDADE
COMMIT
*/

/*@params: product_id
*/
router.put('/cart-items/add', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { product_id } = req.body;
	const customer_id = req.user.id;
	const { connection } = req;

	console.log(req.body);

	let my_query = 'SELECT quantity FROM cart_item WHERE customer_id = ? AND product_id= ?';

	connection.beginTransaction((err) => {
		if (err) return res.status(500).json(err);

		connection.query(my_query, [ customer_id, product_id ], (error, results, fields) => {
			if (error) return connection.rollback(() => res.status(500).json(err));

			if (results.length === 0) {
				my_query = 'INSERT INTO cart_item(customer_id, product_id, quantity) VALUES (?, ?, 1)';

				connection.query(my_query, [ customer_id, product_id ], (error, results, fields) => {
					if (error) return connection.rollback(() => res.status(500).json(err));

					connection.commit((err) => {
						if (error) return connection.rollback(() => res.status(500).json(err));

						return res.json({ quantity: 1 });
					});
				});
			} else {
				const quantity = results[0].quantity + 1;
				my_query = 'UPDATE cart_item SET quantity=? WHERE customer_id=? AND product_id=?';

				connection.query(my_query, [ quantity, customer_id, product_id ], (error, results, fields) => {
					if (error) return connection.rollback(() => res.status(500).json(err));

					connection.commit((err) => {
						if (error) return connection.rollback(() => res.status(500).json(err));

						return res.json({ quantity: quantity });
					});
				});
			}
		});
	});
});

/* 
RECEBER ID PELO RESQUEST (APENAS UM ITEM POR VEZ)
INICIAR A TRANSACTION
VERIFICAR SE O ITEM EXISTE NA DATABASE
SE ELE EXSTIR E FOR MAIOR QUE 1 - DIMINUIR A QUANTIDADE
COMMIT
SE ELE EXISTIR E FOR IGUAL A 1 - DELETA A QUANTIDADE
*/

router.put('/cart-items/sub', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { product_id } = req.body;
	const customer_id = req.user.id;
	const { connection } = req;
	let my_query = 'SELECT quantity FROM cart_item WHERE customer_id = ? AND product_id= ?';

	connection.beginTransaction((err) => {
		if (err) return res.status(500).json(err);

		connection.query(my_query, [ customer_id, product_id ], (error, results, fields) => {
			if (error) return connection.rollback(() => res.status(500).json(err));

			if (results.length === 0) return res.status(500).json({ erro: 'Produto não existe no carrinho' });

			if (results.length > 0 && results[0].quantity > 1) {
				const quantity = results[0].quantity - 1;
				my_query = 'UPDATE cart_item SET quantity=? WHERE customer_id=? AND product_id=?';

				connection.query(my_query, [ quantity, customer_id, product_id ], (error, results, fields) => {
					if (error) return connection.rollback(() => res.status(500).json(err));

					connection.commit((err) => {
						if (error) return connection.rollback(() => res.status(500).json(err));

						return res.json({ quantity: quantity });
					});
				});
			}
			if (results.length > 0 && results[0].quantity === 1) {
				my_query = 'DELETE FROM cart_item WHERE customer_id=? AND product_id=?';

				connection.query(my_query, [ customer_id, product_id ], (error, results, fields) => {
					if (error) return connection.rollback(() => res.status(500).json(err));

					connection.commit((err) => {
						if (error) return connection.rollback(() => res.status(500).json(err));

						return res.json({ quantity: 0 });
					});
				});
			}
		});
	});
});

/* 
RETORNA OS ITENS DO CART_ITEM
*/

router.get('/cart-items', passport.authenticate('jwt', { session: false }), (req, res) => {
	const colunms = [ 'ci.product_id', 'p.product_name', 'p.image_url', 'ci.quantity', 'p.price' ];
	const customer_id = req.user.id;
	const my_query =
		'SELECT ?? ' +
		'FROM cart_item ci INNER JOIN product p ' +
		'ON ci.product_id = p.product_id ' +
		'WHERE customer_id = ?;';

	req.connection.query(my_query, [ colunms, customer_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

//IT'S DANGEROURS - USED TO CLEAN THE CART
router.delete('/cart-items', passport.authenticate('jwt', { session: false }), (req, res) => {
	const customer_id = req.user.id;

	const my_query = 'DELETE FROM cart_item WHERE customer_id = ?';

	req.connection.query(my_query, [ customer_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

module.exports = router;
