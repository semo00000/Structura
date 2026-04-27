const fs = require('fs');

const path = 'src/components/AppSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// The bottom Login button still has asChild
content = content.replace(/<Button\s+size="sm"\s+className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary\/90"\s+asChild\s*>\s*<Link href="\/login">\s*<LogIn className="size-3\.5" \/>\s*\{t\.nav\.login\}\s*<\/Link>\s*<\/Button>/gs,
`<Button
            size="sm"
            className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            <LogIn className="size-3.5" />
            {t.nav.login}
          </Button>`);

fs.writeFileSync(path, content, 'utf8');
