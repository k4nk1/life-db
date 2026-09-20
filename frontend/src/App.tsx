import { Container, Typography, Box } from '@mui/material'

function App() {
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          LifeDB
        </Typography>
        <Typography variant="body1">
          環境構築が完了しました。
        </Typography>
      </Box>
    </Container>
  )
}

export default App
