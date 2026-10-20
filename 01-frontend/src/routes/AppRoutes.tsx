import { Routes, Route, Navigate } from 'react-router-dom';
import Diagram from '../features/diagram';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/diagramaLindsay" replace />} />
      <Route path="/diagramaLindsay" element={<Diagram />} />
      {/* Redirección por defecto ante rutas desconocidas */}
      <Route path="*" element={<Navigate to="/diagramaLindsay" replace />} />
    </Routes>
  );
}
