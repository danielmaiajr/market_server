const express = require('express');
const passport = require('passport');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/orders', passport.authenticate('jwt', { session: false }), (req, res) => {
	let { body, connection } = req;

	const insert = {
		customer_id: req.user.id,
		ship_date: `2020-05-${body.ship_date}`,
		order_status_id: 6,
		payment_method_id: 1,
		neightborhood: body.address.neightborhood,
		street: body.address.street,
		num: body.address.num,
		cep: body.address.cep
	};

	const my_query = 'INSERT INTO `order` SET ?';

	connection.beginTransaction(function(err) {
		if (err) return res.status(400).json(err);

		connection.query(my_query, insert, function(error, results, fields) {
			if (error) {
				return connection.rollback(function() {
					return res.status(400).json(error.sqlMessage);
				});
			}
			const new_query =
				'INSERT INTO order_item ' +
				'SELECT ? , ci.product_id, p.price , ci.quantity ' +
				'FROM cart_item ci INNER JOIN product p ' +
				'ON ci.product_id = p.product_id ' +
				'WHERE customer_id = ?;';
			connection.query(new_query, [ results.insertId, body.customer_id ], function(error, results, fields) {
				if (error) {
					return connection.rollback(function() {
						return res.status(400).json(error.sqlMessage);
					});
				}
				connection.commit(function(err) {
					if (err) {
						return connection.rollback(() => {
							return res.status(400).json(err);
						});
					}
					return res.json(results);
				});
			});
		});
	});
});

//RECRIAR A ORDEM UTILIZANDO O ID
router.post('/orders/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { connection } = req;
	const customer_id = req.user.id;
	const order_id = req.params.id;

	const my_query = 'DELETE from cart_item WHERE customer_id = ?';

	connection.beginTransaction((err) => {
		if (err) return res.status(400).json(err);

		connection.query(my_query, [ customer_id ], (error, results, fields) => {
			if (error) return connection.rollback(() => res.status(400).json(error.sqlMessage));

			const new_query =
				'INSERT INTO cart_item SELECT ? as customer_id, product_id, quantity FROM order_item WHERE order_id = ?';

			connection.query(new_query, [ customer_id, order_id ], function(error, results, fields) {
				if (error) return connection.rollback(() => res.status(400).json(error.sqlMessage));

				connection.commit((err) => {
					if (err) return connection.rollback(() => res.status(400).json(err));

					return res.json({ order: 'Ordem Adicionada ao carrinho' });
				});
			});
		});
	});
});

router.get('/orders', passport.authenticate('jwt', { session: false }), (req, res) => {
	const customer_id = req.user.id;
	const colunms = [
		'o.order_id',
		'pm.payment_name',
		'os.status_name',
		'o.cep',
		'o.neightborhood',
		'o.street',
		'o.num',
		'o.ship_date'
	];

	const my_query =
		'SELECT ?? FROM `order` o ' +
		'JOIN payment_method pm ON pm.payment_method_id = o.payment_method_id ' +
		'JOIN order_status os ON os.order_status_id = o.order_status_id ' +
		'WHERE o.customer_id = ?';

	req.connection.query(my_query, [ colunms, customer_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

router.get('/orders/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
	const order_id = req.params.id;
	const customer_id = req.user.id;
	const my_query =
		'select ? as customer_id, p.product_id, p.product_name, p.image_url, oi.price, oi.quantity, (oi.price*oi.quantity) as total from product p inner join order_item oi on p.product_id=oi.product_id and oi.order_id=? where p.product_id in (select product_id from order_item where order_id =(select order_id from `order` where order_id = ? and customer_id = ?));';

	req.connection.query(my_query, [ customer_id, order_id, order_id, customer_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

//DANGEROUS - NEEDS CHECK
//O CLIENTE CANCELA A ORDEM
router.put('/orders/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
	const customer_id = req.user.id;
	const order_id = req.params.id;
	const my_query = 'UPDATE `order` SET order_status_id=5 WHERE order_id = ? AND customer_id = ?';

	req.connection.query(my_query, [ order_id, customer_id ], (error, results, fields) => {
		if (error) return res.status(400).json(error.sqlMessage);
		if (results.changedRows === 1) {
			nodemailer.createTestAccount((err, account) => {
				if (err) {
					console.error('Failed to create a testing account. ' + err.message);
					return process.exit(1);
				}

				console.log('Credentials obtained, sending message...');

				// Create a SMTP transporter object
				let transporter = nodemailer.createTransport({
					host: account.smtp.host,
					port: account.smtp.port,
					secure: account.smtp.secure,
					auth: {
						user: account.user,
						pass: account.pass
					}
				});

				// Message object
				let message = {
					from: 'Sender Name <sender@example.com>',
					to: 'Recipient <recipient@example.com>',
					subject: 'Nodemailer is unicode friendly ✔',
					text: 'Hello to myself!',
					html: `<p><b>Ordem Cancelada</b></p>`
				};

				transporter.sendMail(message, (err, info) => {
					if (err) {
						console.log('Error occurred. ' + err.message);
						return process.exit(1);
					}

					console.log('Message sent: %s', info.messageId);
					// Preview only available when sending through an Ethereal account
					console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

					return res.json({ order: 'success' });
				});
			});
		} else {
			return res.json({ order: 'Não foi cancelada' });
		}
	});
});

//ADMIN ONLY - DANGEROURS
/* router.put('/orders/:id', (req, res) => {
	const payment_method_id = req.params.id;
	const { body } = req;
	const my_query = 'UPDATE payment_method SET ? WHERE payment_method_id = ?';

	req.connection.query(my_query, [ body, payment_method_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
}); */

//IT´S DANGEROURS TO USE THIS !!!
/* router.delete('/orders/:id', (req, res) => {
	const payment_method_id = req.params.id;

	const my_query = 'DELETE FROM payment_method WHERE payment_method_id = ?';

	req.connection.query(my_query, [ payment_method_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
}); */

module.exports = router;

//PEDIDO RECEBIDO
//AGUARDANDO CONFIRMAÇÂO
//AGUARDANDO ENTREGA
//ENTREGUE

//CANCELADO
