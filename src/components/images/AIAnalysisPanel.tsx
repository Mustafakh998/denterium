import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Eye, Brain, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AIAnalysisPanelProps {
  imageUrl: string;
  imageType: string;
  onAnalysisComplete?: (results: any) => void;
}

interface AnalysisResults {
  success: boolean;
  analysisId: string;
  timestamp: string;
  confidence: number;
  findings: any;
  measurements?: any;
  recommendations?: string[];
  urgency?: 'low' | 'medium' | 'high';
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  imageUrl,
  imageType,
  onAnalysisComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      let data, error;
      try {
        const response = await supabase.functions.invoke('analyze-xray', {
          body: {
            imageUrl,
            imageType,
            analysisType: 'comprehensive'
          }
        });
        data = response.data;
        error = response.error;
      } catch (invokeError) {
        console.error('Function invoke error:', invokeError);
        error = invokeError;
      }

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (error) throw error;
      if (!data || data.success === false) {
        throw new Error((data as any)?.details || 'Analysis failed');
      }

      setAnalysisResults(data as any);
      onAnalysisComplete?.(data);
      
      toast.success('AI analysis completed successfully!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI X-ray Analysis
          </CardTitle>
          {analysisResults && (
            <Badge variant={getUrgencyColor(analysisResults.urgency)}>
              {analysisResults.urgency?.toUpperCase()} PRIORITY
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!analysisResults ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Advanced AI analysis for diagnostic insights
              </p>
              <Button 
                onClick={startAnalysis} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Start AI Analysis
                  </>
                )}
              </Button>
            </div>
            
            {isAnalyzing && (
              <div className="space-y-2">
                <Progress value={analysisProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  {analysisProgress < 30 && "Preprocessing image..."}
                  {analysisProgress >= 30 && analysisProgress < 60 && "Detecting structures..."}
                  {analysisProgress >= 60 && analysisProgress < 90 && "Analyzing findings..."}
                  {analysisProgress >= 90 && "Generating report..."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="findings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="findings">Findings</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="findings" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analysis Confidence</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getConfidenceColor(analysisResults.confidence)}`} />
                  <span className="text-sm">{(analysisResults.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              {imageType === 'xray' && analysisResults.findings && (
                <div className="space-y-4">
                  {/* Teeth Detection */}
                  {analysisResults.findings.teeth && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Teeth Detection</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {analysisResults.findings.teeth.detected?.length || 0} teeth detected
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Cavities */}
                  {analysisResults.findings.cavities && analysisResults.findings.cavities.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          Cavities Detected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysisResults.findings.cavities.map((cavity: any, index: number) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">Tooth #{cavity.tooth}</span>
                              <span className="text-muted-foreground"> - {cavity.severity} {cavity.location}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {(cavity.confidence * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Bone Loss */}
                  {analysisResults.findings.boneLoss?.present && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Bone Loss Detected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          <span className="font-medium">Severity:</span> {analysisResults.findings.boneLoss.severity}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Areas:</span> {analysisResults.findings.boneLoss.areas}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Anomalies */}
                  {analysisResults.findings.anomalies && analysisResults.findings.anomalies.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Anomalies</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysisResults.findings.anomalies.map((anomaly: any, index: number) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{anomaly.type}</span>
                              <span className="text-muted-foreground"> - {anomaly.location}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="measurements" className="space-y-4">
              {analysisResults.measurements && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Measurements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysisResults.measurements.crownToRoot && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Crown Height:</span>
                            <span>{analysisResults.measurements.crownToRoot.crownHeight?.toFixed(1)}mm</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Root Length:</span>
                            <span>{analysisResults.measurements.crownToRoot.rootLength?.toFixed(1)}mm</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Bone Density:</span>
                        <span>{(analysisResults.measurements.boneDensity * 100).toFixed(1)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {analysisResults.recommendations && (
                <div className="space-y-2">
                  {analysisResults.recommendations.map((rec: string, index: number) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <p className="text-sm">{rec}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {analysisResults && (
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={startAnalysis} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-analyze
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};