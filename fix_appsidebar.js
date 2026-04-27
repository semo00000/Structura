const fs = require('fs');
let content = fs.readFileSync('src/components/AppSidebar.tsx', 'utf8');

// Fix TooltipTrigger render props
content = content.replace(/<TooltipTrigger render=\{lockedContent\} \/>/g, '<TooltipTrigger asChild>{lockedContent}</TooltipTrigger>');
content = content.replace(/<TooltipTrigger render=\{linkContent\} \/>/g, '<TooltipTrigger asChild>{linkContent}</TooltipTrigger>');

// Fix Button with render=... to asChild (logout button)
content = content.replace(/<TooltipTrigger\s+render=\{\s*<Button\s+type="button"\s+variant="ghost"\s+size="icon-sm"\s+className="w-full text-sidebar-foreground\/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"\s+onClick=\{[^}]+\}\s+disabled=\{isLoggingOut\}\s*\/>\s*\}/g,
  `<TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                onClick={() => void performLogout()}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
              </Button>
            </TooltipTrigger>`);

// Next, fix the login tooltip trigger
content = content.replace(/<TooltipTrigger\s+render=\{\s*<Button\s+variant="ghost"\s+size="icon-sm"\s+className="w-full text-sidebar-foreground\/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"\s+nativeButton=\{false\}\s+render=\{<Link href="\/login" \/>\}\s*\/>\s*\}/g,
  `<TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                asChild
              >
                <Link href="/login">
                  <LogIn className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>`);

// Fix bottom Login button
content = content.replace(/<Button\s+size="sm"\s+className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary\/90"\s+nativeButton=\{false\}\s+render=\{<Link href="\/login" \/>\}\s*>/g,
  `<Button
            size="sm"
            className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            asChild
          >
            <Link href="/login">`);
content = content.replace(/<LogIn className="size-3\.5" \/>\s*\{t\.nav\.login\}\s*<\/Button>/g,
  `<LogIn className="size-3.5" />
              {t.nav.login}
            </Link>
          </Button>`);

// Cleanup duplicate inner content if the regex missed removing it for the first tooltips
// Note: original had:
// >
//   {isLoggingOut ? (
//     <Loader2 className="size-4 animate-spin" />
//   ) : (
//     <LogOut className="size-4" />
//   )}
// </TooltipTrigger>
// We need to clean that up since we moved it into the button.

fs.writeFileSync('src/components/AppSidebar.tsx', content, 'utf8');
