import fs from 'fs';
import path from 'path';

function findEnvFiles(dir) {
    const results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                results.push(...findEnvFiles(fullPath));
            }
        } else if (file.startsWith('.env')) {
            results.push(fullPath);
        }
    });
    return results;
}

const envFiles = findEnvFiles('e:\\Project\\Project_2\\backend-organization-catalog');
console.log("Found env files:", envFiles);

envFiles.forEach(file => {
    console.log(`\n=== Content of ${file} ===`);
    console.log(fs.readFileSync(file, 'utf8'));
});
