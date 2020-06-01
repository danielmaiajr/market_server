const express = require('express');
const router = express.Router();

router.post('/payments', (req, res) => {
	const { body } = req;
	const my_query = 'INSERT INTO payment_method SET ?';

	req.connection.query(my_query, [ body ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

router.get('/payments', (req, res) => {
	const my_query = 'SELECT payment_method_id, payment_name FROM payment_method';

	req.connection.query(my_query, (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

router.put('/payments/:id', (req, res) => {
	const payment_method_id = req.params.id;
	const { body } = req;

	const my_query = 'UPDATE payment_method SET ? WHERE payment_method_id = ?';

	req.connection.query(my_query, [ body, payment_method_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

//IT´S DANGEROUS TO USE THIS !!!
router.delete('/payments/:id', (req, res) => {
	const payment_method_id = req.params.id;

	const my_query = 'DELETE FROM payment_method WHERE payment_method_id = ?';

	req.connection.query(my_query, [ payment_method_id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

module.exports = router;
