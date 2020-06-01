const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/scheduling', passport.authenticate('jwt', { session: false }), (req, res) => {
	let newDate = new Date();

	const day = newDate.getDate();
	const hour = newDate.getHours();

	let deliveryDate;
	if (hour < 17) {
		deliveryDate = [
			{
				day: day + 1,
				period: 'manhã (8:00 - 11:00)'
			},
			{
				day: day + 1,
				period: 'noite (18:00 - 21:00)'
			}
		];
	} else {
		deliveryDate = [
			{
				day: day + 2,
				period: 'manhã (8:00 - 11:00)'
			},
			{
				day: day + 2,
				period: 'noite (18:00 - 21:00)'
			}
		];
	}
	return res.json(deliveryDate);
});

module.exports = router;

/* 
VAR HORA, DIA

SE DIA = HOJE E HORA < 16
  ENTREGA = [ HOJE + 1 , manha][HOJE + 1 , noite]

SE DIA = HOJE E HORA > 16
  ENTREGA = [HOJE + 2, manha][HOJE + 2, noite]

Retorno ENTREGA
*/
