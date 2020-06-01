const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const nodemailer = require('nodemailer');

//THIS ROUTE NEED
//CHECK USER INPUT - MAYBE CHECK WITH A VALIDATION MIDDLEWARE
//ERROR CHECKING - MAYBE A CENTRAL MIDDLEWARE
//AUTH METHOD:
//JWT WITH LOCAL STORAGE, NEED PROTECTION FOR JS CLIENT SIDE
//SESSIONS WITH COOKIES, NEED PROTECTION FOR CSRF

//THIS ROUTE IS USING JWT WITH LOCAL STORAGE AND PASSPORTJS

router.post('/customers', (req, res) => {
	const { email, password, first_name, last_name, phone, cpf } = req.body;
	let my_query = 'SELECT email FROM customer WHERE email = ?';

	req.connection.query(my_query, [ email ], async (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		if (results.length > 0) return res.status(400).json({ register: 'Email já cadastrado' });

		// Encriptar a senha
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(password, salt);

		user = {
			email,
			pass_word: hash,
			first_name
		};

		my_query = 'INSERT INTO customer SET ?';
		req.connection.query(my_query, [ user ], (error, results, fields) => {
			if (error) return console.log(error);

			const payload = {
				id: results.insertId
			};

			// Gerar o token para o usuario
			jwt.sign(payload, 'SECRET', { expiresIn: '7d' }, (err, token) => {
				if (err) console.log(err);

				//Enviar token por email
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
						html: `<p><b>Token</b> ${token}</p>`
					};

					transporter.sendMail(message, (err, info) => {
						if (err) {
							console.log('Error occurred. ' + err.message);
							return process.exit(1);
						}

						console.log('Message sent: %s', info.messageId);
						// Preview only available when sending through an Ethereal account
						console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

						return res.json({ customer: 'Conta criada', token: 'Verifique o email para ativar a conta' });
					});
				});
			});
		});
	});
});

//-------------------------------------------------------------------------------------------------------------

router.post('/customers/login', (req, res) => {
	const { email, password } = req.body;

	let my_query = 'SELECT customer_id, email, pass_word, first_name, active FROM customer WHERE email = ?';
	req.connection.query(my_query, [ email ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		if (results.length == 0) return res.status(400).json({ login: 'Usuario ou senha incorreta' });

		if (!results[0].active) return res.status(400).json({ login: 'Usuario não está ativado' });

		const { customer_id, email, pass_word, first_name } = results[0];
		bcrypt.compare(password, pass_word, (err, result) => {
			if (!result) return res.status(400).json({ login: 'Usuario ou senha incorreta' });

			const payload = {
				id: customer_id,
				email: email,
				name: first_name
			};

			// Gerar o token para o usuario
			jwt.sign(payload, 'SECRET', { expiresIn: '7d' }, (err, token) => {
				if (err) console.log(err);
				//Enviar token
				return res.json({ success: true, token: 'Bearer ' + token });
			});
		});
	});
});

//-----------------------------------------------------------------------------------------------------------------

router.get('/customers', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { id } = req.user;
	const my_query =
		'SELECT first_name, last_name, email, phone, cpf, sex, birth_date FROM customer WHERE customer_id = ?';

	req.connection.query(my_query, [ id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
});

router.put('/customers', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { id } = req.user;
	const { body } = req;

	const my_query = 'UPDATE customer SET ? WHERE customer_id = ?';
	req.connection.query(my_query, [ body, id ], (error, results, fields) => {
		if (error) return res.status(400).json(error.sqlMessage);
		return res.json(results);
	});
});

/* 
ROTA DA API: PUT - /customer/change-password
TIPO DA ROTA: CLIENT

DADOS NECESSÁRIOS
	BODY: password, new_password
 */

router.put('/customers/change-password', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { connection } = req;
	const customer_id = req.user.id;
	const { password, new_password } = req.body;

	//PEGANDO A SENHA NO BANCO DE DADOS
	const my_query = 'SELECT pass_word FROM customer WHERE customer_id = ?';
	connection.query(my_query, [ customer_id ], async (error, results, fields) => {
		if (error) return res.status(400).json(error.sqlMessage);

		//VERIFICANDO A SENHA COM O BCRYPT
		const { pass_word } = results[0];

		const result = await bcrypt.compare(password, pass_word);
		if (!result) return res.status(400).json({ senha: 'Senha incorreta' });

		//GERANDO UM NOVO HASH PARA A NOVA SENHA
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(new_password, salt);

		//ATUALIZANDO A SENHA NO BANCO DE DADOS
		const new_query = 'UPDATE customer SET pass_word = ? WHERE customer_id';
		connection.query(new_query, [ hash, customer_id ], function(error, results, fields) {
			if (error) return res.status(400).json(error.sqlMessage);

			//RETORNANDO A MENSAGEM DE SUCESSO
			return res.json({ senha: 'Senha alterada com sucesso' });
		});
	});
});

router.get('/customers/forget-password', (req, res) => {
	const { connection } = req;
	const { email } = req.body;

	const my_query = 'SELECT email FROM customer WHERE email= ?';
	connection.query(my_query, email, function(error, results, fields) {
		if (error) return res.status(400).json(error.sqlMessage);
		if (results.length === 0) return res.status(400).json({ customer: 'Conta não encontrada' });

		payload = {
			email: email
		};

		jwt.sign(payload, 'SECRET', { expiresIn: '1d' }, (err, token) => {
			if (err) console.log(err);

			//Enviar token por email
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
					html: `<p><b>Password Token</b> ${token}</p>`
				};

				transporter.sendMail(message, (err, info) => {
					if (err) {
						console.log('Error occurred. ' + err.message);
						return process.exit(1);
					}

					console.log('Message sent: %s', info.messageId);
					// Preview only available when sending through an Ethereal account
					console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

					return res.json({ password_token: 'token enviado com sucesso' });
				});
			});
		});
	});
});

router.post('/customers/forget-password/:token', (req, res) => {
	const { connection } = req;
	const token = req.params.token;
	const password = req.body.new_password;

	jwt.verify(token, 'SECRET', async (err, decode) => {
		if (err) return res.status(400).json({ token: 'Token Inválido' });
		const email = decode.email;

		//BCRIPT NÂO FUNCIONA QUANDO NÂO TEM ARGUMENTO PASSWORD
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(password, salt);

		console.log('test');
		const my_query = 'UPDATE customer SET pass_word = ? WHERE email = ?';
		connection.query(my_query, [ hash, email ], (error, results, fields) => {
			if (error) return res.status(400).json(error.sqlMessage);

			//RETORNANDO A MENSAGEM DE SUCESSO
			return res.json({ password: 'Senha trocada com sucesso' });
		});
	});
});

router.get('/customers/activate/token', (req, res) => {
	const { connection } = req;
	const email = req.body.email;

	const my_query = 'SELECT customer_id, active FROM customer WHERE email = ?';
	connection.query(my_query, [ email ], (error, results, fields) => {
		if (error) return res.status(400).json(error.sqlMessage);
		console.log(results);

		if (results[0].active) return res.json({ customer: 'Conta já está ativada' });

		const payload = {
			id: results[0].customer_id
		};

		// Gerar o token para o usuario
		jwt.sign(payload, 'SECRET', { expiresIn: 1000 * 60 * 10 }, (err, token) => {
			if (err) console.log(err);
			//Enviar token
			return res.json({ token: token });
		});
	});
});

router.put('/customers/activate/:token', (req, res) => {
	const { connection } = req;
	const { token } = req.params;

	jwt.verify(token, 'SECRET', (err, decode) => {
		if (err) return res.status(400).json({ token: 'Token Inválido' });
		const customer_id = decode.id;

		const my_query = 'UPDATE customer SET active = true WHERE customer_id = ?';
		connection.query(my_query, [ customer_id ], (error, results, fields) => {
			if (error) return res.status(400).json(error.sqlMessage);

			//RETORNANDO A MENSAGEM DE SUCESSO
			return res.json({ customer: 'Conta ativada com sucesso' });
		});
	});
});

//THIS ROUTE CAN NOT BE USED BECAUSE OF CONSEQUENCES TO ANOTHER TABLE
/* router.delete('/customers/:id', (req, res) => {
	const id = req.params.id;
	const my_query = 'DELETE FROM customer WHERE customer_id = ?';

	req.connection.query(my_query, [ id ], (error, results, fields) => {
		if (error) return res.json(error.sqlMessage);
		return res.json(results);
	});
}); */

module.exports = router;
