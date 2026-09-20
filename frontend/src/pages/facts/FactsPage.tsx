import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FactsPage = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        事実＆思考
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="facts tabs">
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
