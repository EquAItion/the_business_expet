
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DownloadManager from '../components/AIdashboard/DownloadManager';
import GenerationStatus from '../components/AIdashboard/GenerationStatus';
import OverviewTab from '../components/AIdashboard/tabs/OverviewTab';
import MarketTab from '../components/AIdashboard/tabs/MarketTab';
import StrategyTab from '../components/AIdashboard/tabs/StrategyTab';
import FinancialsTab from '../components/AIdashboard/tabs/FinancialsTab';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const AIdashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [generationProgress, setGenerationProgress] = useState(100);

  return (
    <>
    <Navbar/>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Business Plan Dashboard</h1>
            <p className="text-gray-500">Access your generated business insights and reports</p>
          </div>
          <div className="mt-4 md:mt-0">
            <DownloadManager />
          </div>
        </div>

        <GenerationStatus generationProgress={generationProgress} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="market">Market Analysis</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 animate-fade-up">
            <OverviewTab />
          </TabsContent>
          
          <TabsContent value="market" className="animate-fade-up">
            <MarketTab />
          </TabsContent>
          
          <TabsContent value="strategy" className="animate-fade-up">
            <StrategyTab />
          </TabsContent>
          
          <TabsContent value="financials" className="animate-fade-up">
            <FinancialsTab />
          </TabsContent>
        </Tabs>
      </div>
      <Footer/>
    </>
  );
};

export default AIdashboard;
