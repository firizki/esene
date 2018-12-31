const Datastore = require('@google-cloud/datastore');

const datastore = new Datastore({
  projectId: 'sleepy-project',
  keyFilename: 'credential/cred-datastore.json'
});

function add(task, link, author) {
  datastore
  .insert({
    key: datastore.key(['task']),
    data: {
      task: task,
      author: author,
      state: 0,
      link: link
    }
  })
  .catch(err => {
    console.error('ERROR:', err);
    return;
  });
}

function update(id, state) {
  const key = datastore.key(['task', parseInt(id)]);

  datastore.get(key, (err, entity) => {
    datastore
    .update({
      key: key,
      data: {
        task: entity.task,
        author: entity.author,
        state: state,
        link: entity.link
      }
    })
    .catch(err => {
      console.error('ERROR:', err);
      return;
    });
  });
}

function get() {
  const query = datastore.createQuery('task');
  return datastore.runQuery(query);
}

module.exports = {
  datastore: datastore,
  add: add,
  update: update,
  get: get
}
