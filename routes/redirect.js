
const router = require('express-promise-router').default();
const graph = require('../graph.js');
/* GET /message */
// <GetRouteSnippet>
router.get('/',
  async function (req, res) {
      res.render('redirect.ejs');
  }
);
module.exports = router;