-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "reviewAssignments" BOOLEAN NOT NULL DEFAULT true,
    "reviewSubmissions" BOOLEAN NOT NULL DEFAULT true,
    "projectUpdates" BOOLEAN NOT NULL DEFAULT true,
    "redFlagAlerts" BOOLEAN NOT NULL DEFAULT true,
    "documentUploads" BOOLEAN NOT NULL DEFAULT false,
    "statusChanges" BOOLEAN NOT NULL DEFAULT true,
    "milestoneReminders" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
