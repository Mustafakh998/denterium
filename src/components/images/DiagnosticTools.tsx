import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Ruler, 
  Target, 
  Contrast, 
  Activity, 
  Search,
  Crosshair,
  Calculator
} from 'lucide-react';

interface DiagnosticToolsProps {
  onToolSelect: (tool: string, config?: any) => void;
  activeTool?: string;
}

export const DiagnosticTools: React.FC<DiagnosticToolsProps> = ({
  onToolSelect,
  activeTool
}) => {
  const [measurementMode, setMeasurementMode] = useState<'distance' | 'angle' | 'area'>('distance');
  const [calibrationValue, setCalibrationValue] = useState('10');
  const [analysisRegion, setAnalysisRegion] = useState({ x: 0, y: 0, width: 100, height: 100 });

  const diagnosticTools = [
    {
      id: 'measure',
      name: 'Measurement',
      icon: Ruler,
      description: 'Measure distances, angles, and areas'
    },
    {
      id: 'roi',
      name: 'Region of Interest',
      icon: Target,
      description: 'Define regions for detailed analysis'
    },
    {
      id: 'enhancement',
      name: 'Image Enhancement',
      icon: Contrast,
      description: 'Enhance image quality for better diagnosis'
    },
    {
      id: 'histogram',
      name: 'Histogram Analysis',
      icon: Activity,
      description: 'Analyze pixel intensity distribution'
    },
    {
      id: 'magnify',
      name: 'Magnification',
      icon: Search,
      description: 'Magnify specific areas for detailed examination'
    },
    {
      id: 'crosshair',
      name: 'Crosshair',
      icon: Crosshair,
      description: 'Precise point marking and alignment'
    }
  ];

  const handleToolSelect = (toolId: string) => {
    let config = {};
    
    if (toolId === 'measure') {
      config = { mode: measurementMode, calibration: parseFloat(calibrationValue) };
    } else if (toolId === 'roi') {
      config = { region: analysisRegion };
    } else if (toolId === 'enhancement') {
      config = { preset: 'general' };
    }
    
    onToolSelect(toolId, config);
  };

  const handleEnhancementPreset = (preset: string) => {
    onToolSelect('enhancement', { preset });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Diagnostic Tools
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {diagnosticTools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "outline"}
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={() => handleToolSelect(tool.id)}
                >
                  <tool.icon className="w-5 h-5" />
                  <div className="text-center">
                    <div className="text-xs font-medium">{tool.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* Measurement Settings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Measurement Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Measurement Type</Label>
                  <div className="flex gap-1 mt-1">
                    {['distance', 'angle', 'area'].map((mode) => (
                      <Button
                        key={mode}
                        variant={measurementMode === mode ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => setMeasurementMode(mode as any)}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs">Calibration (mm/pixel)</Label>
                  <Input
                    type="number"
                    value={calibrationValue}
                    onChange={(e) => setCalibrationValue(e.target.value)}
                    className="mt-1 h-8"
                    step="0.1"
                    min="0.1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enhancement Settings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Enhancement Presets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleEnhancementPreset('bone')}
                  >
                    Bone Enhancement
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleEnhancementPreset('soft_tissue')}
                  >
                    Soft Tissue
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleEnhancementPreset('dental')}
                  >
                    Dental Focus
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleEnhancementPreset('contrast')}
                  >
                    High Contrast
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Region */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Analysis Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Label className="text-xs">X Position</Label>
                    <Input
                      type="number"
                      value={analysisRegion.x}
                      onChange={(e) => setAnalysisRegion(prev => ({
                        ...prev,
                        x: parseInt(e.target.value) || 0
                      }))}
                      className="mt-1 h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y Position</Label>
                    <Input
                      type="number"
                      value={analysisRegion.y}
                      onChange={(e) => setAnalysisRegion(prev => ({
                        ...prev,
                        y: parseInt(e.target.value) || 0
                      }))}
                      className="mt-1 h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={analysisRegion.width}
                      onChange={(e) => setAnalysisRegion(prev => ({
                        ...prev,
                        width: parseInt(e.target.value) || 100
                      }))}
                      className="mt-1 h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={analysisRegion.height}
                      onChange={(e) => setAnalysisRegion(prev => ({
                        ...prev,
                        height: parseInt(e.target.value) || 100
                      }))}
                      className="mt-1 h-7"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};