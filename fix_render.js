const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Base-UI Button doesn't support asChild. Base-UI button nativeButton={false} render={<Link />} or similar is Base-UI convention.
  // Wait, `nativeButton={false} render={<Link href="..." />}` IS the Base UI convention?
  // Let me check if Base UI button supports render props.
  // Actually, Base UI button supports `render` prop.

  // So replacing with asChild was wrong! The prompt mentioned "Hallucinated props", but maybe the reviewer didn't know we are using @base-ui/react?
  // Let's restore the nativeButton={false} render={<Link ... />} that I removed!

  content = content.replace(/<Button([^>]*)asChild([^>]*)>\n<Link href="([^"]+)">([^<]+)<\/Link>\n<\/Button>/gs,
    (match, p1, p2, p3, p4) => {
      return `<Button${p1}nativeButton={false} render={<Link href="${p3}" />}${p2}>${p4}</Button>`;
    });

  // What about elements with multiple children inside Link?
  content = content.replace(/<Button([^>]*)asChild([^>]*)>\n<Link href="([^"]+)">([\s\S]*?)<\/Link>\n<\/Button>/gs,
    (match, p1, p2, p3, p4) => {
      return `<Button${p1}nativeButton={false} render={<Link href="${p3}" />}${p2}>${p4}</Button>`;
    });

  fs.writeFileSync(path, content, 'utf8');
}

[
  'src/app/(dashboard)/bons-commande/page.tsx',
  'src/app/(dashboard)/devis/page.tsx',
  'src/app/(dashboard)/factures/page.tsx',
  'src/app/(dashboard)/avoirs/page.tsx',
  'src/app/(dashboard)/bons-livraison/page.tsx',
  'src/app/page.tsx',
  'src/app/accept-invite/page.tsx',
  'src/components/AppSidebar.tsx' // Wait, app sidebar I changed manually
].forEach(replaceFile);
