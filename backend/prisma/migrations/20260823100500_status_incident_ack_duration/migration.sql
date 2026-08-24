-- AlterTable
ALTER TABLE "StatusEvent" ADD COLUMN "durationSeconds" INTEGER,
ADD COLUMN "acknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN "acknowledgedBy" TEXT,
ADD COLUMN "minor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN "statusEventId" TEXT,
ADD COLUMN "durationSeconds" INTEGER,
ADD COLUMN "recoveredAt" TIMESTAMP(3),
ADD COLUMN "minor" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Alert_statusEventId_key" ON "Alert"("statusEventId");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_statusEventId_fkey" FOREIGN KEY ("statusEventId") REFERENCES "StatusEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
