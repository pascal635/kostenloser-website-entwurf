# Deploy-Hinweise · Lander Immobilienservice

Slug `lander-immobilien`, also `dev.likovo.de/lander-immobilien/`. Gewählt nach
dem Muster der übrigen Immobilien-Entwürfe im Repo und nach der Domain des
Kunden, `lander.immobilien`.

Der Ordner ist eigenständig: `index.html`, `bilder/` mit 30 Dateien,
`schriften/` mit der Variable-Schrift. Gemessen im Standalone-Lauf: **null
externe Anfragen**, kein 404, keine Konsolenfehler, kein fehlendes Bild.

## Vor dem Push zu entscheiden

**Dreizehn Unterseiten existieren noch nicht.** Verlinkt sind sie schon, mit
relativen Pfaden, damit sie im Unterordner richtig auflösen:

```
weg-verwaltung                 mietverwaltung
gewerbemietverwaltung          sondereigentumsverwaltung
verwalter-check.html           wissen.html
hausverwaltung-mainz.html      hausverwaltung-wiesbaden.html
hausverwaltung-darmstadt.html  hausverwaltung-mannheim.html
hausverwaltung-ludwigshafen.html hausverwaltung-heidelberg.html
impressum.html                 datenschutz.html
```

Zwei Wege, Pascal entscheidet:

1. Links stehen lassen. Die Struktur ist sichtbar, wer klickt landet auf 404.
   Für eine interne Durchsicht in Ordnung.
2. Vor dem Versand an den Interessenten auf `#kontakt` umbiegen oder
   Platzhalterseiten anlegen. Sauberer, wenn der Link nach außen geht.

Impressum und Datenschutz sind davon ausgenommen, die müssen vor jedem
öffentlichen Link stehen.

## Was bewusst so ist

- **Schrift liegt lokal**, `schriften/plus-jakarta-sans-latin.woff2` und
  `-latin-ext.woff2`, eingebunden per `@font-face` mit `unicode-range`. Kein
  Aufruf zu Google, damit von der Seite aus keine Besucher-IPs an Dritte gehen.
  Plus Jakarta Sans steht unter der SIL Open Font License, der Lizenztext liegt
  als `schriften/OFL-Plus-Jakarta-Sans.txt` dabei.
- **`<meta name="robots" content="noindex,nofollow">`** sperrt die Vorschau für
  Suchmaschinen, damit sie nicht gegen die Live-Seite des Kunden antritt. Beim
  echten Livegang entfernen. Eine `robots.txt` liegt bewusst nicht im Ordner:
  sie wirkt nur im Wurzelverzeichnis einer Domain, in einem Unterordner ist sie
  wirkungslos und würde falsche Sicherheit vorspiegeln.
- **`canonical` und `og:url`** zeigen auf `https://lander.immobilien/`, also auf
  die Seite des Kunden. Beim echten Livegang auf die neue Adresse setzen.
- **Alle Bildpfade sind relativ**, ebenso die internen Links. 29 wurzelrelative
  Links waren umzustellen, sonst hätte `/wissen.html` neben den Kundenordner
  gezeigt statt hinein.
- **Das Porträt in der Kapsel „Über uns" ist ein Platzhalter.** Ein Stockgesicht
  neben dem Namen Philipp Lander wäre eine falsche Angabe über eine reale
  Person, deshalb steht dort „Porträt folgt".
- **Die Zahlen in den Mock-Oberflächen** (34 Einheiten, 14 h, 82 Prozent
  Stammbetriebe, die Rechnungsbeträge) sind plausible Beispielwerte, keine
  echten Objektdaten. Vor einem echten Livegang ersetzen oder kennzeichnen.
- **Die Icons in der Fußzeile** sind Platzhalter aus dem eigenen Set, nicht die
  Markenzeichen von Instagram, LinkedIn und ProvenExpert.

## Bildnachweis

Sieben Motive von Pexels, Lizenz erlaubt kommerzielle Nutzung und Bearbeitung.
Fotografen und Quell-Links stehen im Projektordner unter
`bilder/bildnachweis.txt`. Alle Motive sind auf ein gemeinsames warmes Duoton
gebracht, das Faktenband-Motiv ist zusätzlich freigestellt.

## Offene Punkte aus der Checkliste

- Gate 8 (Copy) und Gate 9 (Design) sind nicht formal freigegeben.
- Sieben mit 🟡 markierte Punkte in `copy.md` brauchen eine Aussage vom Kunden,
  darunter die § 26a-Zertifizierung, die Zahl 301+ und die
  Jahresabrechnungsfrist.
- Gate C: Variante A und B liegen beide vor, eine muss gewählt werden.

## Geprüft

1440 / 1280 / 1180 / 1024 / 860 / 768 / 560 / 390 px, jeweils Dunkel und Hell.
Kein horizontaler Overflow, keine Konsolenfehler, kein fehlendes Bild.
Dokumenthöhe 17.059 px auf dem Desktop, 24.043 px mobil. Umschalter und
Kartennavigation funktional getestet.
