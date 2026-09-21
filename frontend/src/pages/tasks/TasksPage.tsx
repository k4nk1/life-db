import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, useTheme, useMediaQuery } from '@mui/material';
import ListTab from './ListTab';
import RecurringTab from './RecurringTab';
import HistoryTab from './HistoryTab';

function CustomTabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tasks-tabpanel-${index}`}
      aria-labelledby={`tasks-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: { xs: 1, sm: 3 }, px: 0 }}>{children}</Box>}
    </div>
  );
}

const TasksPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant={isMobile ? 'h6' : 'h4'}
        sx={{
          fontWeight: 'bold',
          fontSize: { xs: '1.1rem', sm: '2.125rem' },
          mb: { xs: 0.5, sm: 2 },
        }}
      >
        やること
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="tasks tabs"
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minWidth: 0,
              px: { xs: 0.5, sm: 2 },
              py: 0.75,
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              minHeight: 40,
            },
          }}
        >
          <Tab label="一覧" />
          <Tab label="繰り返しタスク" />
          <Tab label="完了履歴" />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <ListTab />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <RecurringTab />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <HistoryTab />
      </CustomTabPanel>
    </Box>
  );
};

export default TasksPage;
