var telegram = require('./client_telegram.js')
var datastore = require('./client_datastore.js')

exports.eseneBOT = (req, res) => {
  if (req.body.message) {
    const { message } = req.body
    if (message.chat.type == 'group' || message.chat.type == 'supergroup') {
      var target = message.text.split(" ")
      console.log(target)
      if (target[0].toLowerCase().indexOf('/add') == 0) {
        target.shift()
        var link = target.pop()
        if (link.toLowerCase().indexOf('github') >= 0) {
          telegram.addTask(target.join(" "), link, message)
        }
      } else if (target[0].toLowerCase().indexOf('/list') == 0) {
        telegram.listTask(message, 'update')
      } else if (target[0].toLowerCase().indexOf('/revert') == 0) {
        telegram.listTask(message, 'revert')
      }
    } else {
      //Should be in private mode
    }
  } else {
    const { callback_query } = req.body;
    console.log(callback_query)
    var target = callback_query.data.split(" ")
    if (target[0].toLowerCase() == 'update' || target[0].toLowerCase() == 'revert') {
      telegram.updateTask(target[1], callback_query, target[0].toLowerCase())
    }
  }

  return res.end('OK');
};
