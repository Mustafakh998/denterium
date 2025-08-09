import React, { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText, PencilBrush, FabricImage, Line } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { DiagnosticTools } from "./DiagnosticTools";
import { toast } from "sonner";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  RotateCcw,
  Download,
  Save,
  Undo,
  Redo,
  Type,
  Paintbrush,
  Circle as CircleIcon,
  Square,
  Move,
  Ruler,
  Palette,
  Eye,
  Sun,
  Monitor,
  Contrast,
  Zap,
  RefreshCw,
  MousePointer,
  Trash2
} from "lucide-react";

interface MedicalImageEditorProps {
  imageUrl: string;
  imageName?: string;
  onSave?: (editedImageBlob: Blob) => void;
  onClose?: () => void;
}

export default function MedicalImageEditor({ imageUrl, imageName, onSave, onClose }: MedicalImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "text" | "circle" | "rectangle" | "ruler">("select");
  const [activeColor, setActiveColor] = useState("#ff0000");
  const [brushSize, setBrushSize] = useState(3);
  const [fontSize, setFontSize] = useState(20);
  const [zoom, setZoom] = useState(100);
  const [rulerMode, setRulerMode] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<Array<{x: number, y: number}>>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
  
  // Image adjustments
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  
  // History for undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Measurement settings
  const [measurementMode, setMeasurementMode] = useState<'distance' | 'angle' | 'area'>('distance');
  const [calibration, setCalibration] = useState<number>(1); // mm per pixel
  const rulerHandlerRef = useRef<((opt: any) => void) | null>(null);

  // Load image and initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;

    const loadImage = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setOriginalImage(img);
        
        // Calculate canvas size to fit the image
        const maxWidth = 800;
        const maxHeight = 600;
        let canvasWidth = img.width;
        let canvasHeight = img.height;
        
        if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
          const ratio = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);
          canvasWidth = canvasWidth * ratio;
          canvasHeight = canvasHeight * ratio;
        }

        const canvas = new FabricCanvas(canvasRef.current!, {
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: "#ffffff",
        });

        // Add image to canvas as background
        FabricImage.fromURL(img.src)
          .then((fabricImg) => {
            if (fabricImg) {
              fabricImg.set({
                scaleX: canvasWidth / img.width,
                scaleY: canvasHeight / img.height,
                selectable: false,
                evented: false,
              });
              
              canvas.add(fabricImg);
              canvas.sendObjectToBack(fabricImg);
              canvas.renderAll();
              saveToHistory(canvas);
            }
          })
          .catch(() => {
            toast.error("فشل في إضافة الصورة إلى اللوحة");
          });

        // Initialize drawing brush
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = activeColor;
        canvas.freeDrawingBrush.width = brushSize;

        // Event listeners
        canvas.on('object:added', () => saveToHistory(canvas));
        canvas.on('object:modified', () => saveToHistory(canvas));
        canvas.on('object:removed', () => saveToHistory(canvas));

        setFabricCanvas(canvas);
        toast.success("تم تحميل الصورة بنجاح!");
      };
      
      img.onerror = () => {
        toast.error("فشل في تحميل الصورة");
      };
      
    img.src = imageUrl;
    };

    loadImage();

    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [imageUrl]);

  // Handle diagnostic tool selection
  const handleDiagnosticTool = useCallback((tool: string, config?: any) => {
    if (!fabricCanvas) return;
    
    switch (tool) {
      case 'measure':
        setActiveTool('ruler');
        setRulerMode(true);
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.selection = false;
        setMeasurementMode((config?.mode as any) || 'distance');
        setCalibration(Number(config?.calibration) || 1);
        toast.info(`تم تفعيل أداة القياس - ${(config?.mode || 'distance')} (المعايرة: ${Number(config?.calibration) || 1} مم/بكسل)`);
        break;
      case 'roi':
        // Region of Interest - add rectangular selection
        const rect = new Rect({
          left: 100,
          top: 100,
          width: config?.region?.width || 100,
          height: config?.region?.height || 100,
          fill: 'rgba(255, 255, 0, 0.3)',
          stroke: '#ffff00',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
        });
        fabricCanvas.add(rect);
        fabricCanvas.renderAll();
        toast.success('تم إضافة منطقة الاهتمام');
        break;
      case 'enhancement':
        if (config?.preset) {
          applyEnhancement(config.preset);
        }
        break;
      case 'crosshair':
        addCrosshair();
        break;
      case 'magnify':
        handleZoom('in');
        break;
      case 'histogram': {
        try {
          const canvasEl = fabricCanvas.toCanvasElement();
          const ctx = canvasEl.getContext('2d');
          if (!ctx) break;
          const { width, height } = canvasEl;
          const imgData = ctx.getImageData(0, 0, width, height).data;
          let sum = 0, count = 0, min = 255, max = 0;
          for (let i = 0; i < imgData.length; i += 4) {
            // luminance approximation
            const lum = 0.299 * imgData[i] + 0.587 * imgData[i+1] + 0.114 * imgData[i+2];
            sum += lum; count++;
            if (lum < min) min = lum;
            if (lum > max) max = lum;
          }
          const avg = sum / count;
          toast.success(`Histogram: avg ${avg.toFixed(1)}, min ${min.toFixed(0)}, max ${max.toFixed(0)}`);
        } catch (e) {
          console.error(e);
          toast.error('تعذر حساب الهستوغرام');
        }
        break;
      }
      default:
        console.log('أداة غير معروفة:', tool);
    }
  }, [fabricCanvas, zoom]);

  // Apply image enhancement presets
  const applyEnhancement = (preset: string) => {
    switch (preset) {
      case 'bone':
        setBrightness(20);
        setContrast(30);
        break;
      case 'soft_tissue':
        setBrightness(-10);
        setContrast(20);
        break;
      case 'dental':
        setBrightness(15);
        setContrast(25);
        setSharpness(20);
        break;
      case 'contrast':
        setContrast(50);
        break;
    }
    toast.success(`تم تطبيق تحسين: ${preset}`);
  };

  // Add crosshair annotation
  const addCrosshair = () => {
    if (!fabricCanvas) return;
    
    const centerX = fabricCanvas.width! / 2;
    const centerY = fabricCanvas.height! / 2;
    
    // Horizontal line
    const hLine = new Rect({
      left: centerX - 20,
      top: centerY - 1,
      width: 40,
      height: 2,
      fill: activeColor,
      selectable: true,
    });
    
    // Vertical line
    const vLine = new Rect({
      left: centerX - 1,
      top: centerY - 20,
      width: 2,
      height: 40,
      fill: activeColor,
      selectable: true,
    });
    
    fabricCanvas.add(hLine, vLine);
    fabricCanvas.renderAll();
    toast.success('تم إضافة العلامة المرجعية');
  };

  // Ruler interactions
  useEffect(() => {
    if (!fabricCanvas) return;

    const handler = (opt: any) => {
      if (!rulerMode) return;
      const pointer = fabricCanvas.getPointer(opt.e);
      setMeasurementPoints(prev => {
        const pts = [...prev, { x: pointer.x, y: pointer.y }];
        // Distance mode: two points
        if (measurementMode === 'distance' && pts.length === 2) {
          const [p1, p2] = pts;
          const line = new Line([p1.x, p1.y, p2.x, p2.y], {
            stroke: activeColor,
            strokeWidth: 2,
            selectable: true,
          });
          const lengthPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const lengthMm = lengthPx * calibration;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const label = new FabricText(`${lengthMm.toFixed(2)} mm`, {
            left: midX + 6,
            top: midY + 6,
            fontSize: 14,
            fill: activeColor,
            backgroundColor: '#ffffffaa',
          });
          fabricCanvas.add(line, label);
          fabricCanvas.renderAll();
          toast.success(`الطول: ${lengthMm.toFixed(2)} مم`);
          return [];
        }
        // Angle mode: three points p1, p2 (vertex), p3
        if (measurementMode === 'angle' && pts.length === 3) {
          const [p1, p2, p3] = pts;
          const line1 = new Line([p2.x, p2.y, p1.x, p1.y], { stroke: activeColor, strokeWidth: 2 });
          const line2 = new Line([p2.x, p2.y, p3.x, p3.y], { stroke: activeColor, strokeWidth: 2 });
          const v1x = p1.x - p2.x, v1y = p1.y - p2.y;
          const v2x = p3.x - p2.x, v2y = p3.y - p2.y;
          const dot = v1x * v2x + v1y * v2y;
          const m1 = Math.hypot(v1x, v1y);
          const m2 = Math.hypot(v2x, v2y);
          const angle = Math.acos(Math.min(1, Math.max(-1, dot / (m1 * m2 || 1)))) * (180 / Math.PI);
          const label = new FabricText(`${angle.toFixed(1)}°`, {
            left: p2.x + 6,
            top: p2.y + 6,
            fontSize: 14,
            fill: activeColor,
            backgroundColor: '#ffffffaa',
          });
          fabricCanvas.add(line1, line2, label);
          fabricCanvas.renderAll();
          toast.success(`الزاوية: ${angle.toFixed(1)}°`);
          return [];
        }
        return pts;
      });
    };

    fabricCanvas.on('mouse:down', handler);
    rulerHandlerRef.current = handler;
    return () => {
      if (rulerHandlerRef.current) {
        fabricCanvas.off('mouse:down', rulerHandlerRef.current);
      }
    };
  }, [fabricCanvas, rulerMode, measurementMode, calibration, activeColor]);

  // Save canvas state to history
  const saveToHistory = useCallback((canvas: FabricCanvas) => {
    const state = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      return newHistory.slice(-20); // Keep only last 20 states
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Apply image adjustments (simplified for v6)
  useEffect(() => {
    if (!fabricCanvas || !originalImage) return;

    // Note: Fabric v6 has different filter implementation
    // For now, we'll focus on basic adjustments
    const objects = fabricCanvas.getObjects();
    const backgroundImg = objects.find(obj => obj.selectable === false);
    
    if (backgroundImg) {
      // Apply basic opacity/brightness simulation
      backgroundImg.set({
        opacity: 1 + (brightness / 200), // Simplified brightness
      });
      fabricCanvas.renderAll();
    }
  }, [brightness, contrast, saturation, sharpness, fabricCanvas, originalImage]);

  // Tool handlers
  const handleToolChange = (tool: typeof activeTool) => {
    if (!fabricCanvas) return;
    
    setActiveTool(tool);
    fabricCanvas.isDrawingMode = tool === "draw";
    fabricCanvas.selection = tool === "select";
    
    if (tool === "draw") {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
    
    setRulerMode(tool === "ruler");
  };

  const addShape = (type: "circle" | "rectangle" | "text") => {
    if (!fabricCanvas) return;

    let shape;
    const centerX = fabricCanvas.width! / 2;
    const centerY = fabricCanvas.height! / 2;

    switch (type) {
      case "circle":
        shape = new Circle({
          left: centerX - 25,
          top: centerY - 25,
          radius: 25,
          fill: "transparent",
          stroke: activeColor,
          strokeWidth: 2,
        });
        break;
      case "rectangle":
        shape = new Rect({
          left: centerX - 50,
          top: centerY - 25,
          width: 100,
          height: 50,
          fill: "transparent",
          stroke: activeColor,
          strokeWidth: 2,
        });
        break;
      case "text":
        shape = new FabricText("نص", {
          left: centerX - 20,
          top: centerY - fontSize / 2,
          fontSize: fontSize,
          fill: activeColor,
          fontFamily: "Arial",
        });
        break;
    }

    if (shape) {
      fabricCanvas.add(shape);
      fabricCanvas.setActiveObject(shape);
      fabricCanvas.renderAll();
    }
  };

  // Zoom functions
  const handleZoom = (direction: "in" | "out" | "reset") => {
    if (!fabricCanvas) return;
    
    let newZoom = zoom;
    
    switch (direction) {
      case "in":
        newZoom = Math.min(zoom + 20, 300);
        break;
      case "out":
        newZoom = Math.max(zoom - 20, 50);
        break;
      case "reset":
        newZoom = 100;
        break;
    }
    
    setZoom(newZoom);
    const zoomLevel = newZoom / 100;
    const center = { x: (fabricCanvas.getWidth?.() || fabricCanvas.width || 0) / 2, y: (fabricCanvas.getHeight?.() || fabricCanvas.height || 0) / 2 } as any;
    (fabricCanvas as any).zoomToPoint(center, zoomLevel);
    fabricCanvas.renderAll();
  };

  // Rotation
  const handleRotate = (direction: "cw" | "ccw") => {
    if (!fabricCanvas) return;
    
    const angle = direction === "cw" ? 90 : -90;
    const objects = fabricCanvas.getObjects();
    
    objects.forEach(obj => {
      obj.rotate((obj.angle || 0) + angle);
    });
    
    fabricCanvas.renderAll();
  };

  // Undo/Redo
  const handleUndo = () => {
    if (!fabricCanvas || historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const state = history[newIndex];
    
    fabricCanvas.loadFromJSON(state, () => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleRedo = () => {
    if (!fabricCanvas || historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    const state = history[newIndex];
    
    fabricCanvas.loadFromJSON(state, () => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  // Clear all annotations
  const handleClear = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
      // Keep the background image (not selectable)
      if (obj.selectable !== false) {
        fabricCanvas.remove(obj);
      }
    });
    fabricCanvas.renderAll();
  };

  // Delete selected object
  const handleDelete = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && activeObject.selectable !== false) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.renderAll();
    }
  };

  // Reset all adjustments
  const handleReset = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setSharpness(0);
    handleZoom("reset");
    if (fabricCanvas && originalImage) {
      fabricCanvas.clear();
      // Re-add background image
      FabricImage.fromURL(originalImage.src).then((fabricImg) => {
        fabricImg.set({
          scaleX: fabricCanvas.width! / originalImage.width,
          scaleY: fabricCanvas.height! / originalImage.height,
          selectable: false,
          evented: false,
        });
        fabricCanvas.add(fabricImg);
        fabricCanvas.sendObjectToBack(fabricImg);
        fabricCanvas.renderAll();
      });
    }
  };

  // Save edited image
  const handleSave = () => {
    if (!fabricCanvas || !onSave) return;
    
    fabricCanvas.toCanvasElement().toBlob((blob) => {
      if (blob) {
        onSave(blob);
        toast.success("تم حفظ التعديلات بنجاح!");
      }
    }, "image/png", 1.0);
  };

  // Download edited image
  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      multiplier: 1,
      format: "png",
      quality: 1.0,
    });
    
    const link = document.createElement("a");
    link.download = `edited-${imageName || "medical-image"}.png`;
    link.href = dataURL;
    link.click();
    
    toast.success("تم تحميل الصورة بنجاح!");
  };

  return (
    <div className="w-full h-screen flex flex-col space-y-4 overflow-hidden">
      {/* Header with main actions */}
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Badge variant="outline">محرر الصور الطبية</Badge>
          <span className="text-sm text-muted-foreground">
            {imageName || "صورة طبية"}
          </span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          {onSave && (
            <Button onClick={handleSave} variant="default" size="sm">
              <Save className="ml-1 h-4 w-4" />
              حفظ
            </Button>
          )}
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="ml-1 h-4 w-4" />
            تحميل
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              إغلاق
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Toolbox with scrolling */}
        <Card className="w-80 flex flex-col">
          <CardContent className="p-4 overflow-y-auto flex-1">
            <Tabs defaultValue="tools" className="w-full">
              <TabsList className="grid w-full grid-cols-4 sticky top-0 z-10 bg-background">
                <TabsTrigger value="tools">أدوات</TabsTrigger>
                <TabsTrigger value="adjustments">تعديل</TabsTrigger>
                <TabsTrigger value="view">عرض</TabsTrigger>
                <TabsTrigger value="ai">ذكاء اصطناعي</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tools" className="space-y-4">
                <DiagnosticTools 
                  onToolSelect={handleDiagnosticTool}
                  activeTool={activeTool}
                />

                <Separator />

                {/* Tools */}
                <div>
                  <Label className="text-sm font-medium">أدوات الرسم</Label>
                  <ToggleGroup 
                    type="single" 
                    value={activeTool} 
                    onValueChange={(value) => value && handleToolChange(value as typeof activeTool)}
                    className="grid grid-cols-3 gap-2 mt-2"
                  >
                    <ToggleGroupItem value="select" aria-label="تحديد">
                      <MousePointer className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="draw" aria-label="رسم">
                      <Paintbrush className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="text" aria-label="نص">
                      <Type className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="circle" aria-label="دائرة">
                      <CircleIcon className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="rectangle" aria-label="مستطيل">
                      <Square className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="ruler" aria-label="مسطرة">
                      <Ruler className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <Separator />

                {/* Color picker */}
                <div>
                  <Label className="text-sm font-medium">اللون</Label>
                  <div className="flex items-center space-x-2 space-x-reverse mt-2">
                    <input
                      type="color"
                      value={activeColor}
                      onChange={(e) => setActiveColor(e.target.value)}
                      className="w-10 h-10 rounded border border-input"
                    />
                    <Select value={activeColor} onValueChange={setActiveColor}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="#ff0000">أحمر</SelectItem>
                        <SelectItem value="#00ff00">أخضر</SelectItem>
                        <SelectItem value="#0000ff">أزرق</SelectItem>
                        <SelectItem value="#ffff00">أصفر</SelectItem>
                        <SelectItem value="#ffffff">أبيض</SelectItem>
                        <SelectItem value="#000000">أسود</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Brush size */}
                <div>
                  <Label className="text-sm font-medium">حجم الفرشاة: {brushSize}px</Label>
                  <Slider
                    value={[brushSize]}
                    onValueChange={(value) => {
                      setBrushSize(value[0]);
                      if (fabricCanvas && fabricCanvas.freeDrawingBrush) {
                        fabricCanvas.freeDrawingBrush.width = value[0];
                      }
                    }}
                    max={50}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Font size */}
                <div>
                  <Label className="text-sm font-medium">حجم الخط: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    max={72}
                    min={8}
                    step={2}
                    className="mt-2"
                  />
                </div>

                <Separator />

                {/* Shape buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    onClick={() => addShape("text")} 
                    variant="outline" 
                    size="sm"
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => addShape("circle")} 
                    variant="outline" 
                    size="sm"
                  >
                    <CircleIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => addShape("rectangle")} 
                    variant="outline" 
                    size="sm"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="adjustments" className="space-y-4">
                {/* Image adjustments */}
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    السطوع: {brightness}
                  </Label>
                  <Slider
                    value={[brightness]}
                    onValueChange={(value) => setBrightness(value[0])}
                    max={100}
                    min={-100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    التباين: {contrast}
                  </Label>
                  <Slider
                    value={[contrast]}
                    onValueChange={(value) => setContrast(value[0])}
                    max={100}
                    min={-100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    التشبع: {saturation}
                  </Label>
                  <Slider
                    value={[saturation]}
                    onValueChange={(value) => setSaturation(value[0])}
                    max={100}
                    min={-100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    الحدة: {sharpness}
                  </Label>
                  <Slider
                    value={[sharpness]}
                    onValueChange={(value) => setSharpness(value[0])}
                    max={100}
                    min={-100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <Button onClick={handleReset} variant="outline" className="w-full">
                  <RefreshCw className="ml-2 h-4 w-4" />
                  إعادة تعيين
                </Button>
              </TabsContent>

              <TabsContent value="view" className="space-y-4">
                {/* Zoom controls */}
                <div>
                  <Label className="text-sm font-medium">التكبير: {zoom}%</Label>
                  <div className="flex items-center space-x-2 space-x-reverse mt-2">
                    <Button onClick={() => handleZoom("out")} size="sm" variant="outline">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Slider
                      value={[zoom]}
                      onValueChange={(value) => {
                        setZoom(value[0]);
                        if (fabricCanvas) {
                          const zoomLevel = value[0] / 100;
                          const center = { x: (fabricCanvas.getWidth?.() || fabricCanvas.width || 0) / 2, y: (fabricCanvas.getHeight?.() || fabricCanvas.height || 0) / 2 } as any;
                          (fabricCanvas as any).zoomToPoint(center, zoomLevel);
                          fabricCanvas.renderAll();
                        }
                      }}
                      max={300}
                      min={50}
                      step={10}
                      className="flex-1"
                    />
                    <Button onClick={() => handleZoom("in")} size="sm" variant="outline">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <Label className="text-sm font-medium">دوران</Label>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => handleRotate("ccw")} variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleRotate("cw")} variant="outline" size="sm">
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* History controls */}
                <div>
                  <Label className="text-sm font-medium">التاريخ</Label>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      onClick={handleUndo} 
                      variant="outline" 
                      size="sm"
                      disabled={historyIndex <= 0}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={handleRedo} 
                      variant="outline" 
                      size="sm"
                      disabled={historyIndex >= history.length - 1}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Clear and delete */}
                <div className="flex gap-2">
                  <Button onClick={handleDelete} variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                    حذف المحدد
                  </Button>
                  <Button onClick={handleClear} variant="destructive" size="sm">
                    مسح الكل
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <AIAnalysisPanel 
                  imageUrl={imageUrl} 
                  imageType="xray"
                  onAnalysisComplete={(results) => {
                    console.log('نتائج التحليل:', results);
                    // Store analysis results in canvas metadata or annotations
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Canvas area */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4 h-full overflow-auto flex items-center justify-center">
            <div className="border border-border rounded-lg overflow-hidden shadow-lg">
              <canvas ref={canvasRef} className="block" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ruler mode indicator */}
      {rulerMode && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <Badge variant="default" className="text-sm">
            <Ruler className="ml-2 h-4 w-4" />
            وضع المسطرة نشط - انقر واسحب لقياس المسافة
          </Badge>
        </div>
      )}
    </div>
  );
}