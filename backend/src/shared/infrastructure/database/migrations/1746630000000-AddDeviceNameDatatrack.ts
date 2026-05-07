import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceNameDatatrack1746630000000 implements MigrationInterface {
  name = 'AddDeviceNameDatatrack1746630000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "passengers"
      ADD COLUMN IF NOT EXISTS "device_name_datatrack" VARCHAR(255) NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "passengers"
      DROP COLUMN IF EXISTS "device_name_datatrack"
    `);
  }
}
