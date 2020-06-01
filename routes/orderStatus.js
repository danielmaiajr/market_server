const express = require('express');
const router = express.Router();

router.post('/order-status', (req, res) => {
	const { body } = req;
	const my_query = 'INSERT INTO order_status SET ?';

	req.connection.query(my_query, [ body ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

router.get('/order-status', (req, res) => {
	const my_query = 'SELECT order_status_id, status_name FROM order_status';

	req.connection.query(my_query, (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

router.put('/order-status/:id', (req, res) => {
	const order_status_id = req.params.id;
	const { body } = req;

	const my_query = 'UPDATE order_status SET ? WHERE order_status_id = ?';

	req.connection.query(my_query, [ body, order_status_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

//IT´S DANGEROUS TO USE THIS !!!
router.delete('/order-status/:id', (req, res) => {
	const order_status_id = req.params.id;

	const my_query = 'DELETE FROM order_status WHERE order_status_id = ?';

	req.connection.query(my_query, [ order_status_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

module.exports = router;
