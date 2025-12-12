import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Box, Typography, Paper, Card, CardContent, IconButton, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import api from '../api/axios';
import CreateTodoModal from '../components/CreateTodoModal';

interface Todo {
  _id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  duration?: string;
}

const AgileBoard: React.FC = () => {
  const theme = useTheme();
  const [columns, setColumns] = useState<{ [key: string]: Todo[] }>({
    BACKLOG: [],
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: []
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await api.get('/todos/', { params: { size: 100 } });
      const todos: Todo[] = res.data.items;
      const newColumns: { [key: string]: Todo[] } = {
        BACKLOG: [],
        PENDING: [],
        IN_PROGRESS: [],
        COMPLETED: []
      };
      todos.forEach(todo => {
        if (newColumns[todo.status]) {
          newColumns[todo.status].push(todo);
        } else if (todo.status === 'IN_PROGRESS') {
             // Handle case where backend might return IN_PROGRESS but we want to be safe
             newColumns.IN_PROGRESS.push(todo);
        } else {
            // Fallback for unknown status
             if(!newColumns['BACKLOG']) newColumns['BACKLOG'] = [];
             newColumns['BACKLOG'].push(todo);
        }
      });
      setColumns(newColumns);
    } catch (error) {
      console.error(error);
    }
  }, []);

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

  const handleEditClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setEditModalOpen(true);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = [...columns[source.droppableId]];
      const destColumn = [...columns[destination.droppableId]];
      const [removed] = sourceColumn.splice(source.index, 1);
      const newStatus = destination.droppableId;
      
      destColumn.splice(destination.index, 0, { ...removed, status: newStatus });
      
      setColumns({
        ...columns,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      });

      try {
        await api.put(`/todos/${removed._id}`, { status: newStatus });
      } catch (error) {
        console.error("Failed to update status", error);
        fetchTodos(); // Revert on error
      }
    } else {
      const column = [...columns[source.droppableId]];
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: column
      });
    }
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'BACKLOG': return theme.palette.grey[500];
      case 'PENDING': return theme.palette.warning.main;
      case 'IN_PROGRESS': return theme.palette.info.main;
      case 'COMPLETED': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mr: 1 }}>
          Task Board
        </Typography>
        <Typography variant="body2" color="text.secondary">
          drag&drop
        </Typography>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3, 
          overflowX: { xs: 'hidden', md: 'auto' },
          pb: 2 
        }}>
          {Object.entries(columns).map(([columnId, tasks]) => (
            <Box key={columnId} sx={{ 
              flex: 1,
              minWidth: { xs: '100%', md: 250 },
            }}>
              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f4f5f7',
                  minHeight: { xs: 'auto', md: 500 },
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {columnId.replace('_', ' ')}
                  </Typography>
                  <Box 
                    sx={{ 
                      bgcolor: getBadgeColor(columnId), 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: 24, 
                      height: 24, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {tasks.length}
                  </Box>
                </Box>

                <Droppable droppableId={columnId}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ 
                        minHeight: { xs: 100, md: 400 }, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2 
                      }}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{ 
                                bgcolor: 'background.paper', 
                                color: 'text.primary',
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider',
                                '&:hover': {
                                  bgcolor: 'action.hover'
                                }
                              }}
                            >
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                    {task.title}
                                  </Typography>
                                  <IconButton size="small" sx={{ p: 0.5, mt: -0.5, mr: -0.5 }} onClick={() => handleEditClick(task)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                
                                {task.description && (
                                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {task.description}
                                  </Typography>
                                )}

                                {task.duration && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    Duration: {task.duration}
                                  </Typography>
                                )}

                                {task.due_date && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    Due: {(() => {
                                      const [y, m, d] = task.due_date.split('T')[0].split('-').map(Number);
                                      return format(new Date(y, m - 1, d), 'M/d/yyyy');
                                    })()}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Box>
          ))}
        </Box>
      </DragDropContext>
      <CreateTodoModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTodo(null);
        }}
        onSave={fetchTodos}
        todo={selectedTodo}
      />
    </Box>
  );
};

export default AgileBoard;
