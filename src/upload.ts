import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from './cloudinary'

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'jose-bobadilla',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  } as any,
})

export const upload = multer({ storage })