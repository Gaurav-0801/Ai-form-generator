import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export async function uploadImage(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'image',
          folder: 'form-uploads',
          upload_preset: config.cloudinary.uploadPreset,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result?.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed: No URL returned'));
          }
        }
      )
      .end(buffer);
  });
}

export async function uploadImageFromBase64(base64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64,
      {
        resource_type: 'image',
        folder: 'form-uploads',
        upload_preset: config.cloudinary.uploadPreset,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result?.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed: No URL returned'));
        }
      }
    );
  });
}


