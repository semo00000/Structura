const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Regex to match <Button ... nativeButton={false} render={<Link href="..." />} ... > ... </Button>
  // We'll replace it with <Button ... asChild ... > <Link href="..."> ... </Link> </Button>

  content = content.replace(/<Button([^>]*)nativeButton=\{false\}\s*render=\{<Link href="([^"]+)" \/>\}([^>]*)>(.*?)<\/Button>/gs,
    (match, p1, p2, p3, p4) => {
      return `<Button${p1}asChild${p3}>\n<Link href="${p2}">${p4}</Link>\n</Button>`;
    });

  // some might have self-closing? Unlikely but possible.

  fs.writeFileSync(path, content, 'utf8');
}

[
  'src/app/(dashboard)/bons-commande/page.tsx',
  'src/app/(dashboard)/devis/page.tsx',
  'src/app/(dashboard)/factures/page.tsx',
  'src/app/(dashboard)/avoirs/page.tsx',
  'src/app/(dashboard)/bons-livraison/page.tsx',
  'src/app/page.tsx',
  'src/app/accept-invite/page.tsx'
].forEach(replaceFile);
