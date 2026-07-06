# Kostenlose Website-Entwürfe (LIKOVO)

Sammel-Repo für alle Kunden-Entwürfe. Jeder Kunde bekommt einen Ordner unter `sites/`.

## Struktur
```
sites/
  <kunde>/        → fertiger Startseiten-Entwurf (HTML/Assets)
  <kunde2>/
```
`sites/<kunde>/` wird automatisch auf **dev.likovo.de/<kunde>/** deployt.

## Workflow pro Kunde
1. Im Blueprint-Ordner (`~/Documents/claude/Blueprint kostenlose Entwurf/`) arbeiten (Analyse, Copy, Design, Bau).
2. Fertigen Entwurf nach `sites/<kunde>/` in dieses Repo legen.
3. `git push` → Deploy-Action stellt automatisch auf dev.likovo.de/<kunde>/.

## Deploy (einmalig eingerichtet)
GitHub-Action `.github/workflows/deploy.yml` deployt per FTP. Benötigte **Repo-Secrets** (Settings → Secrets and variables → Actions):
- `FTP_HOST` (z. B. `dev.likovo.de` oder die FTP-Server-Adresse)
- `FTP_USER`
- `FTP_PASSWORD`
- `FTP_SERVER_DIR` (Webroot, mit Slash am Ende, z. B. `/` oder `/httpdocs/`)
- optional `FTP_PROTOCOL` (`ftps` Standard, sonst `ftp`)

Secrets werden nie im Code gespeichert.
