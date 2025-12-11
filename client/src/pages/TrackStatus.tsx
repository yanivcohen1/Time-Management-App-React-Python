import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, TextField, MenuItem, Select, FormControl, InputLabel, IconButton,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, TableSortLabel,
  Chip, useTheme
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../api/axios';
import CreateTodoModal from '../components/CreateTodoModal';
import { useSnackbar } from 'notistack';

interface Todo {
  _id: string;
  title: string;
  description?: string;
  status: string;
  due_date: string;
  duration?: string;
}

const TrackStatus: React.FC = () => {
  const theme = useTheme();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [orderBy, setOrderBy] = useState<string>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'BACKLOG': return theme.palette.grey[500];
      case 'PENDING': return theme.palette.warning.main;
      case 'IN_PROGRESS': return theme.palette.info.main;
      case 'COMPLETED': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const fetchTodos = useCallback(async () => {
    const params: Record<string, unknown> = {
      page: page + 1,
      size: rowsPerPage,
      search: search,
      status: statusFilter || undefined,
      sort_by: orderBy,
      sort_desc: order === 'desc',
    };
    if (startDate) {
        params.due_date_start = startDate.toISOString();
    }
    if (endDate) {
        params.due_date_end = endDate.toISOString();
    }

    try {
      const res = await api.get('/todos/', { params });
      setTodos(res.data.items);
      setTotal(res.data.total);
    } catch (error) {
      console.error(error);
    }
  }, [page, rowsPerPage, search, statusFilter, startDate, endDate, orderBy, order]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodos();

    const handleTodoCreated = () => {
      fetchTodos();
    };

    window.addEventListener('todo-created', handleTodoCreated);
    return () => {
      window.removeEventListener('todo-created', handleTodoCreated);
    };
  }, [fetchTodos]);

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleEditClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (todo: Todo) => {
    setTodoToDelete(todo);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (todoToDelete) {
      try {
        await api.delete(`/todos/${todoToDelete._id}`);
        enqueueSnackbar('Todo deleted successfully', { variant: 'success' });
        fetchTodos();
      } catch (error) {
        console.error(error);
        enqueueSnackbar('Failed to delete todo', { variant: 'error' });
      }
    }
    setDeleteDialogOpen(false);
    setTodoToDelete(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Track Status</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField 
          label="Search by Name" 
          variant="outlined" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            <MenuItem value="BACKLOG">Backlog</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slotProps={{ textField: { size: 'small' } }}
          />
        </LocalizationProvider>
        {(startDate || endDate) && (
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={() => { setStartDate(null); setEndDate(null); }}
            size="small"
            sx={{ height: 40 }}
          >
            Clear Dates
          </Button>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleRequestSort('title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'due_date'}
                  direction={orderBy === 'due_date' ? order : 'asc'}
                  onClick={() => handleRequestSort('due_date')}
                >
                  Due Date
                </TableSortLabel>
              </TableCell>
              <TableCell>Duration (hours)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {todos.map((todo) => (
              <TableRow 
                key={todo._id}
                sx={{ 
                  '&:nth-of-type(odd)': { 
                    backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'action.hover' 
                  } 
                }}
              >
                <TableCell>{todo.title}</TableCell>
                <TableCell>
                  <Chip 
                    label={todo.status.replace('_', ' ')} 
                    size="small"
                    sx={{ 
                      bgcolor: getBadgeColor(todo.status),
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                </TableCell>
                <TableCell>{todo.due_date ? todo.due_date.split('T')[0] : '-'}</TableCell>
                <TableCell>{todo.duration || '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => handleEditClick(todo)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteClick(todo)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
      
      <CreateTodoModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTodo(null);
        }}
        onSave={fetchTodos}
        todo={selectedTodo}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{todoToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrackStatus;
