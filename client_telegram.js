const https          = require('https')
const datastore      = require('./client_datastore.js')
const creds_telegram = require('./credential/telegram-cred.json')

var options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: '',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}

function stateDecrypt(state){
  switch (state) {
    case 0:
      return 'In Progress ✍️';
      break;
    case 1:
      return 'Code Review 📜';
      break;
    case 2:
      return 'QA Testing 🤔';
      break;
    case 3:
      return 'Ready to Deploy 💡';
      break;
    case 4:
      return 'DONE ✅';
      break;
    default:
      return state
  }
}

function addTask(task, link, message) {
  datastore.add(task, link, message.from.id)
  var postData = JSON.stringify({
    chat_id: message.chat.id,
    reply_to_message_id: message.message_id,
    text: 'Yes Sir!!'
  })
  sendRes(postData, 'sendMessage')
}

function updateTask(idtask, data, mode){
  datastore.datastore.get(datastore.datastore.key(['task', parseInt(idtask)]), (err, entity) => {
    var target_state = entity.state
    if (mode == 'update') {
      target_state += 1
    } else {
      target_state -= 1
    }
    if (target_state < 0 || target_state > 4) {
      target_state = entity.state
    }
    datastore.update(idtask, target_state)
    var postData = JSON.stringify({
      callback_query_id: data.id
    })
    var initializePromise = sendRes(postData, 'answerCallbackQuery')
    initializePromise.then(function(result) {
      postData = JSON.stringify({
        chat_id: data.message.chat.id,
        message_id: data.message.message_id
      })
      var promiseDelete = sendRes(postData, 'deleteMessage')
      promiseDelete.then(function(result) {
        var prLink = '<a href=\"' + entity.link + '\">' + entity.task + '</a>';
        prLink = prLink + ' as ' + ' <b>' + stateDecrypt(target_state) + '</b>\r\n'
        postData = JSON.stringify({
          chat_id: data.message.chat.id,
          parse_mode: "HTML",
          text: '@'+ data.from.username + ' ' + mode + ' ' + prLink
        })
        sendRes(postData, 'sendMessage')
      })
    })
  });
}

function listTask(data, mode){
  console.log(creds_telegram);
  var postData = {
    chat_id: data.chat.id,
    reply_to_message_id: data.message_id,
    text: '',
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: []
    }
  }

  var result = datastore.get()
  result
  .then(results => {
    const tasks = results[0];
    console.log(tasks[0][datastore.datastore.KEY].id);
    var row = -1;

    for (var i = 0; i < tasks.length; i++) {
      var prLink = '<a href=\"' + tasks[i].link + '\">' + tasks[i].task + '</a>';
      var development = (i+1) + '. ' + prLink + ' <b>' + stateDecrypt(tasks[i].state) + '</b>\r\n'

      postData.text += development

      if (i%4 == 0) {
        row += 1
        postData.reply_markup.inline_keyboard.push([])
      }

      postData.reply_markup.inline_keyboard[row].push({
        text: i+1,
        callback_data: mode + ' ' + tasks[i][datastore.datastore.KEY].id,
      })
    }

    sendRes(JSON.stringify(postData), 'sendMessage')
  })
  .catch(err => {
    console.error('ERROR:', err);
  });

}


function sendRes(postData, method) {
  return new Promise(function(resolve, reject) {
    options.headers['Content-Length'] = Buffer.byteLength(postData);
    options.path = '/bot'+creds_telegram+'/'+method
    const request = https.request(options, (respond) => {
      resolve(respond);
    })

    request.on('error', (e) => {
      reject(e);
    });

    request.write(postData);
    request.end();
  });
}

module.exports = {
  addTask: addTask,
  updateTask: updateTask,
  listTask: listTask
}
