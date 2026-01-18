import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customerName = formData.get('customerName') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get file extension
    const fileExtension = file.name.split('.').pop() || 'png';
    
    // Generate filename based on customer name
    let filename: string;
    if (customerName && customerName.trim()) {
      // Convert customer name to URL-friendly format
      // e.g., "Amy Burns" -> "amy-burns.png"
      const sanitizedName = customerName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      filename = `${sanitizedName}.${fileExtension}`;
    } else {
      // Fallback to timestamp-based filename if no customer name provided
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      filename = `${timestamp}-${originalName}`;
    }
    
    // Save to public/customers directory
    const uploadDir = join(process.cwd(), 'public', 'customers');
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/customers/${filename}`;

    return NextResponse.json({ 
      url: publicUrl,
      filename: filename 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
