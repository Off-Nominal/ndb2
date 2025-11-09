import { Client, PoolClient } from "pg";
import { createLogger } from "@mendahu/utilities";

const TRUNCATE_ALL_TABLES = `
  DO $$ 
  DECLARE 
    r RECORD;
  BEGIN
    -- Disable all triggers temporarily
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
      EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE TRIGGER ALL';
    END LOOP;
    
    -- Truncate all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
      EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Re-enable all triggers
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
      EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE TRIGGER ALL';
    END LOOP;
  END $$;
`;

const RESET_SEQUENCES = `
  DO $$ 
  DECLARE 
    r RECORD;
  BEGIN
    -- Reset all sequences to 1
    FOR r IN (
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    ) LOOP
      EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' RESTART WITH 1';
    END LOOP;
  END $$;
`;

export default async (client: Client | PoolClient) => {
  const logger = createLogger({ namespace: "DB", env: ["dev"] });

  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run seeding in production.");
  }

  try {
    // Truncate all tables with foreign key handling
    await client.query(TRUNCATE_ALL_TABLES);

    // Reset all sequences
    await client.query(RESET_SEQUENCES);

    logger.log("All tables emptied and sequences reset successfully");
  } catch (error) {
    console.error("Error emptying tables:", error);
    throw error;
  }
};
