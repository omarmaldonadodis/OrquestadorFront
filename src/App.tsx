import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OrchestratorTerminal from './pages/OrchestratorTerminal';
import OrchestratorAdmin from './pages/OrchestratorAdmin';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/ops/orchestrator" replace />} />
                <Route path="/ops/orchestrator" element={<OrchestratorTerminal />} />
                <Route path="/ops/orchestrator/admin" element={<OrchestratorAdmin />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
