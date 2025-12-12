import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import api from '../api/axios';
import { useSnackbar } from 'notistack';

interface Todo {
  _id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  duration?: string;
}

interface CreateTodoModalProps {
  open: boolean;
  onClose: () => void;
  onTodoCreated?: () => void; // Renamed to onSave for clarity? No, keep for backward compat or add onSave
  onSave?: () => void;
  todo?: Todo | null;
}

const CreateTodoModal: React.FC<CreateTodoModalProps> = ({ open, onClose, onTodoCreated, onSave, todo }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState('BACKLOG');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (open) {
      if (todo) {
        setTitle(todo.title);
        setDescription(todo.description || '');
        setDuration(todo.duration || '');
        setStatus(todo.status);
        if (todo.due_date) {
          const [y, m, d] = todo.due_date.split('T')[0].split('-').map(Number);
          setDueDate(new Date(y, m - 1, d));
        } else {
          setDueDate(null);
        }
      } else {
        setTitle('');
        setDescription('');
        setDuration('');
        setStatus('BACKLOG');
        setDueDate(null);
      }
    }
  }, [open, todo]);

  const handleSubmit = async () => {
    try {
      if (todo) {
        await api.put(`/todos/${todo._id}`, {
          title,
          description,
          duration,
          status,
          due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null
        });
        enqueueSnackbar('Todo updated successfully', { variant: 'success' });
      } else {
        await api.post('/todos/', {
          title,
          description,
          duration,
          status,
          due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null
        });
        enqueueSnackbar('Todo created successfully', { variant: 'success' });
      }
      
      if (onSave) onSave();
      if (onTodoCreated) onTodoCreated();
      handleClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDuration('');
    setStatus('BACKLOG');
    setDueDate(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{todo ? 'Edit Todo' : 'Create New Todo'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Title"
          name="title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Description"
          name="description"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Duration"
          name="duration"
          fullWidth
          variant="outlined"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="BACKLOG">Backlog</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={(newValue) => setDueDate(newValue)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">{todo ? 'Save' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTodoModal;
