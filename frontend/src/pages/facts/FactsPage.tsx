import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, useTheme, useMediaQuery } from '@mui/material';
import ListTab from './ListTab';
import TagsTab from './TagsTab';

function CustomTabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`facts-tabpanel-${index}`}
      aria-labelledby={`facts-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: { xs: 0.75, sm: 1.5 }, px: 0 }}>{children}</Box>}
    </div>
  );
}

const FactsPage = () => {
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
          mb: { xs: 0.5, sm: 1.5 },
        }}
      >
        事実＆思考
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="facts tabs"
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minWidth: 0,
              px: { xs: 1, sm: 2 },
              py: 0.5,
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              minHeight: 36,
            },
          }}
        >
          <Tab label="一覧" />
          <Tab label="タグ" />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <ListTab />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <TagsTab />
      </CustomTabPanel>
    </Box>
  );
};

export default FactsPage;
