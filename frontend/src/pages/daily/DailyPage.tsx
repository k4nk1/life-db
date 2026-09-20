import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import RecordTab from './RecordTab';
import StatsTab from './StatsTab';
import TypesTab from './TypesTab';

function CustomTabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`daily-tabpanel-${index}`}
      aria-labelledby={`daily-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DailyPage = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>デイリー</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="daily tabs">
          <Tab label="記録" />
          <Tab label="統計" />
          <Tab label="タイプ" />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <RecordTab />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <StatsTab />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <TypesTab />
      </CustomTabPanel>
    </Box>
  );
};

export default DailyPage;
