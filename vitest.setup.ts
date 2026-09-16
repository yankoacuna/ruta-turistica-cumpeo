// Variables mínimas para que los módulos importados por los tests no fallen
// al construirse (SESSION_SECRET lo exige auth.ts, DATABASE_URL lo exige el
// constructor de PrismaClient) — ningún test acá hace una consulta real.
process.env.SESSION_SECRET ||= 'a'.repeat(32);
process.env.DATABASE_URL ||= 'mysql://user:pass@localhost:3306/test';
