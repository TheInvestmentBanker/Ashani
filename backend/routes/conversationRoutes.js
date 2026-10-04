const express = require("express");

const {
  create,
  list,
  getOne,
  add,
  rename,
} = require("../controllers/conversationController");

const {
  authenticate,
} = require("../middleware/auth");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| All conversation routes require login
|--------------------------------------------------------------------------
*/

router.use(authenticate);

router.post("/", create);

router.get("/", list);

router.get("/:id", getOne);

router.post("/:id/messages", add);

router.patch("/:id/title", rename);

module.exports = router;