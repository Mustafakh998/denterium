import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MedicalImage {
  id: string;
  title: string;
  description: string | null;
  image_type: string;
  tooth_numbers: number[] | null;
  metadata: Record<string, any> | null;
  patient_id: string;
  patient_first_name: string;
  patient_last_name: string;
  image_url: string;
  created_at: string;
}

interface MedicalImageEditorProps {
  image: MedicalImage;
  onSave: () => void;
}

export const MedicalImageEditor: React.FC<MedicalImageEditorProps> = ({ image, onSave }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(image.title);
  const [description, setDescription] = useState(image.description || '');
  const [imageType, setImageType] = useState(image.image_type);
  const [toothNumbers, setToothNumbers] = useState<number[]>(image.tooth_numbers || []);
  const [newToothNumber, setNewToothNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const imageTypes = [
    'x-ray',
    'clinical-photo',
    'scan',
    'report',
    'other'
  ];

  const addToothNumber = () => {
    const toothNumber = parseInt(newToothNumber);
    if (newToothNumber && !isNaN(toothNumber) && !toothNumbers.includes(toothNumber)) {
      setToothNumbers([...toothNumbers, toothNumber]);
      setNewToothNumber('');
    }
  };

  const removeToothNumber = (toothNumber: number) => {
    setToothNumbers(toothNumbers.filter(t => t !== toothNumber));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('medical_images')
        .update({
          title,
          description: description || null,
          image_type: imageType,
          tooth_numbers: toothNumbers.length > 0 ? toothNumbers : null,
        })
        .eq('id', image.id);

      if (error) throw error;

      toast({
        title: "Image Updated",
        description: "Medical image has been updated successfully.",
      });

      onSave();
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Error",
        description: "Failed to update image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter image title"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter image description"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="image-type">Image Type</Label>
          <Select value={imageType} onValueChange={setImageType}>
            <SelectTrigger>
              <SelectValue placeholder="Select image type" />
            </SelectTrigger>
            <SelectContent>
              {imageTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tooth Numbers</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newToothNumber}
              onChange={(e) => setNewToothNumber(e.target.value)}
              placeholder="Enter tooth number"
              className="flex-1"
            />
            <Button onClick={addToothNumber} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {toothNumbers.map((toothNumber) => (
              <Badge key={toothNumber} variant="secondary" className="flex items-center gap-1">
                {toothNumber}
                <button
                  onClick={() => removeToothNumber(toothNumber)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};