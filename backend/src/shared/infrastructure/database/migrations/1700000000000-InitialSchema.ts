import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const createEnum = async (name: string, values: string[]) => {
      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${name}') THEN
            CREATE TYPE "${name}" AS ENUM (${values.map((v) => `'${v}'`).join(', ')});
          END IF;
        END $$;
      `);
    };

    await createEnum('tenant_estado_enum',    ['ACTIVO', 'INACTIVO']);
    await createEnum('tenant_plan_enum',       ['BASICO', 'PROFESIONAL', 'ENTERPRISE']);
    await createEnum('user_role_enum',         ['TENANT_ADMIN', 'TENANT_USER', 'SUPER_ADMIN']);
    await createEnum('route_estado_enum',      ['ACTIVA', 'INACTIVA', 'EN_SERVICIO']);
    await createEnum('passenger_estado_enum',  ['PENDIENTE', 'EMBARCADO', 'EN_TRANSITO', 'LLEGO']);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre"           VARCHAR(255) NOT NULL,
        "nit"              VARCHAR(50)  NOT NULL UNIQUE,
        "ciudad"           VARCHAR(100) NOT NULL,
        "logo_url"         VARCHAR(500),
        "estado"           "tenant_estado_enum" NOT NULL DEFAULT 'ACTIVO',
        "plan_suscripcion" "tenant_plan_enum"   NOT NULL DEFAULT 'BASICO',
        "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre"        VARCHAR(255) NOT NULL,
        "email"         VARCHAR(255) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "role"          "user_role_enum" NOT NULL DEFAULT 'TENANT_USER',
        "activo"        BOOLEAN NOT NULL DEFAULT TRUE,
        "tenant_id"     UUID REFERENCES "tenants"("id") ON DELETE CASCADE,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "routes" (
        "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre"           VARCHAR(255) NOT NULL,
        "origen"           VARCHAR(255) NOT NULL,
        "destino"          VARCHAR(255) NOT NULL,
        "distancia_km"     DECIMAL(10,2),
        "horario"          JSONB,
        "paradas"          JSONB,
        "capacidad_maxima" INT NOT NULL DEFAULT 40,
        "estado"           "route_estado_enum" NOT NULL DEFAULT 'ACTIVA',
        "tenant_id"        UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "passengers" (
        "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre"              VARCHAR(255) NOT NULL,
        "documento"           VARCHAR(50)  NOT NULL,
        "telefono"            VARCHAR(30),
        "estado"              "passenger_estado_enum" NOT NULL DEFAULT 'PENDIENTE',
        "lat"                 DECIMAL(11,8),
        "lon"                 DECIMAL(11,8),
        "device_id_datatrack" VARCHAR(100),
        "ultimo_gps_update"   TIMESTAMPTZ,
        "route_id"            UUID REFERENCES "routes"("id") ON DELETE SET NULL,
        "tenant_id"           UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre"     VARCHAR(255) NOT NULL,
        "documento"  VARCHAR(50)  NOT NULL,
        "telefono"   VARCHAR(30),
        "email"      VARCHAR(255),
        "activo"     BOOLEAN NOT NULL DEFAULT TRUE,
        "tenant_id"  UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "IDX_clients_tenant_id" ON "clients" ("tenant_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"   CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "passengers" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "routes"    CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"     CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"   CASCADE;`);
  }
}
