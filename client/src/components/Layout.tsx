import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, 
  IconButton, Box, useMediaQuery, useTheme, Divider, ListItemButton, Tooltip
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard, ListAlt, ViewKanban, Logout, Add, Brightness4, Brightness7, CheckCircleOutline 
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';
import LoadingBar from 'react-top-loading-bar';
import { useSnackbar } from 'notistack';
import { setupInterceptors } from '../api/axios';
import CreateTodoModal from './CreateTodoModal';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const theme = useTheme();
  const { toggleColorMode } = useColorMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    setupInterceptors(setProgress, enqueueSnackbar, logout);
  }, [enqueueSnackbar, logout]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Main Board', icon: <Dashboard />, path: '/' },
    { text: 'Track status', icon: <ListAlt />, path: '/track' },
    { text: 'Agile Board', icon: <ViewKanban />, path: '/agile' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Todo App
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
           <ListItemButton 
             onClick={() => setCreateModalOpen(true)}
             sx={{
               '&:hover': {
                 backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : undefined,
               },
             }}
           >
            <ListItemIcon><Add /></ListItemIcon>
            <ListItemText primary="Create New" />
           </ListItemButton>
        </ListItem>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              sx={{
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : undefined,
                },
                '&.Mui-selected': {
                  backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(25, 118, 210, 0.25)' : 'rgba(144, 202, 249, 0.16)',
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(25, 118, 210, 0.35)' : 'rgba(144, 202, 249, 0.24)',
                  }
                }
              }}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <LoadingBar color="#ff0000" progress={progress} onLoaderFinished={() => setProgress(0)} />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <CheckCircleOutline sx={{ color: theme.palette.mode === 'light' ? 'black' : '#2196f3', mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Agile Tasks
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mr: 2, my: 2, borderColor: 'rgba(255, 255, 255, 0.3)' }} />
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.full_name} ({user?.role})
          </Typography>

          <Tooltip title="Toggle light/dark theme">
            <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton sx={{ ml: 1 }} onClick={logout} color="inherit">
              <Logout />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              zIndex: isMobile ? 1300 : 'auto' // High z-index for mobile overlay
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      <CreateTodoModal 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        onTodoCreated={() => {
            // Ideally trigger a refresh in the active view, but for now just close
        }}
      />
    </Box>
  );
};

export default Layout;
