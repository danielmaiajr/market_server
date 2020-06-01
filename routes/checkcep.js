const express = require('express');
const router = express.Router();
const buscaCep = require('busca-cep');

router.get('/checkcep/:cep', (req, res) => {
	const cep = req.params.cep;

	buscaCep(cep, { sync: false })
		.then((endereco) => {
			console.log(endereco);
			endereco.bairro === 'Recreio dos Bandeirantes' &&
			endereco.localidade === 'Rio de Janeiro' &&
			endereco.uf === 'RJ'
				? res.json({ cep: 'Atendemos na sua localidade' })
				: res.status(404).json({ cep: 'Não atendemos na sua localidade' });
		})
		.catch((erro) => {
			return res.status(400).json({ cep: 'Cep Invalido' });
		});
});
module.exports = router;
