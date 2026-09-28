import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPassHash1790610189546 implements MigrationInterface {
    name = 'AddPassHash1790610189546'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('PASSENGER', 'DRIVER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."users_role_enum" NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255), "wallet_balance_poysha" bigint NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "driver_id" uuid NOT NULL, "capacity" integer NOT NULL, "label" character varying(255) NOT NULL, "is_online" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9c2e0a8772c9e43b32f57bfcfcc" UNIQUE ("driver_id"), CONSTRAINT "REL_9c2e0a8772c9e43b32f57bfcfc" UNIQUE ("driver_id"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."pools_status_enum" AS ENUM('OPEN', 'LOCKED', 'IN_PROGRESS', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "pools" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle_id" uuid NOT NULL, "status" "public"."pools_status_enum" NOT NULL DEFAULT 'OPEN', "seats_capacity" integer NOT NULL, "seats_taken" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_0a5cf0fe27b1576cbc63d4c727" CHECK ("seats_taken" <= "seats_capacity"), CONSTRAINT "CHK_af35b3a48c0951ce3c2b53f8f9" CHECK ("seats_taken" >= 0), CONSTRAINT "PK_6708c86fc389259de3ee43230ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ACTIVE_POOL_PER_VEHICLE" ON "pools"  ("vehicle_id") WHERE status IN ('OPEN', 'LOCKED', 'IN_PROGRESS')`);
        await queryRunner.query(`CREATE TYPE "public"."ride_requests_status_enum" AS ENUM('REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "ride_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "passenger_id" uuid NOT NULL, "pool_id" uuid, "pickup_zone" character varying NOT NULL, "dest_zone" character varying NOT NULL, "seats_requested" integer NOT NULL, "status" "public"."ride_requests_status_enum" NOT NULL DEFAULT 'REQUESTED', "fare_amount_poysha" bigint NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_92c563a19918f0e48a844c143a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_9c2e0a8772c9e43b32f57bfcfcc" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pools" ADD CONSTRAINT "FK_95c413efd98af8da4e28ce3efa3" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ride_requests" ADD CONSTRAINT "FK_b3bf65a3de6eb4709fc2c296dfb" FOREIGN KEY ("passenger_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ride_requests" ADD CONSTRAINT "FK_2a605890d09583b44112185bc6d" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ride_requests" DROP CONSTRAINT "FK_2a605890d09583b44112185bc6d"`);
        await queryRunner.query(`ALTER TABLE "ride_requests" DROP CONSTRAINT "FK_b3bf65a3de6eb4709fc2c296dfb"`);
        await queryRunner.query(`ALTER TABLE "pools" DROP CONSTRAINT "FK_95c413efd98af8da4e28ce3efa3"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_9c2e0a8772c9e43b32f57bfcfcc"`);
        await queryRunner.query(`DROP TABLE "ride_requests"`);
        await queryRunner.query(`DROP TYPE "public"."ride_requests_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ACTIVE_POOL_PER_VEHICLE"`);
        await queryRunner.query(`DROP TABLE "pools"`);
        await queryRunner.query(`DROP TYPE "public"."pools_status_enum"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
