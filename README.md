# MVP

## Scripts

- `npm test`: ejecuta la suite de pruebas con [Vitest](https://vitest.dev/).
- `npm run lint`: analiza el código con ESLint.
- `npm run prisma:generate`: genera el cliente de Prisma en base al esquema actual.


Project Overview

This project uses [Prisma](https://www.prisma.io/) with a SQLite database.

Ensure the `DATABASE_URL` in your `.env` file points to a SQLite database file, e.g.

```
DATABASE_URL="file:./dev.db"
```

Run `npx prisma format` and `npx prisma validate` after modifying the Prisma schema to keep it consistent and valid.
