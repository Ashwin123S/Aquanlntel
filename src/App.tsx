import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DataManagementView } from './components/DataManagementView';
import { PreprocessingView } from './components/PreprocessingView';
import { ConsumptionAnalysisView } from './components/ConsumptionAnalysisView';
import { StatisticalAnalysisView } from './components/StatisticalAnalysisView';
import { PredictionView } from './components/PredictionView';
import { ClassificationView } from './components/ClassificationView';
import { AnomalyDetectionView } from './components/AnomalyDetectionView';
import { VisualizationsView } from './components/VisualizationsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';

import { WaterRecord, PreprocessedRecord, UserProfile } from './types';
import { generateSampleDataset } from './data/sampleData';
import { preprocessDataset, DEFAULT_PREPROCESSING_CONFIG } from './services/dataProcessor';
import { detectWaterAnomalies } from './services/anomalyDetector';
import { generateRecommendations } from './services/recommendationEngine';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // User State
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    name: 'Dr. A. Sharma',
    email: 'a.sharma@aquaintel.gov.in',
    role: 'Water Engineer',
    token: 'jwt_seed_token',
  });

  // Raw dataset state
  const [rawRecords, setRawRecords] = useState<WaterRecord[]>(() => {
    return generateSampleDataset();
  });

  // Preprocessed records state
  const [processedRecords, setProcessedRecords] = useState<PreprocessedRecord[]>(() => {
    const initial = generateSampleDataset();
    return preprocessDataset(initial, DEFAULT_PREPROCESSING_CONFIG).processed;
  });

  // Anomaly state
  const anomalies = useMemo(() => {
    return detectWaterAnomalies(processedRecords, 20);
  }, [processedRecords]);

  // Recommendations state
  const recommendations = useMemo(() => {
    return generateRecommendations(processedRecords, anomalies);
  }, [processedRecords, anomalies]);

  const handleUploadDataset = (newRawRecords: WaterRecord[], filename: string) => {
    setRawRecords(newRawRecords);
    const { processed } = preprocessDataset(newRawRecords, DEFAULT_PREPROCESSING_CONFIG);
    setProcessedRecords(processed);
  };

  const handleResetToDefault = () => {
    const baseline = generateSampleDataset();
    setRawRecords(baseline);
    const { processed } = preprocessDataset(baseline, DEFAULT_PREPROCESSING_CONFIG);
    setProcessedRecords(processed);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-50 font-sans antialiased overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        anomalyCount={anomalies.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          recordCount={processedRecords.length}
          anomalyCount={anomalies.length}
          user={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onResetData={handleResetToDefault}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'dashboard' && (
            <DashboardView
              records={processedRecords}
              anomalies={anomalies}
              recommendations={recommendations}
              selectedZone={selectedZone}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'data' && (
            <DataManagementView
              records={rawRecords}
              onUploadDataset={handleUploadDataset}
              onResetToDefault={handleResetToDefault}
            />
          )}

          {activeTab === 'preprocessing' && (
            <PreprocessingView
              rawRecords={rawRecords}
              onApplyProcessed={(newProcessed) => setProcessedRecords(newProcessed)}
            />
          )}

          {activeTab === 'analysis' && (
            <ConsumptionAnalysisView
              records={processedRecords}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
            />
          )}

          {activeTab === 'statistics' && (
            <StatisticalAnalysisView
              records={processedRecords}
            />
          )}

          {activeTab === 'prediction' && (
            <PredictionView
              records={processedRecords}
            />
          )}

          {activeTab === 'classification' && (
            <ClassificationView
              records={processedRecords}
            />
          )}

          {activeTab === 'anomaly' && (
            <AnomalyDetectionView
              records={processedRecords}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
            />
          )}

          {activeTab === 'visualizations' && (
            <VisualizationsView
              records={processedRecords}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              records={processedRecords}
              anomalies={anomalies}
              recommendations={recommendations}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUpdateUser={setCurrentUser}
      />
    </div>
  );
}

export default App;
