import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DailyPage from './pages/daily/DailyPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div>ホーム（未実装）</div>} />
          <Route path="daily" element={<DailyPage />} />
          <Route path="tasks" element={<div>やること（未実装）</div>} />
          <Route path="facts" element={<div>事実＆思考（未実装）</div>} />
          <Route path="donts" element={<div>やらないこと（未実装）</div>} />
          <Route path="documents" element={<div>文書管理（未実装）</div>} />
          <Route path="assets" element={<div>資産（未実装）</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
