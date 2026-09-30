import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditAndDriverOps1790748405222 implements MigrationInterface {
    name = 'AddAuditAndDriverOps1790748405222'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ride_status_history_fromstatus_enum" AS ENUM('REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."ride_status_history_tostatus_enum" AS ENUM('REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "ride_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ride_request_id" uuid NOT NULL, "fromStatus" "public"."ride_status_history_fromstatus_enum", "toStatus" "public"."ride_status_history_tostatus_enum" NOT NULL, "changed_by" uuid, "changed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2668b7c363b2774279a019fd451" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ride_status_history" ADD CONSTRAINT "FK_0d863230e55a936a9d5e114813b" FOREIGN KEY ("ride_request_id") REFERENCES "ride_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ride_status_history" ADD CONSTRAINT "FK_4fb4221343598b8008a9990db17" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ride_status_history" DROP CONSTRAINT "FK_4fb4221343598b8008a9990db17"`);
        await queryRunner.query(`ALTER TABLE "ride_status_history" DROP CONSTRAINT "FK_0d863230e55a936a9d5e114813b"`);
        await queryRunner.query(`DROP TABLE "ride_status_history"`);
        await queryRunner.query(`DROP TYPE "public"."ride_status_history_tostatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ride_status_history_fromstatus_enum"`);
    }

}
