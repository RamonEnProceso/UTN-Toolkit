import { Routes, Route } from 'react-router-dom';
import Diagram from '../features/diagram';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Diagram />} />
      <Route path="/diagramaLindsay" element={<Diagram />} />
      {/* Futuras rutas para otros tipos de diagramas */}
    </Routes>
  );
}
