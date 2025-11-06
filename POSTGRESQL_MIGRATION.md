# PostgreSQL Migration Guide

Diese Anleitung hilft Ihnen, die Anwendung von TiDB/MySQL auf PostgreSQL umzustellen, wenn Sie Ihre eigene VN mit NocoDB einrichten.

## Voraussetzungen

- PostgreSQL-Datenbank eingerichtet (auf Ihrer VN)
- NocoDB installiert und mit PostgreSQL verbunden
- Neue DATABASE_URL für PostgreSQL

## Schritt 1: Datenbank-URL aktualisieren

Ändern Sie die `DATABASE_URL` Umgebungsvariable auf Ihre PostgreSQL-Verbindung:

```
DATABASE_URL=postgresql://user:password@host:port/database
```

## Schritt 2: Code-Änderungen

### 2.1 server/db.ts

Ersetzen Sie die MySQL-Imports:

```typescript
// Vorher (MySQL):
import { drizzle } from "drizzle-orm/mysql2";

// Nachher (PostgreSQL):
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
```

Und die Verbindung:

```typescript
// Vorher (MySQL):
_db = drizzle(process.env.DATABASE_URL);

// Nachher (PostgreSQL):
const client = postgres(process.env.DATABASE_URL);
_db = drizzle(client);
```

### 2.2 drizzle/schema.ts

Ersetzen Sie alle MySQL-Tabellen-Definitionen mit PostgreSQL:

```typescript
// Vorher (MySQL):
import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  // ...
});

// Nachher (PostgreSQL):
import { pgTable, serial, varchar, text, timestamp, pgEnum, boolean, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // ...
});
```

**Wichtige Typ-Änderungen:**
- `mysqlTable` → `pgTable`
- `int().autoincrement()` → `serial()`
- `mysqlEnum` → `pgEnum` (muss vorher definiert werden)
- `json` → `jsonb`
- `boolean` bleibt `boolean`
- `timestamp().defaultNow()` → `timestamp().defaultNow()`

## Schritt 3: Migrationen ausführen

```bash
pnpm db:push
```

## Schritt 4: Daten migrieren (optional)

Wenn Sie bestehende Daten haben:

1. Export aus TiDB/MySQL:
```bash
mysqldump -u user -p database > backup.sql
```

2. Konvertieren und Import in PostgreSQL (manuell oder mit Tools wie pgLoader)

## Schritt 5: NocoDB verbinden

1. Öffnen Sie NocoDB
2. Verbinden Sie mit Ihrer PostgreSQL-Datenbank
3. Alle Tabellen sollten automatisch erkannt werden

## Vorteile von PostgreSQL + NocoDB

- ✅ Bessere Performance für komplexe Queries
- ✅ Native JSON-Unterstützung (jsonb)
- ✅ Vollständige NocoDB-Integration
- ✅ Erweiterte Datentypen
- ✅ Bessere Skalierbarkeit

## Hinweise

- Die Anwendung ist bereits mit dem `postgres` Paket vorbereitet
- Alle notwendigen Imports sind als Kommentare in `server/db.ts` hinterlegt
- Testen Sie die Migration zuerst in einer Entwicklungsumgebung
