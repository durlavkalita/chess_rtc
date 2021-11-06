var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
  res.render('landing');
});
// router.get('/', (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });

router.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});
module.exports = router;