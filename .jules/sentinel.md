## 2025-02-18 - Open Redirect in Login Redirect Handling
**Vulnerability:** Open redirect where `//evil.com` bypassed local URL validation (`startsWith("/")`)
**Learning:** Checking if a URL `startsWith("/")` is not sufficient to prevent Open Redirects, because protocol-relative URLs (e.g. `//example.com`) also start with `/` and are treated as external links.
**Prevention:** Ensure the URL starts with `/` but specifically does not start with `//` using `startsWith("/") && !startsWith("//")` to restrict it strictly to local paths.
