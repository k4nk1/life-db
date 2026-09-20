import React, { useState } from 'react';
import { Box, Popover, Tooltip } from '@mui/material';

export const PRESET_COLORS = [
  '#1976d2', // Blue
  '#0288d1', // Light Blue
  '#0097a7', // Cyan
  '#00897b', // Teal
  '#388e3c', // Green
  '#689f38', // Light Green
  '#fbc02d', // Yellow
  '#ffa000', // Amber
  '#f57c00', // Orange
  '#e64a19', // Deep Orange
  '#d32f2f', // Red
  '#c2185b', // Pink
  '#7b1fa2', // Purple
  '#512da8', // Deep Purple
  '#5d4037', // Brown
  '#616161', // Gray
  '#455a64', // Blue Gray
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  size?: number;
}

export const ColorPicker = ({ color, onChange, size = 24 }: ColorPickerProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (selectedColor: string) => {
    onChange(selectedColor);
    handleClose();
  };

  return (
    <>
      <Tooltip title="クリックして色を変更" arrow>
        <Box
          onClick={handleClick}
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            bgcolor: color,
            cursor: 'pointer',
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            flexShrink: 0,
            '&:hover': {
              transform: 'scale(1.15)',
              boxShadow: `0 0 0 2px ${color}`,
            },
          }}
        />
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: { p: 1.5, width: 180 },
          },
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {PRESET_COLORS.map((c) => (
            <Box
              key={c}
              onClick={() => handleSelect(c)}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: c,
                cursor: 'pointer',
                border: c === color ? '2px solid #000' : '1px solid rgba(0,0,0,0.15)',
                transition: 'transform 0.1s',
                '&:hover': {
                  transform: 'scale(1.15)',
                },
              }}
            />
          ))}
        </Box>
      </Popover>
    </>
  );
};

export default ColorPicker;
