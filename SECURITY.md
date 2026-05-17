# Security Policy

We take the security of JSON Debugger seriously. Because the extension handles sensitive JSON payloads (often containing raw system configurations, keys, or credentials), maintaining user privacy and local-only parsing integrity is a core priority.

If you believe you have found a security vulnerability, please follow the guidelines below to report it responsibly.

---

## Reporting a Vulnerability

If you identify any security issue or vulnerability, please open a new GitHub Issue in our repository. 

To help us investigate and patch the issue quickly, please include the following details in your issue:
* A descriptive title and summary of the potential vulnerability.
* Clear, step-by-step instructions to reproduce the issue (along with any sample payloads or URLs if applicable).
* The potential security impact (e.g., local storage data leakage, extension styling bypass, or rendering crash).
* Your environment details (Chrome version, extension version, and Operating System).

---

## Core Security Commitments

JSON Debugger is designed under the following strict privacy principles:
* **Local Processing**: All JSON formatting, repairing, and analyzing runs completely locally within your browser. 
* **No Remote Scripts**: The extension does not load remote JavaScript files, preventing supply chain script injection.
* **Credential Omission**: All URL fetches performed via the popup omit active browser cookies and credentials by default to prevent unauthorized Cross-Origin requests.
* **Strict Limits**: Responses loaded from URLs are strictly capped at 5 MB and time out after 10 seconds to protect against system hangs.

Thank you for helping keep our users safe!
