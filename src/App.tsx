import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import { ProjectsProvider } from './context/ProjectsContext';
import { ActiveSectionProvider } from './context/ActiveSectionContext';
import Home from './pages/Home';
import About from './pages/About';
import ProjectsPage from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Contact from './pages/Contact';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Careers from './pages/Careers';

// Trang quản trị: tách khỏi khung website (không header / sidebar / nền động), chỉ tải khi vào /quan-tri
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <BrowserRouter>
      <ProjectsProvider>
        <Routes>
          <Route
            path="/quan-tri/*"
            element={
              <Suspense fallback={null}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route path="*" element={<Site />} />
        </Routes>
      </ProjectsProvider>
    </BrowserRouter>
  );
}

function Site() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('nav-open', sidebarOpen);
  }, [sidebarOpen]);

  return (
    <ActiveSectionProvider>
      <ScrollToTop />
      <div className="bg-scene" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
        <span className="veil" />
      </div>
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gioi-thieu" element={<About />} />
          <Route path="/du-an" element={<ProjectsPage />} />
          <Route path="/du-an/:id" element={<ProjectDetail />} />
          <Route path="/tin-tuc" element={<News />} />
          <Route path="/tin-tuc/:id" element={<NewsDetail />} />
          <Route path="/tuyen-dung" element={<Careers />} />
          <Route path="/lien-he" element={<Contact />} />
        </Routes>
      </div>
    </ActiveSectionProvider>
  );
}
