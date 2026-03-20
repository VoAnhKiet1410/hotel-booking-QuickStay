import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';

// Xóa file tạm multer sau khi upload Cloudinary
export const cleanupTempFiles = async (files) => {
    if (!Array.isArray(files) || files.length === 0) return;
    await Promise.allSettled(
        files.map((f) => fs.unlink(f.path).catch(() => {}))
    );
};

/**
 * Upload files lên Cloudinary và cleanup file tạm.
 * Upload song song (Promise.all) để tăng tốc.
 * @param {Array} files - Mảng các file multer
 * @param {string} folderName - Tên thư mục trên Cloudinary
 * @returns {Promise<string[]>} Mảng secure URLs
 */
export const uploadImagesToCloudinary = async (
    files,
    folderName = 'quickstay/general'
) => {
    if (!Array.isArray(files) || files.length === 0) return [];
    try {
        // Upload song song tất cả ảnh cùng lúc
        const results = await Promise.all(
            files.map((file) =>
                cloudinary.uploader.upload(file.path, {
                    folder: folderName,
                    quality: 'auto:good',
                    format: 'webp',
                    transformation: [
                        { width: 1200, height: 800, crop: 'limit' },
                    ],
                })
            )
        );
        return results.filter((r) => r?.secure_url).map((r) => r.secure_url);
    } finally {
        await cleanupTempFiles(files);
    }
};
