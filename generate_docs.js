const fs = require('fs');
const path = require('path');

const routesDir = './src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
let out = '# Turf Backend Full API Documentation\n\n';

files.forEach(f => {
  out += `## ${f.replace('.routes.js', '').replace('.js', '').toUpperCase()} API\n\n`;
  const content = fs.readFileSync(path.join(routesDir, f), 'utf-8');
  const regex = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]\s*,\s*(.*?)\);/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const middlewares = match[3];
    
    let role = 'Public';
    let bearer = 'No';
    
    if (middlewares.includes('protect')) {
      bearer = 'Yes (Requires Authorization: Bearer <token>)';
    }
    
    if (middlewares.includes('authorizeRoles')) {
      const roleMatch = middlewares.match(/authorizeRoles\(([^)]+)\)/);
      if (roleMatch) {
        role = roleMatch[1].replace(/['"\s]/g, '');
      }
    } else if (bearer.startsWith('Yes')) {
      role = 'Authenticated User (Any)';
    }
    
    const prefix = f === 'index.js' ? '' : f.replace('.routes.js', '');
    const fullPath = `/api/${prefix}${routePath.replace(/^\/?/, '/')}`.replace(/\/\//g, '/');
    
    out += `### ${method} ${fullPath}\n`;
    out += `- **Method**: ${method}\n`;
    out += `- **Role**: ${role}\n`;
    out += `- **Bearer**: ${bearer}\n\n`;
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
       out += `**JSON Body:**\n\`\`\`json\n{\n  // Add request body fields here\n}\n\`\`\`\n\n`;
    }
    out += `---\n\n`;
  }
});

fs.writeFileSync('api_tests/ALL_APIS.md', out);
console.log('Done writing ALL_APIS.md');
