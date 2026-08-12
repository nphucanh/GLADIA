import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import { ProjectsProvider } from './context/ProjectsContext';
import { ActiveSectionProvider } from './context/ActiveSectionContext';
import Home from './pages/Home';
import About from './pages/About';
import ProjectsPage from './pages/Projects';
import Amenities from './pages/Amenities';
import Contact from './pages/Contact';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Careers from './pages/Careers';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('nav-open', sidebarOpen);
  }, [sidebarOpen]);

  return (
    <BrowserRouter>
      <ProjectsProvider>
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
              <Route path="/tin-tuc" element={<News />} />
              <Route path="/tin-tuc/:id" element={<NewsDetail />} />
              <Route path="/tien-ich" element={<Amenities />} />
              <Route path="/tuyen-dung" element={<Careers />} />
              <Route path="/lien-he" element={<Contact />} />
            </Routes>
          </div>
        </ActiveSectionProvider>
      </ProjectsProvider>
    </BrowserRouter>
  );
}

