const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let db = null
const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server Running At http://localhost/3000/')
    })
  } catch (e) {
    console.log(`Error Occured:${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//Returns a list of all todos whose status is 'TO DO'
const haspriorityandstatusproperties = requestquery => {
  return (
    requestquery.priority !== undefined && requestquery.status !== undefined
  )
}
const haspriorityproperty = requestquery => {
  return requestquery.priority !== undefined
}
const hasstatusproperty = requestquery => {
  return requestquery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let gettodoquery = ''
  const {search_q = '', status, priority} = request.query
  switch (true) {
    case haspriorityandstatusproperties(request.query):
      gettodoquery = `
    SELECT * FROM TODO
  WHERE
  todo LIKE '%${search_q}%' AND
   status = '${status}' AND
  priority ='${priority}'
  ;
  `
      break
    case haspriorityproperty(request.query):
      gettodoquery = `
  SELECT * FROM TODO
  WHERE 
   todo LIKE '%${search_q}%' AND
  priority = '${priority}'
 ;
  `
      break
    case hasstatusproperty(request.query):
      gettodoquery = `
  SELECT * FROM TODO

  WHERE 
  todo LIKE '%${search_q}%'
  AND status = '${status}'
  ;
  `
      break
    default:
      gettodoquery = `
  SELECT * FROM TODO
  WHERE
  todo LIKE '%${search_q}%';
  `
  }
  const statusArray = await db.all(gettodoquery)
  response.send(statusArray)
})

//Returns a specific todo based on the todo ID
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const sqlquery = `
  SELECT * FROM TODO
  WHERE id=${todoId};
  `
  const todo = await db.get(sqlquery)
  response.send(todo)
})

//Create a todo in the todo table
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const sqlquery = `
  INSERT INTO TODO(ID,TODO,PRIORITY,STATUS)
  VALUES(${id},'${todo}','${priority}','${status}');
  `
  await db.run(sqlquery)
  response.send('Todo Successfully Added')
})

//API 4
app.put('/todos/:todoId/', async (request, response) => {
  const requestBody = request.body
  let update = ''
  switch (true) {
    case requestBody.status !== undefined:
      update = 'Status'
      break
    case requestBody.priority !== undefined:
      update = 'Priority'
      break
    case requestBody.todo !== undefined:
      update = 'Todo'
      break
  }
  const {todoId} = request.params
  const previousTodoQuery = `
  SELECT * FROM todo WHERE id=${todoId};

  `
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body
  const sqlquery = `
  UPDATE TODO 
  SET
  todo='${todo}',
  priority='${priority}',
  status='${status}'
  WHERE id=${todoId}
  `
  await db.run(sqlquery)
  response.send(`${update} Updated`)
})

//Deletes a todo from the todo table based on the todo ID

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const sqlquery = `
  DELETE FROM TODO
  WHERE id= ${todoId};
  `
  await db.run(sqlquery)
  response.send('Todo Deleted')
})
module.exports = app
