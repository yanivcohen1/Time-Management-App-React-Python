import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Typography, Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useAdmin } from '../../context/AdminContext';
import api from '../../api/axios';

interface User {
  _id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Todo {
  _id: string;
  title: string;
  status: string;
  due_date: string;
}

const AdminConsolePage: React.FC = () => {
  const { id, consoleId } = useParams<{ id: string; consoleId: string }>();
  const [searchParams] = useSearchParams();
  const { isAdminSwitchOn, toggleAdminSwitch, setSelectedUserName } = useAdmin();
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [todos, setTodos] = useState<Todo[]>([]);

  const name = searchParams.get('name');
  const last = searchParams.get('last');

  useEffect(() => {
    // Fetch users
    api.get('/auth/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
      
    return () => setSelectedUserName(null);
  }, [setSelectedUserName]);

  useEffect(() => {
    if (selectedUserId) {
      api.get('/todos', { params: { user_id: selectedUserId } })
        .then(res => setTodos(res.data.items))
        .catch(err => console.error(err));
    }
  }, [selectedUserId]);

  const handleUserChange = (event: SelectChangeEvent) => {
    const newUserId = event.target.value;
    setSelectedUserId(newUserId);
    setTodos([]);
    
    const user = users.find(u => u._id === newUserId);
    setSelectedUserName(user ? user.full_name : null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Console Page
      </Typography>
      <Typography variant="h6">
        Admin ID: {id}
      </Typography>
      <Typography variant="h6">
        Console ID: {consoleId}
      </Typography>
      <Typography variant="body1">
        Params: name={name}, last={last}
      </Typography>
      
      <Box sx={{ my: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isAdminSwitchOn}
              onChange={toggleAdminSwitch}
              name="adminConsoleSwitch"
            />
          }
          label="Admin Console Switch (Synced)"
        />
      </Box>
      
      <FormControl fullWidth sx={{ mb: 3, mt: 3 }}>
        <InputLabel id="user-select-label">Select User</InputLabel>
        <Select
          labelId="user-select-label"
          value={selectedUserId}
          label="Select User"
          onChange={handleUserChange}
        >
          {users.map(user => (
            <MenuItem key={user._id} value={user._id}>
              {user.full_name} ({user.email})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedUserId && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todos.map((todo) => (
                <TableRow key={todo._id}>
                  <TableCell>{todo.title}</TableCell>
                  <TableCell>
                    <Chip label={todo.status} size="small" />
                  </TableCell>
                  <TableCell>{todo.due_date ? new Date(todo.due_date).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
              {todos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">No todos found for this user</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminConsolePage;
