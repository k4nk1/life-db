import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemText, Box } from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const Layout = () => {
  const location = useLocation();

  const menuItems = [
    { text: 'ホーム', path: '/' },
    { text: 'デイリー', path: '/daily' },
    { text: 'やること', path: '/tasks' },
    { text: '事実＆思考', path: '/facts' },
    { text: 'やらないこと', path: '/donts' },
    { text: '文書管理', path: '/documents' },
    { text: '資産', path: '/assets' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            LifeDB
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} to={item.path} selected={location.pathname.startsWith(item.path)}>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
