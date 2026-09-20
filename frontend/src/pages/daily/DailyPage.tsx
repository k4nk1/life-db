import { useState } from 'react';
import type { SyntheticEvent, ReactNode } from 'react';
import { Box, Tabs, Tab, Typography, useTheme, useMediaQuery } from '@mui/material';
import RecordTab from './RecordTab';
import StatsTab from './StatsTab';
import TypesTab from './TypesTab';

function CustomTabPanel(props: { children?: ReactNode; index: number; value: number }) {
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
        <Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 0, sm: 1 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DailyPage = () => {
  const [value, setValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom sx={{ fontWeight: 'bold' }}>
        デイリー
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          aria-label="daily tabs"
        >
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
