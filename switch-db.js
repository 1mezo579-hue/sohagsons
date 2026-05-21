const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const mode = process.argv[2];

if (!['sqlite', 'postgresql'].includes(mode)) {
  console.error('Usage: node switch-db.js [sqlite|postgresql]');
  process.exit(1);
}

try {
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found at: ${schemaPath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(schemaPath, 'utf8');

  // Regex to match the datasource db block
  const dbBlockRegex = /datasource\s+db\s*{[\s\S]*?}/g;
  
  let newDbBlock = '';
  if (mode === 'sqlite') {
    newDbBlock = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`;
  } else {
    newDbBlock = `datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}`;
  }

  if (!dbBlockRegex.test(content)) {
    console.error('Could not find datasource db block in schema.prisma');
    process.exit(1);
  }

  // Reset regex index because of .test()
  dbBlockRegex.lastIndex = 0;
  content = content.replace(dbBlockRegex, newDbBlock);
  
  fs.writeFileSync(schemaPath, content, 'utf8');
  console.log(`Successfully switched database to ${mode}`);
} catch (err) {
  console.error('Error switching database:', err);
  process.exit(1);
}
