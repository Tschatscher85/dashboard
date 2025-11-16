import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function migrate() {
  console.log("🔄 Checking propertyLinks table...");
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Check if table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'propertyLinks'"
    );
    
    if (tables.length === 0) {
      console.log("📝 Creating propertyLinks table...");
      
      await connection.query(`
        CREATE TABLE IF NOT EXISTS propertyLinks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          propertyId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          url VARCHAR(1000) NOT NULL,
          showOnLandingPage BOOLEAN DEFAULT FALSE,
          sortOrder INT DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          createdBy INT,
          INDEX idx_propertyId (propertyId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      console.log("✅ propertyLinks table created successfully!");
    } else {
      console.log("✅ propertyLinks table already exists");
      
      // Check if we need to migrate from old schema
      const [columns] = await connection.query("DESCRIBE propertyLinks");
      const columnNames = columns.map(c => c.Field);
      
      // Check if old schema (description, displayOrder) exists
      const hasOldSchema = columnNames.includes('description') || columnNames.includes('displayOrder');
      const hasNewSchema = columnNames.includes('showOnLandingPage') && columnNames.includes('sortOrder');
      
      if (hasOldSchema && !hasNewSchema) {
        console.log("🔄 Migrating from old schema to new schema...");
        
        // Add new columns
        if (!columnNames.includes('showOnLandingPage')) {
          await connection.query(`
            ALTER TABLE propertyLinks 
            ADD COLUMN showOnLandingPage BOOLEAN DEFAULT FALSE AFTER url
          `);
          console.log("  ✓ Added showOnLandingPage column");
        }
        
        if (!columnNames.includes('sortOrder')) {
          await connection.query(`
            ALTER TABLE propertyLinks 
            ADD COLUMN sortOrder INT DEFAULT 0 AFTER showOnLandingPage
          `);
          console.log("  ✓ Added sortOrder column");
        }
        
        if (!columnNames.includes('createdBy')) {
          await connection.query(`
            ALTER TABLE propertyLinks 
            ADD COLUMN createdBy INT AFTER updatedAt
          `);
          console.log("  ✓ Added createdBy column");
        }
        
        // Drop old columns
        if (columnNames.includes('description')) {
          await connection.query(`
            ALTER TABLE propertyLinks 
            DROP COLUMN description
          `);
          console.log("  ✓ Removed description column");
        }
        
        if (columnNames.includes('displayOrder')) {
          await connection.query(`
            ALTER TABLE propertyLinks 
            DROP COLUMN displayOrder
          `);
          console.log("  ✓ Removed displayOrder column");
        }
        
        console.log("✅ Schema migration completed!");
      } else if (hasNewSchema) {
        console.log("✅ Schema is up to date!");
      }
    }
    
    // Verify final table structure
    const [finalColumns] = await connection.query("DESCRIBE propertyLinks");
    console.log("📋 Table structure:", finalColumns.map(c => c.Field).join(", "));
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
  
  console.log("✅ Migration completed!");
}

migrate();
