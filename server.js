const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

const filePath = path.join(__dirname, 'data/tasks.json');
const logFile = path.join(__dirname, 'logs/server.log');

// ---------- Helpers (file-backed storage) ----------
const readTasks = () => {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

const writeTasks = (tasks) => {
  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
};

app.use(express.json());

// ==================== LOGGER MIDDLEWARE ====================
app.use((req, res, next) => {
  const time = new Date().toISOString();
  const log = `${time} | ${req.method} | ${req.originalUrl} | IP: ${req.ip}\n`;

  console.log(log.trim());

  fs.appendFile(logFile, log, (err) => {
    if (err) console.error(err);
  });

  next();
});
// ==================== END LOGGER MIDDLEWARE ====================


// ==================== CONTENT-TYPE MIDDLEWARE ====================
app.use((req, res, next) => {
  if (
    (req.method === 'POST' || req.method === 'PUT') &&
    !req.is('application/json')
  ) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Content-Type must be application/json'
    });
  }

  next();
});
// ==================== END CONTENT-TYPE MIDDLEWARE ====================


// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));


// ==================== GET /tasks ====================
app.get('/tasks', (req, res, next) => {
  try {
    const tasks = readTasks();
    res.json({
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
});
// ==================== END GET /tasks ====================


// ==================== POST /tasks ====================
app.post('/tasks', (req, res, next) => {
  try {
    const { title, completed } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Field "title" is required and must be a non-empty string.'
      });
    }

    const tasks = readTasks();

    const newTask = {
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      title: title.trim(),
      completed: typeof completed === 'boolean' ? completed : false
    };

    tasks.push(newTask);
    writeTasks(tasks);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask
    });
  } catch (err) {
    next(err);
  }
});
// ==================== END POST /tasks ====================


// ==================== VALIDATE TASK ID (used by PUT/DELETE) ====================
const validateTaskId = (req, res, next) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid Task ID'
    });
  }

  next();
};
// ==================== END VALIDATE TASK ID ====================


// ==================== PUT /tasks/:id ====================
app.put('/tasks/:id', validateTaskId, (req, res, next) => {
  try {
    const { title, completed } = req.body;
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));

    if (taskIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with id ${req.params.id} not found.`
      });
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Field "title" must be a non-empty string.'
        });
      }
      tasks[taskIndex].title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Field "completed" must be a boolean.'
        });
      }
      tasks[taskIndex].completed = completed;
    }

    writeTasks(tasks);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: tasks[taskIndex]
    });
  } catch (err) {
    next(err);
  }
});
// ==================== END PUT /tasks/:id ====================


// ==================== DELETE /tasks/:id ====================
app.delete('/tasks/:id', validateTaskId, (req, res, next) => {
  try {
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));

    if (taskIndex === -1) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with id ${req.params.id} not found.`
      });
    }

    const deleted = tasks.splice(taskIndex, 1)[0];
    writeTasks(tasks);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: deleted
    });
  } catch (err) {
    next(err);
  }
});
// ==================== END DELETE /tasks/:id ====================


// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'Route Not Found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});
// ==================== END 404 HANDLER ====================


// ==================== GLOBAL ERROR HANDLER (must stay last) ====================
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: 'Something Went Wrong'
  });
});
// ==================== END GLOBAL ERROR HANDLER ====================


app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
