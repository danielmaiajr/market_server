const express = require('express');
const router = express.Router();
const passport = require('passport');

router.post('/addresses', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { neightborhood, street, num, cep } = req.body;
	const data = {
		neightborhood,
		street,
		num,
		cep,
		customer_id: req.user.id
	};
	const my_query = 'INSERT INTO address SET ?';

	req.connection.query(my_query, [ data ], (error, results, fields) => {
		if (error) return res.status(400).json(error.sqlMessage);
		return res.json({ id_inserted: results.insertId });
	});
});

router.get('/addresses', passport.authenticate('jwt', { session: false }), (req, res) => {
	const colunms = [ 'address_id', 'neightborhood', 'street', 'num', 'cep' ];
	const customer_id = req.user.id;

	const my_query = 'SELECT ?? FROM address WHERE customer_id= ?;';

	req.connection.query(my_query, [ colunms, customer_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

router.get('/addresses/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
	const address_id = req.params.id;
	const colunms = [ 'address_id', 'neightborhood', 'street', 'num', 'cep' ];
	const customer_id = req.user.id;

	const my_query = 'SELECT ?? FROM address WHERE customer_id= ? AND address_id = ?;';

	req.connection.query(my_query, [ colunms, customer_id, address_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

router.put('/addresses/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
	const address_id = req.params.id;
	const { body } = req;
	const customer_id = req.user.id;

	console.log(body);
	const my_query = 'UPDATE address SET ? WHERE customer_id= ? AND address_id= ? ';

	req.connection.query(my_query, [ body, customer_id, address_id ], (error, results, fields) => {
		if (error) return res.status(400).json(error.sqlMessage);
		return res.json(results);
	});
});

router.delete('/addresses/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
	const address_id = req.params.id;
	const customer_id = req.user.id;

	const my_query = 'DELETE FROM address WHERE customer_id= ? AND address_id= ? ';

	req.connection.query(my_query, [ customer_id, address_id ], (error, results, fields) => {
		if (error) return res.status(400).json(error.sqlMessage);
		return res.json({ id_removed: address_id });
	});
});

module.exports = router;
