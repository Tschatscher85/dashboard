/**
 * Migration Script: Convert all direct NAS URLs to proxy URLs
 * 
 * This script updates all existing image and document URLs in the database
 * from direct NAS URLs (https://ugreen.tschatscher.eu/...) to proxy URLs (/api/nas/...)
 * 
 * The proxy endpoint handles authentication with read-only credentials,
 * enabling public access to images on landing pages without exposing credentials.
 * 
 * Usage:
 *   node scripts/migrate-urls-to-proxy.js
 */

const mysql = require('mysql2/promise');

async function migrateUrls() {
  console.log('🔄 Starting URL migration to proxy format...\n');
  
  // Get database connection from environment
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }
  
  const conn = await mysql.createConnection(DATABASE_URL);
  
  try {
    // 1. Migrate propertyImages table
    console.log('📸 Migrating propertyImages URLs...');
    const [imageResult] = await conn.execute(`
      UPDATE propertyImages 
      SET imageUrl = REPLACE(imageUrl, 'https://ugreen.tschatscher.eu', '/api/nas')
      WHERE imageUrl LIKE 'https://ugreen%'
    `);
    console.log(`   ✅ Updated ${imageResult.affectedRows} image URLs\n`);
    
    // 2. Migrate documents table
    console.log('📄 Migrating documents URLs...');
    const [docResult] = await conn.execute(`
      UPDATE documents 
      SET fileUrl = REPLACE(fileUrl, 'https://ugreen.tschatscher.eu', '/api/nas')
      WHERE fileUrl LIKE 'https://ugreen%'
    `);
    console.log(`   ✅ Updated ${docResult.affectedRows} document URLs\n`);
    
    // 3. Show sample of migrated URLs
    console.log('📋 Sample of migrated URLs:');
    const [sampleImages] = await conn.execute(`
      SELECT id, imageUrl FROM propertyImages WHERE imageUrl LIKE '/api/nas/%' LIMIT 3
    `);
    sampleImages.forEach(img => {
      console.log(`   Image ${img.id}: ${img.imageUrl.substring(0, 80)}...`);
    });
    
    const [sampleDocs] = await conn.execute(`
      SELECT id, fileUrl FROM documents WHERE fileUrl LIKE '/api/nas/%' LIMIT 3
    `);
    if (sampleDocs.length > 0) {
      sampleDocs.forEach(doc => {
        console.log(`   Doc ${doc.id}: ${doc.fileUrl.substring(0, 80)}...`);
      });
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('🔍 All images and documents now use proxy URLs (/api/nas/...)');
    console.log('🔒 Public access enabled without exposing NAS credentials');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

// Run migration
migrateUrls().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
