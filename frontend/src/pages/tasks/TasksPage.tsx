import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TasksPage = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        やること
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="tasks tabs">
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
