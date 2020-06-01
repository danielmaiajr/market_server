const express = require('express');
const router = express.Router();

router.post('/products', (req, res) => {
	const { body } = req;
	const my_query = 'INSERT INTO product SET  ?';

	req.connection.query(my_query, [ body ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json({ mensage: 'success' });
	});
});

router.get('/products', (req, res) => {
	const colunms = [ 'product_id', 'product_name', 'price', 'image_url', 'section' ];
	const sections = [
		'alimentos',
		'bebidas',
		'casa-e-limpeza',
		'cuidados-com-a-roupa',
		'descartaveis',
		'higiene-e-beleza'
	];

	let my_query = '';
	sections.forEach((section, i) => {
		if (i === 0) {
			my_query = my_query + `(select * from product where section = "${section}" limit 5)`;
		} else {
			my_query = my_query + `union all (select * from product where section = "${section}" limit 5)`;
		}
	});
	req.connection.query(my_query, [ colunms ], (error, results, fields) => {
		if (error) return res.status(500).json(error.sqlMessage);
		return res.json(results);
	});
});

//ROUTE: GET /products/search?value=arroz&page=1
//select * from product WHERE product_name REGEXP '(?=.*feija)' LIMIT 0, 25;

router.get('/products/search', (req, res) => {
	const { value, page } = req.query;

	const limit = (page - 1) * 25;
	let my_query;

	if (page) {
		my_query = `select ?? from product WHERE product_name REGEXP '^(?=.*${value})' LIMIT ${limit}, 25`;
	} else {
		my_query = `select ?? from product WHERE product_name REGEXP '^(?=.*${value})' LIMIT 5`;
	}

	const colunms = [ 'product_id', 'product_name', 'price', 'image_url' ];

	req.connection.query(my_query, [ colunms ], (error, results, fields) => {
		if (error) return res.status(500).json(error.sqlMessage);
		return res.json(results);
	});
});

router.get('/products/:section', (req, res) => {
	const query = req.query;
	const section = req.params.section;
	const limit = (query.page - 1) * 25;

	let my_query;

	if (Object.keys(query).length === 0 && query.constructor === Object) {
		my_query = 'SELECT ?? FROM product WHERE section = ? LIMIT 20';
	} else {
		my_query = `SELECT ?? FROM product WHERE section = ? LIMIT ${limit}, 25`;
	}

	const colunms = [ 'product_id', 'product_name', 'price', 'image_url' ];

	req.connection.query(my_query, [ colunms, section ], (error, results, fields) => {
		if (error) return res.status(500).json(error.sqlMessage);
		return res.json(results);
	});
});

/* router.put('/products/:id', (req, res) => {
	const { id } = req.params;
	const { body } = req;
	const my_query = 'UPDATE product SET ? WHERE product_id = ?';

	req.connection.query(my_query, [ body, id ], (error, results, fields) => {
		if (error) return res.status(500).json(error.sqlMessage);
		return res.json(results);
	});
});

//THIS ROUTE CAN NOT BE USED BECAUSE OF CONSEQUENCES TO ANOTHER TABLE
router.delete('/products/:id', (req, res) => {
	const id = req.params.id;
	const my_query = 'DELETE FROM product WHERE product_id = ?';

	req.connection.query(my_query, [ id ], (error, results, fields) => {
		if (error) return res.status(500).json(error.sqlMessage);
		return res.json(results);
	});
}); */

module.exports = router;

//ROUTE: GET /products/alimentos?search=arroz&page=1
/* 
my_query = my_query + `union all (select * from product where section = "${section}" limit 10)`;
*/
