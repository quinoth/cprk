import { alpha } from '@mui/material/styles';
import { gray } from '../themePrimitives';

export const feedbackCustomizations = {
  MuiDialog: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiDialog-paper': {
          borderRadius: '10px',
          border: '1px solid',
          borderColor: theme.palette.divider,
        },
      }),
    },
  },
};