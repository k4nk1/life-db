import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DailyPage from './pages/daily/DailyPage';
import TasksPage from './pages/tasks/TasksPage';
import FactsPage from './pages/facts/FactsPage';
import DontsPage from './pages/donts/DontsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div>ホーム（未実装）</div>} />
          <Route path="daily" element={<DailyPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="facts" element={<FactsPage />} />
          <Route path="donts" element={<DontsPage />} />
          <Route path="documents" element={<div>文書管理（未実装）</div>} />
          <Route path="assets" element={<div>資産（未実装）</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
