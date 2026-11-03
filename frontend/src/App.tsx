import React, { useState, useEffect } from 'react';
import { AnalyticsOverview } from './types';
import { fetchAnalytics, fetchHealth } from './services/api';
import { Navbar } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { ShipmentsDirectoryView } from './components/ShipmentsDirectoryView';
import { ShipmentDetailModal } from './components/ShipmentDetailModal';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { ModelPerformanceView } from './components/ModelPerformanceView';
import { DataProvenanceView } from './components/DataProvenanceView';
import { PredictorSandboxView } from './components/PredictorSandboxView';
import { ShieldCheck, Database, Cpu, Activity } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [systemHealth, setSystemHealth] = useState('HEALTHY');
  const [directoryFilter, setDirectoryFilter] = useState<any>(null);

  useEffect(() => {
    // Initial data fetch
    fetchAnalytics()
      .then(res => setAnalytics(res))
      .catch(err => console.error('Error fetching analytics:', err));

    fetchHealth()
      .then(res => setSystemHealth(res.status))
      .catch(() => setSystemHealth('OFFLINE'));
  }, []);

  const handleNavigateToShipments = (filter?: any) => {
    if (filter) {
      setDirectoryFilter(filter);
    }
    setActiveTab('shipments');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        systemHealth={systemHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewView
            analytics={analytics}
            onNavigateToShipments={handleNavigateToShipments}
            onSelectShipment={(id) => setSelectedShipmentId(id)}
          />
        )}

        {activeTab === 'shipments' && (
          <ShipmentsDirectoryView
            initialFilter={directoryFilter}
            onSelectShipment={(id) => setSelectedShipmentId(id)}
          />
        )}

        {activeTab === 'models' && <ModelPerformanceView />}

        {activeTab === 'provenance' && <DataProvenanceView />}

        {activeTab === 'sandbox' && <PredictorSandboxView />}
      </main>

      {/* Shipment Detail Drawer/Modal */}
      {selectedShipmentId && (
        <ShipmentDetailModal
          shipmentId={selectedShipmentId}
          onClose={() => setSelectedShipmentId(null)}
        />
      )}

      {/* Grounded RAG Chatbot Drawer */}
      <ChatbotDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSelectShipment={(id) => {
          setSelectedShipmentId(id);
          setIsChatOpen(false);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070a12] py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">TrustTrace AI</span>
            <span>&bull; Smart Supply Chain Verification</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Model A (Delay) &bull; Model B (Cold-Chain)</span>
            <span>&bull;</span>
            <span>EVM Cryptographic Anchor</span>
            <span>&bull;</span>
            <span>16,000 Usable Records</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
