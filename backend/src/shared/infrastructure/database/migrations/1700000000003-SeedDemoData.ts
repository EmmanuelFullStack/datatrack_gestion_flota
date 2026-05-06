import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Real demo data seeded from production DB.
 * Idempotent — ON CONFLICT DO NOTHING.
 * Order matters: tenants → users → routes → passengers → clients
 */
export class SeedDemoData1700000000003 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // ── Tenants ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "tenants" ("id","nombre","nit","ciudad","logo_url","estado","plan_suscripcion","created_at","updated_at") VALUES
      ('cd92f212-3ac5-4e71-aac8-6e70f267a823','Transportes Bogotá S.A.S','900123456-1','Bogotá',
       'https://cdn.pixabay.com/photo/2014/06/03/19/38/test-361512_640.jpg',
       'ACTIVO','BASICO','2026-05-05 17:03:42.481174-05','2026-05-05 17:03:42.481174-05'),
      ('62d42fef-03d2-4584-b556-5e19f4cf533f','TP BARRANQUILLA SAS','900160091','BARRANQUILLA',
       NULL,'ACTIVO','BASICO','2026-05-06 10:28:49.330297-05','2026-05-06 10:28:49.330297-05')
      ON CONFLICT DO NOTHING;
    `);

    // ── Users ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "users" ("id","nombre","email","password_hash","role","activo","tenant_id","created_at","updated_at") VALUES
      ('ecd088f2-898f-461e-adbc-2b1d966e03f0','Carlos Gómez','admin@empresa.com',
       '$2a$12$U1Hs6qTKm8EPTpUPVISLgOECjC31JUSouTwZIXhfJ7Frng25C.n9K',
       'TENANT_ADMIN',true,'cd92f212-3ac5-4e71-aac8-6e70f267a823',
       '2026-05-05 17:03:43.014187-05','2026-05-05 17:03:43.014187-05'),
      ('5686524e-66a3-44d7-86e1-f1f71a4c870e','Super Admin (System)','admin@datatrack.com',
       '$2a$12$96PHGe/Cz3k8NvnUknMM3.YhQmWGr4xfO.LXufGzj6r.zF9PRBzyy',
       'SUPER_ADMIN',true,NULL,
       '2026-05-06 09:29:37.413379-05','2026-05-06 09:29:37.413379-05'),
      ('415053f3-ff76-4102-b8ed-e4e9affbf241','TEST','admin2@empresa.com',
       '$2a$12$t8/zWLTTVLEhxMxLKJNVjOpxCnAMEoe/z9lsStaDKSYlUKbDMrC9e',
       'TENANT_ADMIN',true,'62d42fef-03d2-4584-b556-5e19f4cf533f',
       '2026-05-06 10:28:49.711665-05','2026-05-06 10:28:49.711665-05')
      ON CONFLICT DO NOTHING;
    `);

    // ── Routes ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "routes" ("id","nombre","origen","destino","distancia_km","horario","capacidad_maxima","estado","tenant_id","created_at","updated_at","paradas") VALUES
      ('0631b715-dc37-4688-8712-94583468f1f4','RUTA SUR',
       'Lat: 4.5997, Lon: -74.1322','Lat: 4.5953, Lon: -74.1207',
       2.38,NULL,40,'ACTIVA','cd92f212-3ac5-4e71-aac8-6e70f267a823',
       '2026-05-06 07:26:38.88854-05','2026-05-06 07:26:38.88854-05',
       '[{"lat":4.5996960724789,"lon":-74.13217977432578,"orden":0,"nombre":"Origen"},{"lat":4.598498311917032,"lon":-74.12049484350621,"orden":1,"nombre":"Parada 1"},{"lat":4.595290014777197,"lon":-74.12073369135521,"orden":2,"nombre":"Destino"}]'),
      ('86df7c77-a218-40fa-bff0-66de3ee1cd65','RUTA NORTE',
       'Lat: 10.9896, Lon: -74.7789','Lat: 11.0018, Lon: -74.7845',
       1.51,NULL,40,'ACTIVA','cd92f212-3ac5-4e71-aac8-6e70f267a823',
       '2026-05-06 07:44:21.006864-05','2026-05-06 08:04:31.673101-05',
       '[{"lat":10.98959926256958,"lon":-74.77891445159914,"orden":0,"nombre":"Origen"},{"lat":11.00179689681541,"lon":-74.78445053100587,"orden":1,"nombre":"Destino"}]'),
      ('1d0c9afc-8e95-4aa4-89db-ac6cc0b8800c','TEST',
       'Lat: 4.6007, Lon: -74.1314','Lat: 4.5973, Lon: -74.1272',
       0.69,NULL,40,'ACTIVA','cd92f212-3ac5-4e71-aac8-6e70f267a823',
       '2026-05-06 09:40:00.123841-05','2026-05-06 09:40:00.123841-05',
       '[{"lat":4.6007187124358735,"lon":-74.13136482238771,"orden":0,"nombre":"Origen"},{"lat":4.597296538972065,"lon":-74.12715911865236,"orden":1,"nombre":"Destino"}]')
      ON CONFLICT DO NOTHING;
    `);

    // ── Passengers ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "passengers" ("id","nombre","documento","telefono","estado","lat","lon","device_id_datatrack","ultimo_gps_update","route_id","tenant_id","created_at","updated_at") VALUES
      ('e03036fd-2211-4596-9188-fe0aa3fedc99','JUAN CARLOS SANTANA','1234567411','+578964156',
       'EN_TRANSITO',10.16382990,-75.65301500,'402193285',
       '2026-05-06 11:38:00.54-05','0631b715-dc37-4688-8712-94583468f1f4',
       'cd92f212-3ac5-4e71-aac8-6e70f267a823','2026-05-06 07:36:54.918517-05','2026-05-06 11:38:00.542738-05'),
      ('ffb87b36-0161-4de1-b3cf-35afffbe007e','DEIVIS PALENCIA','123456789','+573017860211',
       'EN_TRANSITO',10.98541160,-74.78790000,'402236685',
       '2026-05-06 11:38:00.55-05','0631b715-dc37-4688-8712-94583468f1f4',
       'cd92f212-3ac5-4e71-aac8-6e70f267a823','2026-05-06 07:35:50.791892-05','2026-05-06 11:38:00.552251-05'),
      ('a98b153a-2077-4b75-b0c9-09b0308f03b0','EMMANUEL RAMOS','1001778568','3017860211',
       'EN_TRANSITO',10.92454500,-74.81155490,'402097201',
       '2026-05-06 11:38:00.555-05','0631b715-dc37-4688-8712-94583468f1f4',
       'cd92f212-3ac5-4e71-aac8-6e70f267a823','2026-05-06 07:35:16.048946-05','2026-05-06 11:38:00.556871-05'),
      ('74fe078f-4588-47b0-a07f-41ed3d3ecbec','ADRIANA VALENCIA','4575116578','+5798413554',
       'PENDIENTE',10.93911500,-75.02163160,'402205126',
       '2026-05-06 11:38:00.559-05','86df7c77-a218-40fa-bff0-66de3ee1cd65',
       'cd92f212-3ac5-4e71-aac8-6e70f267a823','2026-05-06 07:37:32.316641-05','2026-05-06 11:38:00.56098-05'),
      ('8875ab3e-8a1d-4c8d-aabb-a1b944718d2c','TEST','45415213351','+578515',
       'PENDIENTE',NULL,NULL,'',
       NULL,NULL,
       'cd92f212-3ac5-4e71-aac8-6e70f267a823','2026-05-06 10:07:41.241788-05','2026-05-06 10:07:41.241788-05')
      ON CONFLICT DO NOTHING;
    `);

    // ── Clients ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "clients" ("id","nombre","documento","telefono","email","activo","tenant_id","created_at","updated_at") VALUES
      ('a8ef4af7-1c10-4ea2-aa14-c8b7d1616f96','SAN CARLOS','900160091','3017860211',
       'test@sancarlos.com',true,'cd92f212-3ac5-4e71-aac8-6e70f267a823',
       '2026-05-05 18:57:44.10287-05','2026-05-05 18:57:44.10287-05')
      ON CONFLICT DO NOTHING;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "clients"   WHERE id = 'a8ef4af7-1c10-4ea2-aa14-c8b7d1616f96';`);
    await queryRunner.query(`DELETE FROM "passengers" WHERE id IN ('e03036fd-2211-4596-9188-fe0aa3fedc99','ffb87b36-0161-4de1-b3cf-35afffbe007e','a98b153a-2077-4b75-b0c9-09b0308f03b0','74fe078f-4588-47b0-a07f-41ed3d3ecbec','8875ab3e-8a1d-4c8d-aabb-a1b944718d2c');`);
    await queryRunner.query(`DELETE FROM "routes"    WHERE id IN ('0631b715-dc37-4688-8712-94583468f1f4','86df7c77-a218-40fa-bff0-66de3ee1cd65','1d0c9afc-8e95-4aa4-89db-ac6cc0b8800c');`);
    await queryRunner.query(`DELETE FROM "users"     WHERE id IN ('ecd088f2-898f-461e-adbc-2b1d966e03f0','5686524e-66a3-44d7-86e1-f1f71a4c870e','415053f3-ff76-4102-b8ed-e4e9affbf241');`);
    await queryRunner.query(`DELETE FROM "tenants"   WHERE id IN ('cd92f212-3ac5-4e71-aac8-6e70f267a823','62d42fef-03d2-4584-b556-5e19f4cf533f');`);
  }
}
