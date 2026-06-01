const fs = require('fs');
const path = require('path');
let bad = false;
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) {
      const c = fs.readFileSync(p, 'utf8');
      const regex = /import.*?from\s+['"](.*?)['"]/g;
      let m;
      while (m = regex.exec(c)) {
        let p2 = path.resolve(path.dirname(p), m[1]);
        if (!fs.existsSync(p2)) {
          console.log('MISSING IMPORT in', p, '->', m[1], '(', p2, ')');
          bad = true;
        }
      }
    }
  })
}
walk('.');
if (!bad) console.log('All imports exist!');
