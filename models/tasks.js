const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    minlength: [3, 'Task title cannot be less than 3 characters']
  },
  description: {
    type: String,
  },
  completed: {
    type: Boolean,
    default: false
  },

  priority: {
    type: String,
    enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority level.'
    },
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

taskSchema.pre('save', function(next) {
  if (this.title) {
    this.title = this.title.trim();
  }
});

module.exports = mongoose.model('Task', taskSchema);
