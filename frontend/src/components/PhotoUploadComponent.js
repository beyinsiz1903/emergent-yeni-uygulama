import React, { useState } from 'react';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const PhotoUploadComponent = ({ roomId, roomNumber, type = 'before', onUploadComplete }) => {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setPhoto(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!photo) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('room_id', roomId);
      formData.append('type', type);
      formData.append('timestamp', new Date().toISOString());

      await axios.post('/housekeeping/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`✓ ${type === 'before' ? 'Önce' : 'Sonra'} fotoğrafı yüklendi!`);
      setPhoto(null);
      setPreview(null);
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      toast.error('Fotoğraf yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardContent className="p-4">
        <div className="text-center">
          <p className="font-semibold mb-2">
            {type === 'before' ? '📷 Önce' : '✅ Sonra'} Fotoğrafı
          </p>
          <p className="text-xs text-gray-600 mb-3">Oda {roomNumber}</p>

          {!preview ? (
            <label className="cursor-pointer">
              <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Fotoğraf Çek</p>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPhoto(null);
                    setPreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={uploadPhoto}
                disabled={uploading}
              >
                {uploading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Yükle
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoUploadComponent;